import { useInterpreter } from "./interpreter";
import { webSearch } from "./webSearch";
import { createArtifact, showcaseArtifact, updateArtifact } from "./artifacts";
import { useBrowser } from "./browserUse";
import { privateKnowledgeSearch } from "./privateSearch";

export const executorTools = {
    useInterpreter,
    webSearch,
    createArtifact,
    updateArtifact,
    showcaseArtifact,
    useBrowser,
    privateKnowledgeSearch,
}