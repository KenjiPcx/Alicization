import { getAuthUserId } from "@convex-dev/auth/server";
import { internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { vArtifactKinds } from "./schema";
import { components, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { generateUUID } from "@/lib/utils";
import { model } from "@/lib/ai/model";
import { Agent } from "@convex-dev/agent";

// We store different versions of the same artifact in the database, the artifactId is the same for all versions
// Convex adds its own id

/**
 * Get all versions of an artifact
 */
export const getArtifactsByGroupId = query({
    args: {
        artifactGroupId: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("User not authenticated");
        }

        const artifacts = await ctx.db.query("artifacts")
            .withIndex("by_artifactGroupId", (q) => q.eq("artifactGroupId", args.artifactGroupId))
            .order("asc")
            .collect();

        return artifacts;
    },
});

export const getLatestArtifactByGroupId = internalQuery({
    args: {
        artifactGroupId: v.string(),
    },
    handler: async (ctx, args) => {
        const latestArtifact = await ctx.db.query("artifacts")
            .withIndex("by_artifactGroupId", (q) => q.eq("artifactGroupId", args.artifactGroupId))
            .order("desc")
            .first();

        return latestArtifact;
    },
});

export const getArtifactByToolCallId = query({
    args: {
        toolCallId: v.string(),
    },
    handler: async (ctx, args): Promise<Doc<"artifacts"> | null> => {
        const { toolCallId } = args;
        return await ctx.db.query("artifacts").withIndex("by_toolCallId", (q) => q.eq("toolCallId", toolCallId)).first();
    },
});

export const getArtifactsByToolCallId = query({
    args: {
        toolCallId: v.string(),
    },
    handler: async (ctx, args): Promise<Doc<"artifacts">[] | null> => {
        const { toolCallId } = args;

        const artifact = await ctx.db.query("artifacts")
            .withIndex("by_toolCallId", (q) => q.eq("toolCallId", toolCallId))
            .first();

        if (!artifact) {
            return null;
        }

        const artifacts = await ctx.db.query("artifacts")
            .withIndex("by_artifactGroupId", (q) => q.eq("artifactGroupId", artifact.artifactGroupId))
            .order("desc")
            .collect();

        return artifacts;
    },
})

export const createArtifact = internalMutation({
    args: {
        artifactGroupId: v.string(),
        title: v.string(),
        kind: vArtifactKinds,
        employeeId: v.string(),
        version: v.number(),
        toolCallId: v.string(),
    },
    returns: v.id("artifacts"),
    handler: async (ctx, args) => {

        const { artifactGroupId, title, kind, employeeId, version, toolCallId } = args;

        const artifactId = await ctx.db.insert("artifacts", {
            artifactGroupId,
            version,
            title,
            content: "",
            kind,
            employeeId,
            toolCallId,
        });

        return artifactId;
    },
});

export const handleArtifactTextChunk = internalMutation({
    args: {
        artifactId: v.id("artifacts"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const { artifactId, content } = args;

        const artifact = await ctx.db.get(artifactId);
        if (!artifact) {
            throw new Error("Artifact not found");
        }

        // If stream is a text stream we append, but if its a partial object we replace the object
        let newContent = artifact.content;
        if (content) {
            if (artifact.kind === "text" || artifact.kind === "code" || artifact.kind === "sheet") {
                newContent = artifact.content + content;
            } else {
                newContent = content;
            }
        }

        await ctx.db.patch(artifactId, {
            content: newContent,
        });
    },
});

export const generateArtifact = internalAction({
    args: {
        existingArtifactGroupId: v.optional(v.string()),
        threadId: v.string(),
        employeeId: v.string(),
        title: v.string(),
        kind: vArtifactKinds,
        generationPrompt: v.string(),
        scheduled: v.optional(v.boolean()),
        toolCallId: v.string(),
        backgroundJobStatusId: v.id("backgroundJobStatuses"),
    },
    handler: async (ctx, args) => {
        const {
            existingArtifactGroupId,
            threadId,
            employeeId,
            title,
            kind,
            generationPrompt,
            scheduled,
            toolCallId,
            backgroundJobStatusId
        } = args;

        // Determine the version of the artifact, increment it if it exists
        let version = 1;
        let latestArtifactContent = undefined;

        if (existingArtifactGroupId) {
            // It means that we need to get the latest version and increment it
            const latestArtifact = await ctx.runQuery(internal.artifacts.getLatestArtifactByGroupId, {
                artifactGroupId: existingArtifactGroupId,
            });
            if (!latestArtifact) throw new Error("Artifact not found");
            version = latestArtifact.version + 1;
            latestArtifactContent = latestArtifact.content;
        }

        // Create artifact
        const artifactGroupId = existingArtifactGroupId || generateUUID();
        const artifactId: Id<"artifacts"> = await ctx.runMutation(internal.artifacts.createArtifact, {
            artifactGroupId,
            version,
            title,
            kind,
            employeeId,
            toolCallId,
        });

        const payload = {
            artifactId,
            artifactGroupId,
            latestArtifactContent,
            threadId,
            userId: employeeId,
            prompt: generationPrompt,
            backgroundJobStatusId,
        }

        let artifactContent = "";
        // Generate the artifact based on the kind
        switch (kind) {
            case "text":
                artifactContent = await ctx.runAction(internal.artifactGenerators.textWriter.generateTextArtifact, payload);
                break;
            case "code":
                artifactContent = await ctx.runAction(internal.artifactGenerators.codeWriter.generateCodeArtifact, payload);
                break;
            case "sheet":
                artifactContent = await ctx.runAction(internal.artifactGenerators.sheetWriter.generateSheetArtifact, payload);
                break;
            case "image":
                artifactContent = await ctx.runAction(internal.artifactGenerators.imageGenerator.generateImageArtifact, payload);
                break;
            case "video":
                throw new Error(`Not yet implemented: ${kind}`);
            default:
                throw new Error(`Unsupported artifact kind: ${kind}`);
        }

        const message = `Artifact ${artifactGroupId} of type ${kind} ${existingArtifactGroupId ? "updated" : "created"} successfully. Call the viewArtifact tool to showcase the artifact to the user.`;
        await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
            backgroundJobStatusId,
            status: scheduled ? "notify-supervisor" : "completed",
            message,
            progress: 100,
            result: `${message}`,
        });

        return {
            artifactGroupId,
            title,
            kind,
            content: artifactContent,
        };
    },
});