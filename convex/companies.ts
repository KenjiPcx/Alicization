import { internalMutation, query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { patchCompany } from "./utils";
import { internal } from "./_generated/api";
import { CompanyData } from "@/lib/types";

/**
 * Get company with team details
 */
export const getCompany = query({
    args: v.object({
        fetchTeams: v.optional(v.boolean()),
        fetchEmployees: v.optional(v.boolean()),
    }),
    handler: async (ctx, { fetchTeams, fetchEmployees }): Promise<CompanyData> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("User not found");
        }

        return await ctx.runQuery(internal.companies.internalGetCompany, {
            userId,
            fetchTeams,
            fetchEmployees
        });
    },
});

export const internalGetCompany = internalQuery({
    args: v.object({
        userId: v.id("users"),
        fetchTeams: v.optional(v.boolean()),
        fetchEmployees: v.optional(v.boolean()),
    }),
    handler: async (ctx, { userId, fetchTeams, fetchEmployees }): Promise<CompanyData> => {
        const company = await ctx.db
            .query("companies")
            .filter((q) => q.eq(q.field("userId"), userId))
            .first();

        if (!company) {
            return { company: null, teams: [], employees: [] };
        }

        const teams = fetchTeams
            ? await ctx.db.query("teams")
                .filter((q) => q.eq(q.field("companyId"), company._id))
                .collect()
            : [];
        const employees = fetchEmployees
            ? await ctx.db
                .query("employees")
                .filter((q) => q.eq(q.field("companyId"), company._id))
                .collect()
            : [];

        return { company, teams, employees };
    },
});

/**
 * Create a new company
 */
export const createCompany = mutation({
    args: v.object({
        name: v.string(),
        description: v.string(),
        vision: v.string(),
        mission: v.string(),
        values: v.optional(v.array(v.string())),
        goals: v.optional(v.array(v.string())),
    }),
    handler: async (ctx, args): Promise<Id<"companies">> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("User not found");
        }

        // Create new company
        const companyId = await ctx.db.insert("companies", {
            name: args.name,
            description: args.description,
            vision: args.vision,
            mission: args.mission,
            values: args.values ?? [],
            goals: args.goals ?? [],
            userId,
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
        description: v.optional(v.string()),
        vision: v.optional(v.string()),
        mission: v.optional(v.string()),
        values: v.optional(v.array(v.string())),
        goals: v.optional(v.array(v.string())),
    }),
    handler: async (ctx, args) => {
        const { userId, ...updates } = args;

        const existingCompany = await ctx.db
            .query("companies")
            .filter((q) => q.eq(q.field("userId"), userId))
            .first();

        if (!existingCompany) {
            throw new Error("Company not found. Please create a company first.");
        }

        // Use the type-safe update helper
        await patchCompany(ctx, existingCompany._id, updates);

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
            .query("companies")
            .filter((q) => q.eq(q.field("userId"), args.userId))
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
