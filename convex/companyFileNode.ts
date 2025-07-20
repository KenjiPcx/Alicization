"use node"

import { model, embeddingModel, quickSummaryModel } from "@/lib/ai/model";
import { MDocument } from "@mastra/rag";
import { generateObject, embedMany } from "ai";
import { v } from "convex/values";
import dedent from "dedent";
import { getDocumentProxy, extractText } from "unpdf";
import z from "zod";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { internalAction, ActionCtx } from "./_generated/server";
import { rag } from "./setup";

// This gives us page embeddings
export const ingestFile = internalAction({
    args: {
        url: v.string(),
        name: v.string(),
        contentType: v.string(),
        companyFileId: v.id("companyFiles"),
        companyId: v.id("companies"),
        category: v.optional(v.string()),
        backgroundJobStatusId: v.id("backgroundJobStatuses"),
        teamId: v.id("teams"),
        employeeId: v.id("employees"),
    },
    handler: async (ctx, args): Promise<void> => {
        const { url, name, contentType, companyFileId, companyId, category = "document", backgroundJobStatusId, teamId, employeeId } = args;

        try {
            // Get actual content type from response
            const headResponse = await fetch(url, { method: 'HEAD' });
            const actualContentType = headResponse.headers.get("content-type") || contentType;

            // Update status - start downloading
            await updateStatusHelper(
                ctx,
                backgroundJobStatusId,
                companyFileId,
                "running",
                "in-progress",
                "Downloading and extracting text from file...",
                10
            );

            // Download the file
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.statusText}`);
            }

            const fileBuffer = await response.arrayBuffer();
            let fileContentText: string[] = [];

            if (actualContentType === 'application/pdf') {
                const pdf = await getDocumentProxy(new Uint8Array(fileBuffer));
                const { text } = await extractText(pdf, {
                    mergePages: false, // Keep pages separate for better metadata
                });
                fileContentText = text;
            } else if (actualContentType?.startsWith('text/')) {
                fileContentText = [new TextDecoder().decode(fileBuffer)];
            } else {
                // For other file types, try to decode as text
                try {
                    fileContentText = [new TextDecoder().decode(fileBuffer)];
                } catch (decodeError) {
                    throw new Error(`Unsupported file type: ${actualContentType}`);
                }
            }

            if (!fileContentText.length || fileContentText.every(text => !text.trim())) {
                throw new Error("File appears to be empty or unreadable");
            }

            // Generate summary and tags
            await updateStatusHelper(
                ctx,
                backgroundJobStatusId,
                companyFileId,
                "running",
                "in-progress",
                "Generating summary and extracting tags...",
                25
            );

            const { object } = await generateObject({
                model,
                schema: z.object({
                    summary: z.string(),
                    tags: z.array(z.string()).max(5),
                }),
                prompt: dedent(`
                    Extract a comprehensive summary and up to 5 relevant tags from the following text.
                    Focus on the main topics, key concepts, and important information.
                    
                    Text: 
                    ${fileContentText.join('\n').slice(0, 10000)}
                `),
            });

            // Save summary and tags to company file
            await ctx.runAction(internal.companyFiles.fillCompanyFileSummaryAndTags, {
                companyFileId,
                summary: object.summary,
                tags: object.tags,
            });

            // Chunking with Mastra RAG for rich metadata
            await updateStatusHelper(
                ctx,
                backgroundJobStatusId,
                companyFileId,
                "running",
                "in-progress",
                "Chunking file and extracting metadata...",
                50
            );

            const extractorArgs = {
                llm: quickSummaryModel,
            }
            const chunkingTasks = fileContentText.map(async (page, i) => {
                const doc = MDocument.fromText(page);
                const chunks = await doc.chunk({
                    strategy: 'recursive',
                    size: 1024,
                    overlap: 256,
                    extract: {
                        title: extractorArgs,
                        questions: extractorArgs,
                        keywords: extractorArgs,
                        summary: extractorArgs,
                    },
                });

                // Include additional metadata
                chunks.forEach((chunk) => {
                    chunk.metadata.page = i + 1;
                });

                return chunks;
            });

            const chunks = (await Promise.all(chunkingTasks)).flat();

            // Create custom embeddings
            await updateStatusHelper(
                ctx,
                backgroundJobStatusId,
                companyFileId,
                "running",
                "in-progress",
                "Generating embeddings with rich metadata...",
                75
            );

            const { embeddings } = await embedMany({
                values: chunks.map((chunk) => {
                    // Create rich embedding text that includes metadata
                    const embeddingText = dedent(`
                        Document: ${name}
                        Category: ${category}
                        Page: ${chunk.metadata.page}
                        
                        ${chunk.metadata.title ? `Title: ${chunk.metadata.title}` : ''}
                        ${chunk.metadata.summary ? `Summary: ${chunk.metadata.summary}` : ''}
                        ${chunk.metadata.keywords ? `Keywords: ${chunk.metadata.keywords}` : ''}
                        ${chunk.metadata.questions ? `Related Questions: ${chunk.metadata.questions}` : ''}
                        
                        Content:
                        ${chunk.text}
                    `);
                    return embeddingText;
                }),
                model: embeddingModel,
            });

            // Create chunks with embeddings for RAG
            const chunksWithEmbeddings = embeddings.map((embedding, i) => {
                const chunk = chunks[i];
                chunk.metadata.sourceUrl = url;
                chunk.metadata.fileName = name;
                chunk.metadata.contentType = actualContentType;

                return {
                    ...chunks[i],
                    embedding,
                }
            });

            // Save chunks to RAG
            await rag.add(ctx, {
                key: companyFileId,
                namespace: companyId,
                chunks: chunksWithEmbeddings,
                metadata: {
                    url,
                    name,
                    contentType: actualContentType,
                    category,
                    companyFileId,
                    companyId,
                },
                filterValues: [
                    { name: "category", value: category },
                    { name: "contentType", value: actualContentType },
                    { name: "teamId", value: teamId },
                    { name: "employeeId", value: employeeId },
                ],
                onComplete: internal.companyFiles.ingestionComplete,
            });

            // Update final status
            await updateStatusHelper(
                ctx,
                backgroundJobStatusId,
                companyFileId,
                "completed",
                "completed",
                "File processing completed successfully!",
                100
            );

            console.log(`Successfully ingested file: ${name} with ${chunks.length} chunks`);

        } catch (error) {
            console.error('Error in ingestFile:', error);

            // Update status to failed
            await updateStatusHelper(
                ctx,
                backgroundJobStatusId,
                companyFileId,
                "failed",
                "failed",
                `Ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                100
            );

            throw error;
        }
    }
})

const updateStatusHelper = async (
    ctx: ActionCtx,
    backgroundJobStatusId: Id<"backgroundJobStatuses">,
    companyFileId: Id<"companyFiles">,
    backgroundJobStatus: "pending" | "completed" | "failed" | "running" | "notify-supervisor",
    companyFileEmbeddingStatus: "pending" | "in-progress" | "completed" | "failed" | "not-applicable",
    message: string,
    progress: number
) => {
    await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
        backgroundJobStatusId,
        status: backgroundJobStatus,
        message: message,
        progress: progress,
    });

    await ctx.runMutation(internal.companyFiles.updateCompanyFileEmbeddingStatus, {
        companyFileId,
        embeddingStatus: companyFileEmbeddingStatus,
        embeddingProgress: progress,
        embeddingMessage: message,
    });
}