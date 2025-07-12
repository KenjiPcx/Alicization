import { useInterpreter, useInterpreterPrompt } from "./interpreter";
import { useWebSearchPrompt, webSearch } from "./web-search";
import { createArtifact, updateArtifact, useArtifactsPrompt } from "./artifacts";
import { useBrowser } from "./browser-use";
import { privateKnowledgeSearch, usePrivateKnowledgeSearchPrompt } from "./private-search";
import dedent from "dedent";

export const baseToolsPrompt = dedent`
    Here are some base tools that you can use to help you with your task:

    <Base Tools>
    ${useWebSearchPrompt}
    ${usePrivateKnowledgeSearchPrompt}
    ${useInterpreterPrompt}
    ${useArtifactsPrompt}
    </Base Tools>
`

export const baseTools = {
    useInterpreter,
    webSearch,
    createArtifact,
    updateArtifact,
    useBrowser,
    privateKnowledgeSearch,
}