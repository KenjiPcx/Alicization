// import { getAuthUserId } from "@convex-dev/auth/server";
// import { query, mutation, action } from "../convex/_generated/server";
// import { v } from "convex/values";
// import { api, internal } from "../convex/_generated/api";
// import { Doc, Id } from "../convex/_generated/dataModel";

// /**
//  * Get the user's onboarding status
//  */
// export const getOnboardingStatus = query({
//     args: {},
//     handler: async (ctx) => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) {
//             return { completed: false, needsOnboarding: false }; // User not found
//         }

//         const user = await ctx.db.get(userId);

//         if (!user) {
//             return { completed: false, needsOnboarding: false }; // User not found
//         }

//         const userMetadata = await ctx.db
//             .query("usersMetadata")
//             .filter((q) => q.eq(q.field("userId"), userId))
//             .first();

//         const completed = userMetadata?.onboardingCompleted ?? false;

//         return {
//             completed,
//             needsOnboarding: !completed,
//             completedAt: userMetadata?.onboardingCompletedAt,
//         };
//     },
// });

// /**
//  * Mark onboarding as completed for the current user
//  */
// export const completeOnboarding = mutation({
//     args: {},
//     handler: async (ctx) => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) {
//             throw new Error("User not found");
//         }

//         const user = await ctx.db.get(userId);

//         if (!user) {
//             throw new Error("User not found");
//         }

//         // Find or create user metadata
//         const existingMetadata = await ctx.db
//             .query("usersMetadata")
//             .filter((q) => q.eq(q.field("userId"), userId))
//             .first();

//         if (existingMetadata) {
//             // Update existing metadata
//             await ctx.db.patch(existingMetadata._id, {
//                 onboardingCompleted: true,
//                 onboardingCompletedAt: Date.now(),
//             });
//         } else {
//             // Create new metadata
//             await ctx.db.insert("usersMetadata", {
//                 userId: user._id,
//                 type: "regular",
//                 onboardingCompleted: true,
//                 onboardingCompletedAt: Date.now(),
//             });
//         }

//         return { success: true };
//     },
// });

// /**
//  * Reset onboarding status (for development/testing)
//  */
// export const resetOnboarding = mutation({
//     args: {},
//     handler: async (ctx) => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) {
//             throw new Error("User not found");
//         }

//         const user = await ctx.db.get(userId);

//         if (!user) {
//             throw new Error("User not found");
//         }

//         const userMetadata = await ctx.db
//             .query("usersMetadata")
//             .filter((q) => q.eq(q.field("userId"), userId))
//             .first();

//         if (userMetadata) {
//             await ctx.db.patch(userMetadata._id, {
//                 onboardingCompleted: false,
//                 onboardingCompletedAt: undefined,
//             });
//         }

//         return { success: true };
//     },
// });


// export const getManagementTeam = query({
//     args: {
//         companyId: v.id("companies"),
//         userId: v.id("users"),
//     },
//     handler: async (ctx, { companyId, userId }): Promise<Doc<"teams"> | null> => {
//         return await ctx.db.query("teams")
//             .filter((q) => q.and(
//                 q.eq(q.field("userId"), userId),
//                 q.eq(q.field("name"), "Management")
//             ))
//             .first();
//     },
// });

// export const getOrCreateManagementTeam = action({
//     args: {
//         companyId: v.id("companies"),
//     },
//     handler: async (ctx, { companyId }): Promise<Id<"teams">> => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("User not found");

//         // Look for existing management team (by name and user)
//         const existingTeam = await ctx.runQuery(api.onboarding.getManagementTeam, {
//             companyId: companyId,
//             userId: userId,
//         });

//         if (existingTeam) {
//             // Update companyId if needed (for legacy/seeded data)
//             if (existingTeam.companyId !== companyId) {
//                 await ctx.runMutation(api.teams.setTeamCompanyId, {
//                     teamId: existingTeam._id,
//                     companyId: companyId,
//                 });
//             }
//             return existingTeam._id;
//         }

//         // Create new management team
//         return await ctx.runMutation(internal.teams.createTeam, {
//             name: "Management",
//             description: "Executive management team",
//             clusterPosition: [0, 0, 15],
//             deskCount: 1,
//             companyId: companyId,
//             userId: userId,
//         });
//     },
// });

// export const getCEO = query({
//     args: {
//         companyId: v.id("companies"),
//         userId: v.id("users"),
//     },
//     handler: async (ctx, { companyId, userId }): Promise<Doc<"employees"> | null> => {
//         return await ctx.db.query("employees")
//             .filter((q) => q.and(
//                 q.eq(q.field("userId"), userId),
//                 q.eq(q.field("builtInRole"), "ceo"),
//                 q.eq(q.field("companyId"), companyId)
//             ))
//             .first();
//     },
// });

// export const getOrCreateCEO = action({
//     args: {
//         companyId: v.id("companies"),
//         name: v.string(),
//         jobTitle: v.string(),
//         jobDescription: v.string(),
//         gender: v.union(v.literal("male"), v.literal("female")),
//         background: v.string(),
//         personality: v.string(),
//         statusMessage: v.string(),
//         isSupervisor: v.boolean(),
//         isCEO: v.boolean(),
//         deskIndex: v.optional(v.number()),
//     },
//     handler: async (ctx, args): Promise<Id<"employees">> => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("User not found");

//         // Get the management team for this company
//         const managementTeamId = await ctx.runAction(api.onboarding.getOrCreateManagementTeam, {
//             companyId: args.companyId,
//         });

//         // Look for existing CEO (by role and user)
//         const existingCEO = await ctx.runQuery(api.onboarding.getCEO, {
//             companyId: args.companyId,
//             userId: userId,
//         });

//         if (existingCEO) {
//             // Update the CEO with new data
//             return (await ctx.runMutation(api.employees.updateEmployee, {
//                 employeeId: existingCEO._id,
//                 teamId: managementTeamId,
//                 name: args.name,
//                 jobTitle: args.jobTitle,
//                 jobDescription: args.jobDescription,
//                 gender: args.gender,
//                 background: args.background,
//                 personality: args.personality,
//                 statusMessage: args.statusMessage,
//                 isSupervisor: args.isSupervisor,
//                 isCEO: args.isCEO,
//                 deskIndex: args.deskIndex,
//                 companyId: args.companyId,
//                 status: "info",
//                 builtInRole: "ceo",
//             }))._id;
//         }

//         // Create new CEO
//         const newCEO = await ctx.runMutation(internal.employees.createEmployee, {
//             teamId: managementTeamId,
//             name: args.name,
//             jobTitle: args.jobTitle,
//             jobDescription: args.jobDescription,
//             gender: args.gender,
//             background: args.background,
//             personality: args.personality,
//             statusMessage: args.statusMessage,
//             isSupervisor: args.isSupervisor,
//             isCEO: args.isCEO,
//             builtInRole: "ceo",
//             deskIndex: args.deskIndex,
//             companyId: args.companyId,
//             userId: userId,
//         });

//         return newCEO._id;
//     },
// });