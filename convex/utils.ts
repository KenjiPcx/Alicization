/**
 * Type-safe utility functions for Convex operations
 */

import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";


export async function getAuthUserId(ctx: QueryCtx | MutationCtx | ActionCtx): Promise<string | undefined> {
    return (await ctx.auth.getUserIdentity())?.subject;
}

/**
 * Filter out undefined values from an object, useful for partial updates
 * @param obj Object with potentially undefined values
 * @returns Object with undefined values removed
 */
export function filterUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => value !== undefined)
    ) as Partial<T>;
}

/**
 * Type-safe update helper for employees
 * Usage: await patchEmployee(ctx, employeeId, { name: "New Name", teamId: newTeamId })
 */
export async function patchEmployee(
    ctx: MutationCtx,
    employeeId: Id<"employees">,
    updates: Partial<Omit<Doc<"employees">, "_id" | "_creationTime" | "userId">>
): Promise<boolean> {
    const filteredUpdates = filterUndefined(updates);

    if (Object.keys(filteredUpdates).length > 0) {
        await ctx.db.patch(employeeId, filteredUpdates);
        return true;
    }

    return false;
}

/**
 * Type-safe update helper for companies
 */
export async function patchCompany(
    ctx: MutationCtx,
    companyId: Id<"companies">,
    updates: Partial<Omit<Doc<"companies">, "_id" | "_creationTime" | "userId">>
): Promise<boolean> {
    const filteredUpdates = filterUndefined(updates);

    if (Object.keys(filteredUpdates).length > 0) {
        await ctx.db.patch(companyId, filteredUpdates);
        return true;
    }

    return false;
}

/**
 * Type-safe update helper for teams
 */
export async function patchTeam(
    ctx: MutationCtx,
    teamId: Id<"teams">,
    updates: Partial<Omit<Doc<"teams">, "_id" | "_creationTime" | "userId">>
): Promise<boolean> {
    const filteredUpdates = filterUndefined(updates);

    if (Object.keys(filteredUpdates).length > 0) {
        await ctx.db.patch(teamId, filteredUpdates);
        return true;
    }

    return false;
}

/**
 * Type-safe update helper for company files
 */
export async function patchCompanyFile(
    ctx: MutationCtx,
    companyFileId: Id<"companyFiles">,
    updates: Partial<Omit<Doc<"companyFiles">, "_id" | "_creationTime" | "userId">>
): Promise<boolean> {
    const filteredUpdates = filterUndefined(updates);

    if (Object.keys(filteredUpdates).length > 0) {
        await ctx.db.patch(companyFileId, filteredUpdates);
        return true;
    }

    return false;
}

/**
 * Type-safe update helper for tools
 */
export async function patchTool(
    ctx: MutationCtx,
    toolId: Id<"tools">,
    updates: Partial<Omit<Doc<"tools">, "_id" | "_creationTime" | "userId">>
): Promise<boolean> {
    const filteredUpdates = filterUndefined(updates);

    if (Object.keys(filteredUpdates).length > 0) {
        await ctx.db.patch(toolId, filteredUpdates);
        return true;
    }

    return false;
}

// Note: For other tables, create specific update functions above
// This provides better type safety and IntelliSense

/**
 * Merge objects, with the second object taking precedence, but ignoring undefined values
 * @param base Base object
 * @param override Override object
 * @returns Merged object
 */
export function mergeWithoutUndefined<T extends Record<string, any>>(
    base: T,
    override: Partial<T>
): T {
    return {
        ...base,
        ...filterUndefined(override)
    };
} 