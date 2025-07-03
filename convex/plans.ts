import type { Doc } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const createPlan = internalMutation({
    args: v.object({
        threadId: v.string(),
        title: v.string(),
        description: v.string(),
        plan: v.string(),
        todos: v.array(v.string()),
    }),
    handler: async (ctx, args) => {
        const { threadId, title, description, plan, todos } = args;

        const planId = await ctx.db.insert("plans", {
            threadId,
            title,
            description,
            plan,
            pendingTodos: todos,
            completedTodos: [],
        });

        return await ctx.db.get(planId) as Doc<"plans">;
    },
});

export const getCurrentPlan = internalQuery({
    args: v.object({
        threadId: v.string(),
    }),
    handler: async (ctx, args) => {
        const { threadId } = args;

        const plan = await ctx.db
            .query("plans")
            .filter((q) => q.eq(q.field("threadId"), threadId))
            .order("desc")
            .first();

        return plan;
    },
});

export const updatePlan = internalMutation({
    args: v.object({
        threadId: v.string(),
        updatedPlan: v.optional(v.string()),
        updatedPendingTodos: v.optional(v.array(v.string())),
        checkOffCurrentTodo: v.optional(v.boolean()),
    }),
    handler: async (ctx, args) => {
        const { threadId, updatedPlan, updatedPendingTodos, checkOffCurrentTodo } = args;

        // Get current plan
        const currentPlan = await ctx.db
            .query("plans")
            .filter((q) => q.eq(q.field("threadId"), threadId))
            .order("desc")
            .first();

        if (!currentPlan) {
            throw new Error("No plan found for this thread");
        }

        let newPlanContent = currentPlan.plan;
        let newPendingTodos = currentPlan.pendingTodos;
        let newCompletedTodos = currentPlan.completedTodos;

        // Update plan content if provided
        if (updatedPlan) {
            newPlanContent = updatedPlan;
        }

        // Check off current todo if provided
        if (checkOffCurrentTodo) {
            const completedTodo = newPendingTodos.shift(); // New pending todo is already removed from the list
            if (completedTodo) {
                newCompletedTodos = [...newCompletedTodos, completedTodo];
            }
        }

        // Update pending todos if provided
        if (updatedPendingTodos) {
            newPendingTodos = updatedPendingTodos;
        }

        // Update the plan
        await ctx.db.patch(currentPlan._id, {
            plan: newPlanContent,
            pendingTodos: newPendingTodos,
            completedTodos: newCompletedTodos,
        });

        return {
            ...currentPlan,
            plan: newPlanContent,
            pendingTodos: newPendingTodos,
            completedTodos: newCompletedTodos,
        };
    },
});