// import { resolveAdvancedTools } from "../advanced";
// import { resolveBaseTools } from "../base";
// import { createOpenOfficeMicroAppTool } from "../advanced/office-micro-app";
// import { ResolveToolProps } from "../../../lib/ai/tool-utils";

// export const resolveEmployeeTools = async (toolProps: ResolveToolProps) => {
//     const openOfficeMicroApp = createOpenOfficeMicroAppTool({
//         kpiScopeAndId: {
//             scope: "employee",
//             employeeId: toolProps.employeeId,
//         },
//     });
//     const baseTools = resolveBaseTools(toolProps);
//     const advancedTools = resolveAdvancedTools(toolProps);

//     return {
//         ...baseTools,
//         ...advancedTools,

//         openOfficeMicroApp,
//     }
// }