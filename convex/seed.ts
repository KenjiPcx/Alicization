import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc } from "./_generated/dataModel";

export const seedAllData = action({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        console.log("Starting seed process...");

        // Create company
        const companyId = await ctx.runMutation(api.companies.createCompany, {
            name: "Company",
            description: "Company description",
            vision: "Company vision",
            mission: "Company mission",
        });

        // Seed teams first
        const teamsResult: {
            message: string,
            teams: Doc<"teams">[]
        } = await ctx.runMutation(api.teams.seedTeams, {
            companyId: companyId,
        });
        console.log("Teams seeded:", teamsResult);

        // Then seed employees (desk assignments happen automatically)
        const employeesResult: {
            message: string,
            count: number,
            employees: Doc<"employees">[]
        } = await ctx.runAction(api.employees.seedEmployees, {
            companyId: companyId,
        });
        console.log("Employees seeded with desk assignments:", employeesResult);

        return {
            success: true,
            teams: teamsResult.teams,
            employees: employeesResult.employees,
        };
    },
});

export const clearSeedData = action({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        console.log("Clearing seed data...");

        // Clear all teams
        await ctx.runMutation(api.teams.clearTeams);

        // Clear all employees
        await ctx.runMutation(api.employees.clearEmployees);

        return {
            success: true,
        };
    }
})