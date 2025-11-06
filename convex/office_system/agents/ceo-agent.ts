import { Agent, createTool } from "@convex-dev/agent";
import { Id } from "@/convex/_generated/dataModel";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { components, internal } from "@/convex/_generated/api";

/*
CEO Agent Features:
- Team Management
    - Create a new team
    - Add a new employee to a team
    - Remove an employee from a team
    - Get all teams
    - Get all employees
    - Get all employees in a team
- Project and KPI Management
    - Create a new KPI
    - Update a KPI
    - Delete a KPI
    - Get all KPIs
    - Get a KPI by id
    - Get all KPIs for a team
- Check up on progress
- Main Proxy for user requests
*/

// TODO: Add a tool to create a new team

const teamManagerAgent = new Agent(components.agent, {
    name: "Team Manager Agent",
    languageModel: openai.chat("gpt-4o-mini"),
    instructions:
        "You are a helpful AI assistant. Respond concisely and accurately to user questions.",
    tools: {
        createTeam: createTool({
            description: "Create a new team for the company",
            args: z.object({
                name: z.string(),
            }),
            handler: async (ctx, args) => {
                console.log({ args });
            },
        }),
        addEmployeeToTeam: createTool({
            description: "Add an employee to a team",
            args: z.object({
                teamId: z.string(),
                employeeId: z.string(),
            }),
            handler: async (ctx, args) => {
                console.log({ args });
            },
        }),
    },
    // usageHandler: async (ctx, args) => {
    //     console.log({ args });
    //     // We store user ids as userId-employeeId
    //     const userId = args.userId?.split("-")[0];
    //     if (!userId) {
    //         console.warn("usageHandler called with no userId");
    //         return;
    //     }
    //     await ctx.runMutation(internal.usage.insertRawUsage, {
    //         userId: userId as Id<"users">,
    //         agentName: args.agentName,
    //         model: args.model,
    //         provider: args.provider,
    //         usage: args.usage,
    //         providerMetadata: args.providerMetadata ?? {},
    //     });
    // },
})

const kpiManagerAgent = new Agent(components.agent, {
    languageModel: openai.chat("gpt-4o-mini"),
    name: "KPI Manager Agent",
    instructions: "You are a helpful AI assistant. Respond concisely and accurately to user questions.",
    tools: {},
})

const upsertKPI = createTool({
    description: "Upsert a KPI for the company",
    args: z.object({
        name: z.string(),
    }),
    handler: async (ctx, args) => {
        console.log({ args });
    },
});

const ceoAgent = new Agent(components.agent, {
    languageModel: openai.chat("gpt-4o-mini"),
    name: "CEO Agent",
    instructions:
        `
        You are a helpful CEO assistant managing a virtual office. Respond concisely and accurately to user questions.
        
        When asked a question, if you have enough information to answer it, please answer, otherwis
        `,
    tools: {},
    // usageHandler: async (ctx, args) => {
    //     console.log({ args });
    //     // We store user ids as userId-employeeId
    //     const userId = args.userId?.split("-")[0];
    //     if (!userId) {
    //         console.warn("usageHandler called with no userId");
    //         return;
    //     }
    //     await ctx.runMutation(internal.usage.insertRawUsage, {
    //         userId: userId as Id<"users">,
    //         agentName: args.agentName,
    //         model: args.model,
    //         provider: args.provider,
    //         usage: args.usage,
    //         providerMetadata: args.providerMetadata ?? {},
    //     });
    // },
});

// const chatWithSwarmLoop = action({
//     args: v.object({
//         userId: v.string(),
//         userMessage: v.string(),
//         threadId: v.string(),
//     }),
//     handler: async (ctx, {
//         userId,
//         userMessage,
//         threadId,
//     }) => {
//         // Inner state
//         const agents = {
//             ceoAgent: ceoAgent,
//             teamManagerAgent: teamManagerAgent,
//         }
//         let activeAgent = agents.ceoAgent
//         let todos: { todo: string, done: boolean }[] = []
//         let todoListId: string | null = null

//         // create tools dynamically
//         const createTodoList = createTool({
//             description: "Create a todo list for the current task",
//             args: z.object({
//                 todos: z.array(z.object({
//                     todo: z.string(),
//                     done: z.boolean().default(false),
//                 })),
//             }),
//             handler: async (ctx, args) => {
//                 // Update todos
//                 todos = args.todos
//                 // Save the todo list to the database
//                 todoListId = await ctx.runMutation(internal.todo.createTodoList, {
//                     todos: args.todos,
//                 })
//                 return `Created the following todos: ${JSON.stringify(args.todos)} with id ${todoListId}`
//             },
//         });
//         const transferToAgent = createTool({
//             description: "Transfer to a different agent",
//             args: z.object({
//                 agentName: z.enum(["ceoAgent", "teamManagerAgent"]),
//             }),
//             handler: async (ctx, args) => {
//                 activeAgent = agents[args.agentName]
//             },
//         })

//         // plan and create the initial todo list
//         const { thread } = await ceoAgent.continueThread(ctx, {
//             threadId,
//             userId,
//         })
//         const { text } = await thread.generateText({
//             prompt: `Create a todo list to accomplish the task given by the user: ${userMessage}`,
//             tools: {
//                 createTodoList,
//             },
//             toolChoice: "required"
//         })
//         const updateTodoList = createTool({
//             description: "Update the todo list. You can only add todos and change the done status of a todo.",
//             args: z.object({
//                 todos: z.array(z.object({
//                     todo: z.string(),
//                     done: z.boolean().default(false),
//                 })),
//             }),
//             handler: async (ctx, args) => {
//                 // Update todos
//                 todos = args.todos
//                 // Save the todo list to the database
//                 await ctx.runMutation(internal.todo.updateTodoList, {
//                     todoListId,
//                     todos: args.todos,
//                 })
//                 return `Updated the todolist: ${JSON.stringify(args.todos)}`
//             },
//         });

//         while (todos.filter(todo => !todo.done).length > 0) {
//             // Execute the next todo with the active agent
//             const { thread } = await activeAgent.continueThread(ctx, {
//                 threadId,
//                 userId,
//             })
//             const { text } = await thread.generateText({
//                 prompt: `Execute the next todo item: ${todos.find(todo => !todo.done)?.todo}. Update the todo list when done with a todo or when you need to replan.`,
//                 tools: {
//                     ...activeAgent.options.tools,
//                     transferToAgent,
//                     updateTodoList,
//                 },
//                 maxSteps: 20
//             })
//         }
//     }
// });
