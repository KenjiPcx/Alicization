import { internalMutation, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Get company with team details
 */
export const getCompany = query({
    args: v.object({
        userId: v.id("users"),
        fetchTeam: v.optional(v.boolean()),
    }),
    handler: async (ctx, args) => {
        const company = await ctx.db
            .query("company")
            .withIndex("by_userId", q => q.eq("userId", args.userId))
            .first();

        if (!company) return null;

        if (args.fetchTeam) {
            const team = await ctx.db.get(company.teamId);
            return {
                ...company,
                team,
            };
        }

        return company;
    },
});

/**
 * Create a new company
 */
export const createCompany = mutation({
    args: v.object({
        userId: v.id("users"),
        name: v.string(),
        vision: v.string(),
        mission: v.string(),
        values: v.array(v.string()),
        goals: v.array(v.string()),
        teamId: v.id("teams"),
    }),
    handler: async (ctx, args) => {
        // Create new company
        const companyId = await ctx.db.insert("company", {
            name: args.name,
            vision: args.vision,
            mission: args.mission,
            values: args.values,
            goals: args.goals,
            teamId: args.teamId,
            userId: args.userId,
        });
        return companyId;
    },
});

/**
 * Update company (since each user has exactly one)
 */
export const updateCompany = mutation({
    args: v.object({
        userId: v.id("users"),
        name: v.optional(v.string()),
        vision: v.optional(v.string()),
        mission: v.optional(v.string()),
        values: v.optional(v.array(v.string())),
        goals: v.optional(v.array(v.string())),
    }),
    handler: async (ctx, args) => {
        const existingCompany = await ctx.db
            .query("company")
            .withIndex("by_userId", q => q.eq("userId", args.userId))
            .first();

        if (!existingCompany) {
            throw new Error("Company not found. Please create a company first.");
        }

        // Update existing company
        await ctx.db.patch(existingCompany._id, {
            name: args.name ?? existingCompany.name,
            vision: args.vision ?? existingCompany.vision,
            mission: args.mission ?? existingCompany.mission,
            values: args.values ?? existingCompany.values,
            goals: args.goals ?? existingCompany.goals,
        });

        return existingCompany._id;
    },
});

/**
 * Internal mutation for company operations
 */
export const internalUpdateCompany = internalMutation({
    args: v.object({
        userId: v.id("users"),
        name: v.optional(v.string()),
        vision: v.optional(v.string()),
        mission: v.optional(v.string()),
        values: v.optional(v.array(v.string())),
        goals: v.optional(v.array(v.string())),
    }),
    handler: async (ctx, args) => {
        const company = await ctx.db
            .query("company")
            .withIndex("by_userId", q => q.eq("userId", args.userId))
            .first();

        if (!company) {
            throw new Error("Company not found. Please create a company first.");
        }

        const updates: any = {};
        if (args.name !== undefined) updates.name = args.name;
        if (args.vision !== undefined) updates.vision = args.vision;
        if (args.mission !== undefined) updates.mission = args.mission;
        if (args.values !== undefined) updates.values = args.values;
        if (args.goals !== undefined) updates.goals = args.goals;

        await ctx.db.patch(company._id, updates);

        return company._id;
    },
});
