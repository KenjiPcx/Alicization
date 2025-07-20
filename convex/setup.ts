import { RAG } from "@convex-dev/rag";
import { components } from "./_generated/api";
import { embeddingModel } from "@/lib/ai/model";
import { WorkflowManager } from "@convex-dev/workflow";

type FilterTypes = {
    category: string;
    contentType: string;
    teamId: string;
    employeeId: string;
};

export const rag = new RAG<FilterTypes>(components.rag, {
    textEmbeddingModel: embeddingModel,
    embeddingDimension: 1536, // Needs to match your embedding model,
    filterNames: ["category", "contentType", "teamId", "employeeId"],
});

export const workflow = new WorkflowManager(components.workflow, {
    workpoolOptions: {
        maxParallelism: 50,
    },
});
