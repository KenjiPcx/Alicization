import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";

// Team configuration with desk counts
const TEAM_CONFIG = {
    "Marketing": { deskCount: 6, clusterPos: [-12, 0, -5] },
    "Sales": { deskCount: 6, clusterPos: [0, 0, -5] },
    "Engineering": { deskCount: 6, clusterPos: [12, 0, -5] },
    "Design": { deskCount: 6, clusterPos: [-12, 0, 5] },
    "Customer Success": { deskCount: 6, clusterPos: [0, 0, 5] },
    "Product": { deskCount: 6, clusterPos: [12, 0, 5] },
    "Management": { deskCount: 1, clusterPos: [0, 0, 15] }, // CEO position
};

export const seedTeams = mutation({
    args: {
        companyId: v.id("companies"),
    },
    handler: async (ctx, { companyId }): Promise<{ message: string, teams: Doc<"teams">[] }> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check if teams already exist
        const existingTeams = await ctx.db
            .query("teams")
            .filter((q) => q.eq(q.field("userId"), userId))
            .collect();

        if (existingTeams.length > 0) {
            console.log("Teams already seeded");
            return { message: "Teams already exist", teams: existingTeams };
        }

        const teams: Doc<"teams">[] = [];

        // Create all teams including Management
        for (const [teamName, config] of Object.entries(TEAM_CONFIG)) {
            const teamId = await ctx.db.insert("teams", {
                userId,
                name: teamName,
                description: teamName === "Management"
                    ? "Executive leadership team"
                    : `${teamName} - A dynamic team working on various projects`,
                clusterPosition: config.clusterPos,
                deskCount: config.deskCount,
                companyId: companyId,
            });
            const team = await ctx.db.get(teamId) as Doc<"teams">;
            teams.push(team);
        }

        return { message: "Teams seeded successfully", teams };
    },
});

export const createTeam = internalMutation({
    args: {
        name: v.string(),
        description: v.string(),
        deskCount: v.optional(v.number()),
        clusterPosition: v.optional(v.array(v.number())),
        companyId: v.id("companies"),
        userId: v.id("users"),
    },
    handler: async (ctx, args): Promise<Id<"teams">> => {
        return await ctx.db.insert("teams", {
            ...args,
        });
    },
});

export const getTeams = internalQuery({
    args: {
        companyId: v.id("companies"),
    },
    handler: async (ctx, { companyId }): Promise<Doc<"teams">[]> => {
        return await ctx.db
            .query("teams")
            .filter((q) => q.eq(q.field("companyId"), companyId))
            .collect();
    },
});

export const getAllTeams = query({
    args: {
        companyId: v.id("companies"),
    },
    handler: async (ctx, { companyId }): Promise<Doc<"teams">[]> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        return await ctx.runQuery(internal.teams.getTeams, { companyId });
    },
});

export const getTeamByName = query({
    args: { name: v.string() },
    handler: async (ctx, { name }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        return await ctx.db
            .query("teams")
            .filter((q) =>
                q.and(
                    q.eq(q.field("userId"), userId),
                    q.eq(q.field("name"), name)
                )
            )
            .first();
    },
});

export const getTeamSupervisor = query({
    args: { teamId: v.id("teams") },
    handler: async (ctx, { teamId }) => {
        const supervisor = await ctx.db
            .query("employees")
            .withIndex("by_teamId", (q) => q.eq("teamId", teamId))
            .filter((q) => q.eq(q.field("isSupervisor"), true))
            .first();

        return supervisor;
    },
});

export const getTeamById = query({
    args: { teamId: v.id("teams") },
    handler: async (ctx, { teamId }) => {
        return await ctx.db.get(teamId);
    },
});

export const updateTeamPosition = mutation({
    args: {
        teamId: v.id("teams"),
        position: v.array(v.number()),
    },
    handler: async (ctx, { teamId, position }) => {
        await ctx.db.patch(teamId, { clusterPosition: position });
    },
});

export const clearTeams = mutation({
    args: {},
    handler: async (ctx) => {
        const teams = await ctx.db.query("teams").collect();
        for (const team of teams) {
            await ctx.db.delete(team._id);
        }
    },
});

export const reorganizeOfficeLayout = mutation({
    args: {
        newLayout: v.optional(v.array(v.object({
            teamId: v.id("teams"),
            clusterPosition: v.array(v.number()),
        }))),
    },
    handler: async (ctx, { newLayout }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        if (newLayout) {
            // Apply specific layout
            for (const { teamId, clusterPosition } of newLayout) {
                await ctx.db.patch(teamId, { clusterPosition });
            }
        } else {
            // Auto-arrange teams in a circle (excluding Management)
            const teams = await ctx.db
                .query("teams")
                .filter((q) => q.eq(q.field("userId"), userId))
                .collect();

            const nonManagementTeams = teams.filter(t => t.name !== "Management");
            const radius = 6;
            const angleStep = (2 * Math.PI) / nonManagementTeams.length;

            for (let i = 0; i < nonManagementTeams.length; i++) {
                const angle = i * angleStep;
                const x = radius * Math.cos(angle);
                const z = radius * Math.sin(angle);

                await ctx.db.patch(nonManagementTeams[i]._id, {
                    clusterPosition: [x, 0, z]
                });
            }
        }

        return { success: true };
    },
});

export const setTeamCompanyId = mutation({
    args: {
        teamId: v.id("teams"),
        companyId: v.id("companies"),
    },
    handler: async (ctx, { teamId, companyId }) => {
        await ctx.db.patch(teamId, { companyId });
    },
});