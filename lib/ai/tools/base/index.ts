import { useInterpreter } from "./interpreter";
import { webSearch } from "./web-search";
import { createArtifact, updateArtifact } from "./artifacts";
import { useBrowser } from "./browser-use";
import { privateKnowledgeSearch } from "./private-search";

export const baseTools = {
    useInterpreter,
    webSearch,
    createArtifact,
    updateArtifact,
    useBrowser,
    privateKnowledgeSearch,
}