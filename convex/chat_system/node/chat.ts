// "use node";

// import { v } from "convex/values";
// import { internalAction } from "../../convex/_generated/server";
// import { employeeAgent } from "@/archive/employee-agent";
// import { anthropicProviderOptions } from "@/lib/ai/model";
// import { api, internal } from "../../convex/_generated/api";
// // import { resolveEmployeeTools } from "@/archive/tools/office/employee";
// // import { resolveCEOTools } from "@/archive/tools/office/ceo";
// // import { resolveCHROTools } from "@/archive/tools/office/chro";
// // import { resolveCTOTools } from "@/archive/tools/office/cto";
// // import { resolveCOOTools } from "@/archive/tools/office/coo";
// // import { resolveCFOTools } from "@/archive/tools/office/cfo";
// // import { advancedToolsPrompt } from "@/archive/tools/advanced";
// // import { baseToolsPrompt } from "@/archive/tools/base";
// import { Attachment, FullEmployee } from "@/lib/types";
// import dedent from "dedent";
// import { experimental_createMCPClient } from "@ai-sdk/mcp"
// import { convertAttachmentsToContent } from "../chat";
// import { vAttachment } from "../lib/validators";
// import { TextPart } from "ai";

// interface SystemPromptProps {
//     attachments?: Attachment[];
//     employee: FullEmployee;
// }

// export const systemPrompt = ({ attachments, employee: { name, jobTitle, jobDescription, background, personality, team, toolsets, skills } }: SystemPromptProps) => {
//     if (!name || !jobTitle || !jobDescription || !background || !personality || !team || !toolsets || !skills) {
//         throw new Error("Missing required fields");
//     }

//     return dedent(`
//     # High Level Background
//     You are an AI employee, working as a ${jobTitle}, part of the ${team?.name} team.
//     Your role is summarized as follows: ${jobDescription}.

//     # Personal Information
//     - Your name is ${name}.
//     - Your background is as follows: ${background}
//     - Your personality is as follows: ${personality}

//     # Capabilities
//     You are a generalist employee, capable of doing anything a human with a computer can do, you reason thoroughly step by step.

//     # Flow
//     1. You will be given tasks of varying complexity and scope from the user to complete, you should always clarify the ask with the user before proceeding.
//     2. Perform the task based on its scope and complexity
//         - If the task is very simple, you can just attempt to execute it directly with or without the tools you have access to. 
//         - But if the task is a really complex long running multi step task, you should probably plan it out first, this planning is more of a high level plan, the executor will also have its own internal plan. For example, tasks like problem solving or just have a large scope or number of steps like writing a codebase will benefit from planning. 
//     3. Call the execute todo plan when you are done clarifying the ask from the user in the case of a simple task, or when you are done planning in the case of a complex task.
//     4. At the end of each todo, you should summarize what has been executed, update your todo list and repeat to execute the next todo
//     5. At any point in time, you can always reach out to the user for clarification, after getting the user's response, you might need to update your plan or todo list

//     # Tools
//     More specifically, you have access to the following tools/toolkits, use them wisely to perform your tasks:
    
//     ## Here are your base tools
//     ${baseToolsPrompt}
    
//     ## Here are your advanced tools
//     ${advancedToolsPrompt}

//     ## Role Specific Tools
//     Here are your role specific tools to help you do your work 
//     ${toolsets.map((toolset) => `- ${toolset.name}: ${toolset.description} (toolsetId: ${toolset._id})`).join("\n")}

//     # Skills
//     You have skills, which are just workflows to use the tools to perform specialized tasks.
//     Here are the skills that you have learned so far, there should be company file documentation you can search for on more details to perform the skill, search for it dynamically.
//     ${skills.map((skill) => `- ${skill.name}: ${skill.description} (skillId: ${skill._id})`).join("\n")}

//     ## More tool details
//     If a tool ever fails, you should try to fix the issue and continue the task. If you can't fix the issue, you should inform the user and ask for their help.

//     # Attachments
//     Here are some recent attachments filenames and their urls that you were given:
//     ${attachments?.map((attachment) => `- ${attachment.name}: ${attachment.url} (contentType: ${attachment.contentType})`).join("\n") || "No attachments"}
// `)
// }

// export const streamMessage = internalAction({
//     args: {
//         threadId: v.string(),
//         prompt: v.optional(v.string()),
//         promptMessageId: v.optional(v.string()),
//         userId: v.id("users"),
//         employeeId: v.id("employees"),
//         teamId: v.id("teams"),
//         blocking: v.boolean(),
//         attachments: v.optional(v.array(vAttachment)),
//     },
//     handler: async (ctx, { threadId, prompt, promptMessageId, userId, employeeId, teamId, blocking = false, attachments }) => {
//         // Validate that exactly one of prompt or promptMessageId is provided
//         if ((prompt && promptMessageId) || (!prompt && !promptMessageId)) {
//             throw new Error("Must provide exactly one of 'prompt' or 'promptMessageId'");
//         }

