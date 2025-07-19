import { RAG } from "@convex-dev/rag";
import { components } from "./_generated/api";
import { embeddingModel } from "@/lib/ai/model";
import { WorkflowManager } from "@convex-dev/workflow";

export const rag = new RAG(components.rag, {
    textEmbeddingModel: embeddingModel,
    embeddingDimension: 1536, // Needs to match your embedding model
});

export const workflow = new WorkflowManager(components.workflow, {
    workpoolOptions: {
        maxParallelism: 100,
    },
});
