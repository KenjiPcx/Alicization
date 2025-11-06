// import { v } from "convex/values";
// import { mutation, query, internalMutation, internalAction, internalQuery } from "../convex/_generated/server";
// import { getAuthUserId } from "@convex-dev/auth/server";
// import { internal } from "../convex/_generated/api";
// import { Doc, Id } from "../convex/_generated/dataModel";
// import { vProficiencyLevels } from "../convex/lib/validators";
// import { experimental_generateImage as generateImage } from 'ai';
// import { iconModel } from "@/lib/ai/model";

// // ========== SKILLS CRUD OPERATIONS ==========

// export const updateSkill = mutation({
//     args: {
//         skillId: v.id("skills"),
//         name: v.optional(v.string()),
//         description: v.optional(v.string()),
//         proficiencyLevel: v.optional(vProficiencyLevels),
//         stats: v.optional(v.object({
//             executionCount: v.number(),
//             averageExecutionTime: v.number(),
//             averageExecutionSuccessRate: v.number(),
//         })),
//     },
//     handler: async (ctx, args): Promise<Doc<"skills">> => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("Not authenticated");

//         const { skillId, ...updates } = args;
//         const skill = await ctx.db.get(skillId);

//         if (!skill) throw new Error("Skill not found");
//         if (skill.userId !== userId) throw new Error("Not authorized to update this skill");

//         // Filter out undefined values
//         const filteredUpdates = Object.fromEntries(
//             Object.entries(updates).filter(([, value]) => value !== undefined)
//         );

//         if (Object.keys(filteredUpdates).length > 0) {
//             await ctx.db.patch(skillId, filteredUpdates);
//         }

//         return await ctx.db.get(skillId) as Doc<"skills">;
//     },
// });

// export const deleteSkill = mutation({
//     args: {
//         skillId: v.id("skills"),
//     },
//     handler: async (ctx, { skillId }): Promise<boolean> => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("Not authenticated");

//         const skill = await ctx.db.get(skillId);
//         if (!skill) throw new Error("Skill not found");
//         if (skill.userId !== userId) throw new Error("Not authorized to delete this skill");

//         // Delete all employee skill associations first
//         const employeeSkills = await ctx.db
//             .query("employeeToSkills")
//             .withIndex("by_skillId", (q) => q.eq("skillId", skillId))
//             .collect();

//         for (const employeeSkill of employeeSkills) {
//             await ctx.db.delete(employeeSkill._id);
//         }

//         // Delete the skill
//         await ctx.db.delete(skillId);
//         return true;
//     },
// });

// export const getAllSkills = query({
//     args: {},
//     handler: async (ctx): Promise<Doc<"skills">[]> => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("Not authenticated");

//         return await ctx.db
//             .query("skills")
//             .filter((q) => q.eq(q.field("userId"), userId))
//             .order("desc")
//             .collect();
//     },
// });

// // ========== EMPLOYEE SKILLS CRUD OPERATIONS ==========

// export const addSkillToEmployee = mutation({
//     args: {
//         employeeId: v.id("employees"),
//         skillId: v.id("skills"),
//         proficiencyLevel: v.union(v.literal("learning"), v.literal("competent"), v.literal("proficient"), v.literal("expert")),
//         notes: v.optional(v.string()),
//     },
//     handler: async (ctx, args): Promise<Doc<"employeeToSkills">> => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("Not authenticated");

//         // Verify employee belongs to user
//         const employee = await ctx.db.get(args.employeeId);
//         if (!employee || employee.userId !== userId) {
//             throw new Error("Employee not found or not authorized");
//         }

//         // Verify skill belongs to user
//         const skill = await ctx.db.get(args.skillId);
//         if (!skill || skill.userId !== userId) {
//             throw new Error("Skill not found or not authorized");
//         }

//         // Check if association already exists
//         const existing = await ctx.db
//             .query("employeeToSkills")
//             .withIndex("by_employeeId_skillId", (q) =>
//                 q.eq("employeeId", args.employeeId).eq("skillId", args.skillId))
//             .first();

//         if (existing) {
//             throw new Error("Employee already has this skill");
//         }

//         const employeeSkillId = await ctx.db.insert("employeeToSkills", {
//             ...args,
//             dateAcquired: Date.now(),
//         });