//         // // Resolve employee from employeeId and get employee details
//         // const employee = await ctx.runQuery(api.employees.getEmployeeById, {
//         //     employeeId,
//         // });
//         // if (!employee) throw new Error("Employee not found");

//         // // Generate embeddings if we have a saved message ID
//         // if (promptMessageId) {
//         //     await employeeAgent.generateAndSaveEmbeddings(ctx, {
//         //         messageIds: [promptMessageId],
//         //     });
//         // }

//         // const { thread } = await employeeAgent.continueThread(ctx, { threadId, userId });

//         // // Prepare streamText options
//         // const hiddenChatState = await ctx.runQuery(internal.chat.getHiddenChatState, {
//         //     threadId,
//         // });

//         // // Resolve tools based on built-in role
//         // const resolveToolsForRole = async () => {
//         //     const toolProps = { ctx, threadId, userId, employeeId, teamId, companyId: employee.companyId };

//         //     switch (employee.builtInRole) {
//         //         case "ceo":
//         //             return await resolveCEOTools(toolProps);
//         //         case "coo":
//         //             return await resolveCOOTools(toolProps);
//         //         case "cto":
//         //             return await resolveCTOTools(toolProps);
//         //         case "chro":
//         //             return await resolveCHROTools(toolProps);
//         //         case "cfo":
//         //             return await resolveCFOTools(toolProps);
//         //         default:
//         //             return await resolveEmployeeTools(toolProps);
//         //     }
//         // };

//         // // Resolve MCP toolsets
//         // // Get all MCP tool sets and wait for them to resolve
//         // const mcpToolSetsClients = await Promise.all(
//         //     employee.toolsets
//         //         .filter(toolset => toolset.type === "mcp" && toolset.toolsetConfig?.connectionType === "sse")
//         //         .map(async toolset => {
//         //             const client = await experimental_createMCPClient({
//         //                 transport: {
//         //                     type: "sse",
//         //                     url: toolset.toolsetConfig!.connectionUrl!,
//         //                     ...(toolset.toolsetConfig?.env?.apiKey ? {
//         //                         headers: {
//         //                             "Authorization": `Bearer ${toolset.toolsetConfig.env.apiKey}`
//         //                         }
//         //                     } : {}),
//         //                 }
//         //             })
//         //             return client;
//         //         })
//         // );

//         // // Get all tools from all MCP clients
//         // const allMcpTools = await Promise.all(
//         //     mcpToolSetsClients.map(client => client.tools())
//         // );

//         // // Merge all tools into a single object
//         // const mergedMcpTools = Object.assign({}, ...allMcpTools);

//         // const baseOptions = {
//         //     system: systemPrompt({
//         //         attachments: hiddenChatState.attachments?.map((attachment) => ({
//         //             name: attachment.name ?? "",
//         //             url: attachment.url,
//         //             contentType: attachment.contentType ?? "",
//         //         })),
//         //         employee: employee
//         //     }),
//         //     providerOptions: anthropicProviderOptions,
//         //     tools: {
//         //         ...(await resolveToolsForRole()),
//         //         ...mergedMcpTools
//         //     },
//         //     maxSteps: 25,
//         // };

//         // let result;

//         // // If we have attachments or are using a prompt directly, use the message format with content
//         // if ((attachments && attachments.length > 0) || prompt) {
//         //     const content = convertAttachmentsToContent(attachments?.map((attachment) => ({
//         //         name: attachment.name ?? "",
//         //         url: attachment.url,
//         //         contentType: attachment.contentType ?? "",
//         //     })), prompt);

//         //     result = await thread.streamText({
//         //         ...baseOptions,
//         //         messages: [{
//         //             role: "user",
//         //             content: content as unknown as TextPart[],
//         //         }],
//         //         onFinish: async () => {
//         //             // Close all MCP toolsets
//         //             await Promise.all(mcpToolSetsClients.map(client => client.close()));
//         //         }
//         //     }, {
//         //         saveStreamDeltas: { chunking: "line", throttleMs: 500 },
//         //     });
//         // } else {
//         //     // Use the existing promptMessageId approach for backwards compatibility
//         //     result = await thread.streamText({
//         //         ...baseOptions,
//         //         promptMessageId,
//         //     }, {
//         //         saveStreamDeltas: { chunking: "line", throttleMs: 500 },
//         //     });
//         // }

//         // if (blocking) {
//         //     for await (const chunk of result.fullStream) {
//         //         // Do nothing, this just blocks the stream until it finishes
//         //     }
//         // } else {
//         //     await result.consumeStream();
//         // }
//     },
// })
