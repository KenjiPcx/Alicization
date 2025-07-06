import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc } from "./_generated/dataModel";

// Helper to generate random names
const firstNames = {
    male: ["John", "Michael", "David", "James", "Robert", "William", "Christopher", "Daniel", "Matthew", "Joseph"],
    female: ["Sarah", "Emma", "Jessica", "Ashley", "Emily", "Samantha", "Elizabeth", "Michelle", "Jennifer", "Amanda"]
};

const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];

const personalities = [
    "Analytical and detail-oriented",
    "Creative and innovative",
    "Collaborative team player",
    "Results-driven achiever",
    "Strategic thinker",
    "Customer-focused professional",
    "Technical problem solver",
    "Empathetic communicator"
];

const backgrounds = [
    "10+ years of industry experience",
    "Former startup founder",
    "PhD in their field",
    "Career switcher with fresh perspective",
    "Rising star from top university",
    "International background with global perspective",
    "Military veteran bringing leadership skills",
    "Self-taught expert with proven track record"
];

function generateEmployeeData(teamName: string, isSupervisor: boolean = false, isCEO: boolean = false) {
    const gender = Math.random() > 0.5 ? "male" : "female";
    const firstName = firstNames[gender][Math.floor(Math.random() * firstNames[gender].length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    let jobTitle = "";
    let jobDescription = "";

    if (isCEO) {
        jobTitle = "Chief Executive Officer";
        jobDescription = "Leads the company vision and strategy";
    } else if (isSupervisor) {
        jobTitle = `${teamName} Director`;
        jobDescription = `Leads the ${teamName} team to achieve departmental goals`;
    } else {
        const roles = {
            "Marketing": ["Marketing Specialist", "Content Manager", "Brand Strategist"],
            "Sales": ["Account Executive", "Sales Representative", "Business Development"],
            "Engineering": ["Software Engineer", "Senior Developer", "Tech Lead"],
            "Design": ["Product Designer", "UX Researcher", "Visual Designer"],
            "Customer Success": ["Customer Success Manager", "Support Specialist", "Account Manager"],
            "Product": ["Product Manager", "Product Analyst", "Product Owner"],
            "Management": ["Executive Assistant", "Chief of Staff", "Operations Manager"]
        };

        const teamRoles = roles[teamName as keyof typeof roles] || ["Team Member"];
        jobTitle = teamRoles[Math.floor(Math.random() * teamRoles.length)];
        jobDescription = `Contributes to ${teamName} team objectives and deliverables`;
    }

    return {
        name: `${firstName} ${lastName}`,
        jobTitle,
        jobDescription,
        gender: gender as "male" | "female",
        background: backgrounds[Math.floor(Math.random() * backgrounds.length)],
        personality: personalities[Math.floor(Math.random() * personalities.length)],
        status: "available",
        statusMessage: "Ready to collaborate",
        isSupervisor,
        isCEO
    };
}

export const seedEmployees = action({
    args: {},
    handler: async (ctx): Promise<{ message: string, count: number, employees: Doc<"employees">[] }> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check if employees already exist
        const existingEmployees: (Doc<"employees"> & { team: Doc<"teams"> })[] = await ctx.runQuery(api.employees.getAllEmployees);
        if (existingEmployees.length > 0) {
            console.log("Employees already seeded");
            return {
                message: "Employees already exist",
                count: existingEmployees.length,
                employees: existingEmployees.map(e => ({ ...e, team: undefined }))
            };
        }

        // First, ensure teams are seeded
        const teams: Doc<"teams">[] = await ctx.runQuery(api.teams.getAllTeams);
        if (teams.length === 0) {
            await ctx.runMutation(api.teams.seedTeams);
            const newTeams = await ctx.runQuery(api.teams.getAllTeams);
            teams.push(...newTeams);
        }

        const employees: Doc<"employees">[] = [];

        // Create employees for each team
        for (const team of teams) {
            const teamSize = team.name === "Management" ? 1 : 6; // Management only has CEO, others have 6

            for (let i = 0; i < teamSize; i++) {
                const isSupervisor = i === 0 && team.name !== "Management";
                const isCEO = team.name === "Management";

                const employeeData = generateEmployeeData(team.name, isSupervisor, isCEO);

                // 80% chance to be at desk, 20% walking around
                const isAtDesk = Math.random() < 0.8 || isCEO; // CEO always at desk
                const deskIndex = isAtDesk ? i : undefined;

                const employee = await ctx.runMutation(api.employees.createEmployee, {
                    teamId: team._id,
                    ...employeeData,
                    deskIndex, // May be undefined if walking around
                });

                employees.push(employee);
            }
        }

        return {
            message: "Employees seeded successfully",
            count: employees.length,
            employees
        };
    },
});

export const createEmployee = mutation({
    args: {
        teamId: v.id("teams"),
        name: v.string(),
        jobTitle: v.string(),
        jobDescription: v.string(),
        gender: v.union(v.literal("male"), v.literal("female")),
        background: v.string(),
        personality: v.string(),
        statusMessage: v.string(),
        isSupervisor: v.boolean(),
        isCEO: v.boolean(),
        deskIndex: v.optional(v.number()),
    },
    handler: async (ctx, args): Promise<Doc<"employees">> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const employeeId = await ctx.db.insert("employees", {
            ...args,
            status: "none",
            userId,
        });

        return await ctx.db.get(employeeId) as Doc<"employees">;
    },
});

export const getAllEmployees = query({
    args: {},
    handler: async (ctx): Promise<(Doc<"employees"> & { team: Doc<"teams"> })[]> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const employees = await ctx.db
            .query("employees")
            .filter((q) => q.eq(q.field("userId"), userId))
            .collect();

        // Join with team data
        const enrichedEmployees = await Promise.all(
            employees.map(async (employee) => {
                const team = await ctx.db.get(employee.teamId) as Doc<"teams">;
                return {
                    ...employee,
                    team,
                };
            })
        );

        return enrichedEmployees;
    },
});

export const getEmployeesByTeam = query({
    args: { teamId: v.id("teams") },
    handler: async (ctx, { teamId }) => {
        return await ctx.db
            .query("employees")
            .withIndex("by_teamId", (q) => q.eq("teamId", teamId))
            .collect();
    },
});

export const getEmployeeById = query({
    args: { employeeId: v.id("employees") },
    handler: async (ctx, { employeeId }) => {
        const employee = await ctx.db.get(employeeId);
        if (!employee) return null;

        const team = await ctx.db.get(employee.teamId);
        const toolsIds = (await ctx.db.query("employeeToTools").withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId)).collect()).map((tool) => tool.toolId);
        const tools = await Promise.all(toolsIds.map((toolId) => ctx.db.get(toolId)));

        // Filter null tools
        const filteredTools = tools.filter((tool) => tool !== null);
        
        return {
            ...employee,
            team: team ? { _id: team._id, name: team.name } : undefined,
            tools: filteredTools,
        };
    },
});

export const clearEmployees = mutation({
    args: {},
    handler: async (ctx) => {
        const employees = await ctx.db.query("employees").collect();
        for (const employee of employees) {
            await ctx.db.delete(employee._id);
        }
    },
});