//         return await ctx.db.get(employeeSkillId) as Doc<"employeeToSkills">;
//     },
// });

// export const updateEmployeeSkill = mutation({
//     args: {
//         employeeId: v.id("employees"),
//         skillId: v.id("skills"),
//         proficiencyLevel: v.optional(v.union(v.literal("learning"), v.literal("competent"), v.literal("proficient"), v.literal("expert"))),
//         notes: v.optional(v.string()),
//     },
//     handler: async (ctx, args): Promise<Doc<"employeeToSkills">> => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("Not authenticated");

//         // Verify employee belongs to user
//         const employee = await ctx.db.get(args.employeeId);
//         if (!employee || employee.userId !== userId) {
//             throw new Error("Employee not found or not authorized");
//         }

//         const employeeSkill = await ctx.db
//             .query("employeeToSkills")
//             .withIndex("by_employeeId_skillId", (q) =>
//                 q.eq("employeeId", args.employeeId).eq("skillId", args.skillId))
//             .first();

//         if (!employeeSkill) {
//             throw new Error("Employee skill association not found");
//         }

//         const { employeeId, skillId, ...updates } = args;

//         // Filter out undefined values
//         const filteredUpdates = Object.fromEntries(
//             Object.entries(updates).filter(([, value]) => value !== undefined)
//         );

//         if (Object.keys(filteredUpdates).length > 0) {
//             await ctx.db.patch(employeeSkill._id, filteredUpdates);
//         }

//         return await ctx.db.get(employeeSkill._id) as Doc<"employeeToSkills">;
//     },
// });

// export const removeSkillFromEmployee = mutation({
//     args: {
//         employeeId: v.id("employees"),
//         skillId: v.id("skills"),
//     },
//     handler: async (ctx, { employeeId, skillId }): Promise<boolean> => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("Not authenticated");

//         // Verify employee belongs to user
//         const employee = await ctx.db.get(employeeId);
//         if (!employee || employee.userId !== userId) {
//             throw new Error("Employee not found or not authorized");
//         }

//         const employeeSkill = await ctx.db
//             .query("employeeToSkills")
//             .withIndex("by_employeeId_skillId", (q) =>
//                 q.eq("employeeId", employeeId).eq("skillId", skillId))
//             .first();

//         if (!employeeSkill) {
//             throw new Error("Employee skill association not found");
//         }

//         await ctx.db.delete(employeeSkill._id);
//         return true;
//     },
// });

// export const getEmployeeSkills = query({
//     args: { employeeId: v.id("employees") },
//     handler: async (ctx, { employeeId }) => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("Not authenticated");

//         // Verify employee belongs to user
//         const employee = await ctx.db.get(employeeId);
//         if (!employee || employee.userId !== userId) {
//             throw new Error("Employee not found or not authorized");
//         }

//         const employeeSkills = await ctx.db
//             .query("employeeToSkills")
//             .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
//             .collect();

//         // Join with skill data
//         const enrichedSkills = await Promise.all(
//             employeeSkills.map(async (empSkill) => {
//                 const skill = await ctx.db.get(empSkill.skillId);
//                 return {
//                     ...empSkill,
//                     skill,
//                 };
//             })
//         );

//         return enrichedSkills.filter(es => es.skill !== null);
//     },
// });

// export const getSkillEmployees = query({
//     args: { skillId: v.id("skills") },
//     handler: async (ctx, { skillId }) => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("Not authenticated");

//         // Verify skill belongs to user
//         const skill = await ctx.db.get(skillId);
//         if (!skill || skill.userId !== userId) {
//             throw new Error("Skill not found or not authorized");
//         }

//         const employeeSkills = await ctx.db
//             .query("employeeToSkills")
//             .withIndex("by_skillId", (q) => q.eq("skillId", skillId))
//             .collect();

//         // Join with employee data
//         const enrichedEmployees = await Promise.all(
//             employeeSkills.map(async (empSkill) => {
//                 const employee = await ctx.db.get(empSkill.employeeId);
//                 return {
//                     ...empSkill,
//                     employee,
//                 };
//             })
//         );

//         return enrichedEmployees.filter(ee => ee.employee !== null);
//     },
// });

