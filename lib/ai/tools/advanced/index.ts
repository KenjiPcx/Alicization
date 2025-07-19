import { updateThreadTitle } from "./updateThreadTitle";
import { resolveHumanCollabTool } from "./human-collab";
import { resolveMemoryToolset } from "./memory";
import { resolvePlannerToolset, usePlannerToolsPrompt } from "./planner";
import { useMemoryToolsPrompt } from "./memory";
import { resolveSkillToolset, useLearnSkillPrompt } from "./learn-skill";
import { ResolveToolProps } from "../../tool-utils";
import dedent from "dedent";

export const advancedToolsPrompt = dedent`
    <Use Advanced Tools Docs>
    ${usePlannerToolsPrompt}
    ${useMemoryToolsPrompt}
    ${useLearnSkillPrompt}
    </Use Advanced Tools Docs>
`

export const resolveAdvancedTools = (toolProps: ResolveToolProps) => {
    return {
        requestHumanInput: resolveHumanCollabTool(toolProps),
        ...resolvePlannerToolset(toolProps),
        ...resolveMemoryToolset(toolProps),
        ...resolveSkillToolset(toolProps),
        updateThreadTitle,
    }
}