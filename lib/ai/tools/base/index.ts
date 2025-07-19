import { useInterpreter, useInterpreterPrompt } from "./interpreter";
import { useWebSearchPrompt, webSearch } from "./web-search";
import { createArtifact, updateArtifact, useArtifactsPrompt } from "./artifacts";
import { useBrowser } from "./browser-use";
import { resolveCompanyFileSearchTool, useCompanyFileSearchPrompt } from "../advanced/company-file-search";
import dedent from "dedent";
import { ResolveToolProps } from "../../tool-utils";

export const baseToolsPrompt = dedent`
    Here are some base tools that you can use to help you with your task:

    <Base Tools>
    ${useWebSearchPrompt}
    ${useCompanyFileSearchPrompt}
    ${useInterpreterPrompt}
    ${useArtifactsPrompt}
    </Base Tools>
`

export const resolveBaseTools = (toolProps: ResolveToolProps) => ({
    useInterpreter,
    webSearch,
    createArtifact,
    updateArtifact,
    useBrowser,
    companyFileSearch: resolveCompanyFileSearchTool(toolProps),
});