// // ========== AGGREGATION QUERIES ==========

// export const getEmployeeSkillSummary = query({
//     args: { employeeId: v.id("employees") },
//     handler: async (ctx, { employeeId }) => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("Not authenticated");

//         const employeeSkills = await ctx.db
//             .query("employeeToSkills")
//             .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
//             .collect();

//         const enrichedSkills = [];

//         for (const empSkill of employeeSkills) {
//             const skill = await ctx.db.get(empSkill.skillId);
//             if (skill) {
//                 enrichedSkills.push({
//                     ...empSkill,
//                     skill,
//                 });
//             }
//         }

//         return {
//             totalSkills: employeeSkills.length,
//             skills: enrichedSkills,
//         };
//     },
// });

// // ========== INTERNAL MUTATIONS FOR AGENT TOOLS ==========

// export const internalCreateSkill = internalMutation({
//     args: {
//         name: v.string(),
//         description: v.string(),
//         userId: v.id("users"),
//         imageStorageId: v.id("_storage"),
//     },
//     handler: async (ctx, args): Promise<Id<"skills">> => {
//         const skillId = await ctx.db.insert("skills", {
//             ...args,
//             proficiencyLevel: "newbie",
//             createdAt: Date.now(),
//         });

//         return skillId;
//     },
// });

// export const internalCreateSkillWithIcon = internalAction({
//     args: {
//         name: v.string(),
//         description: v.string(),
//         userId: v.id("users"),
//     },
//     handler: async (ctx, args): Promise<{ skillId: Id<"skills">, imageUrl: string }> => {
//         const { storageId } = await ctx.runAction(internal.skills.generateSkillIcon, {
//             skillName: args.name,
//             skillDescription: args.description,
//         });

//         const skillId = await ctx.runMutation(internal.skills.internalCreateSkill, {
//             ...args,
//             imageStorageId: storageId,
//         });

//         const imageUrl = await ctx.storage.getUrl(storageId);

//         return { skillId, imageUrl: imageUrl! };
//     },
// });

// export const generateSkillIcon = internalAction({
//     args: {
//         skillName: v.string(),
//         skillDescription: v.string(),
//     },
//     handler: async (ctx, args): Promise<{ success: boolean, storageId: Id<"_storage"> }> => {
//         // Create a detailed prompt for skill icon generation
//         const iconPrompt = `Create a modern, minimalist skill icon for "${args.skillName}": ${args.skillDescription}. 
//             Style: Clean vector art, single focused symbol, vibrant neon colors (cyan, purple, pink), 
//             dark background, professional tech aesthetic, no text, simple geometric shapes, 
//             suitable for a skill badge in a gamified learning platform. 
//             The icon should represent the core concept of the skill clearly and be easily recognizable at small sizes.`;

//         // Generate the image
//         const { image } = await generateImage({
//             model: iconModel,
//             prompt: iconPrompt,
//             size: '1024x1024',
//         });

//         // Convert image to blob and store in Convex
//         const imageBlob = new Blob([image.uint8Array], { type: 'image/png' });
//         const storageId = await ctx.storage.store(imageBlob);

//         return { success: true, storageId };
//     },
// });

// export const getSkillById = internalQuery({
//     args: {
//         skillId: v.id("skills"),
//     },
//     handler: async (ctx, args) => {
//         return await ctx.db.get(args.skillId);
//     },
// });

// export const internalAddSkillToEmployee = internalMutation({
//     args: {
//         employeeId: v.id("employees"),
//         skillId: v.id("skills"),
//         notes: v.optional(v.string()),
//     },
//     handler: async (ctx, args): Promise<Doc<"employeeToSkills">> => {
//         // Check if association already exists
//         const existing = await ctx.db
//             .query("employeeToSkills")
//             .withIndex("by_employeeId_skillId", (q) =>
//                 q.eq("employeeId", args.employeeId).eq("skillId", args.skillId))
//             .first();

//         if (existing) {
//             throw new Error("Employee already has this skill");
//         }

//         const employeeSkillId = await ctx.db.insert("employeeToSkills", {
//             ...args,
//             dateAcquired: Date.now(),
//         });

//         return await ctx.db.get(employeeSkillId) as Doc<"employeeToSkills">;
//     },
// }); 