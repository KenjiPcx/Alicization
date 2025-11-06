// import { updateThreadTitle } from "./updateThreadTitle";
// // import { resolveHumanCollabTool } from "./human-collab";
// import { resolveMemoryToolset } from "./memory";
// import { resolvePlannerToolset, usePlannerToolsPrompt } from "./planner";
// import { useMemoryToolsPrompt } from "./memory";
// import { resolveSkillToolset, useLearnSkillPrompt } from "./learn-skill";
// import { ResolveToolProps } from "../../../lib/ai/tool-utils";
// import dedent from "dedent";
// import { resolveSaveAttachmentTool, useSaveAttachmentPrompt } from "./save-attachment";

// export const advancedToolsPrompt = dedent`
//     <Use Advanced Tools Docs>
//     ${usePlannerToolsPrompt}
//     ${useMemoryToolsPrompt}
//     ${useLearnSkillPrompt}
//     ${useSaveAttachmentPrompt}
//     </Use Advanced Tools Docs>
// `

// export const resolveAdvancedTools = (toolProps: ResolveToolProps) => {
//     return {
//         // Toolsets
//         ...resolvePlannerToolset(toolProps),
//         ...resolveMemoryToolset(toolProps),
//         ...resolveSkillToolset(toolProps),

//         // Tools
//         // requestHumanInput: resolveHumanCollabTool(toolProps),
//         saveAttachment: resolveSaveAttachmentTool(toolProps),

//         // Other
//         updateThreadTitle,
//     }
// }