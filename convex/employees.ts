import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { vBuiltInRoles, vEmployeeStatuses } from "./schema";
import { patchEmployee } from "./utils";

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

const generateRandomName = () => {
    const gender = Math.random() > 0.5 ? "male" : "female";
    const firstName = firstNames[gender][Math.floor(Math.random() * firstNames[gender].length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
}

export const seedEmployees = action({
    args: {
        companyId: v.id("companies"),
    },
    handler: async (ctx, { companyId }): Promise<{ message: string, count: number, employees: Doc<"employees">[] }> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check if employees already exist
        const existingEmployees: (Doc<"employees"> & { team: Doc<"teams"> })[] = await ctx.runQuery(api.employees.getAllEmployees, { companyId });
        if (existingEmployees.length > 0) {
            console.log("Employees already seeded");
            return {
                message: "Employees already exist",
                count: existingEmployees.length,
                employees: existingEmployees.map(e => ({ ...e, team: undefined }))
            };
        }

        // First, ensure teams are seeded
        const teams: Doc<"teams">[] = await ctx.runQuery(api.teams.getAllTeams, { companyId });
        if (teams.length === 0) {
            await ctx.runMutation(api.teams.seedTeams, {
                companyId: companyId,
            });
            const newTeams = await ctx.runQuery(api.teams.getAllTeams, { companyId });
            teams.push(...newTeams);
        }

        const employees: Doc<"employees">[] = [];

        // Create employees for each team
        for (const team of teams) {
            const teamSize = team.name === "CEO" ? 1 : 6; // CEO only has 1 employee, others have 6

            for (let i = 0; i < teamSize; i++) {
                const isSupervisor = i === 0 && team.name !== "CEO";
                const isCEO = team.name === "CEO";

                const employeeData = generateEmployeeData(team.name, isSupervisor, isCEO);

                // 80% chance to be at desk, 20% walking around
                const isAtDesk = Math.random() < 0.8 || isCEO; // CEO always at desk
                const deskIndex = isAtDesk ? i : undefined;

                const employee = await ctx.runMutation(internal.employees.createEmployee, {
                    teamId: team._id,
                    ...employeeData,
                    deskIndex, // May be undefined if walking around
                    companyId: companyId,
                    userId: userId,
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

export const createEmployee = internalMutation({
    args: {
        teamId: v.id("teams"),
        name: v.optional(v.string()),
        jobTitle: v.string(),
        jobDescription: v.string(),
        gender: v.union(v.literal("male"), v.literal("female")),
        background: v.optional(v.string()),
        personality: v.optional(v.string()),
        statusMessage: v.optional(v.string()),
        isSupervisor: v.boolean(),
        isCEO: v.boolean(),
        builtInRole: v.optional(vBuiltInRoles),
        deskIndex: v.optional(v.number()),
        companyId: v.id("companies"),
        userId: v.id("users"),
    },
    handler: async (ctx, args): Promise<Doc<"employees">> => {
        const employeeId = await ctx.db.insert("employees", {
            ...args,
            name: args.name || generateRandomName(),
            background: args.background || backgrounds[Math.floor(Math.random() * backgrounds.length)],
            personality: args.personality || personalities[Math.floor(Math.random() * personalities.length)],
            statusMessage: args.statusMessage || "Ready to collaborate",
            status: "none",
        });

        return await ctx.db.get(employeeId) as Doc<"employees">;
    },
});

export const updateEmployee = mutation({
    args: {
        employeeId: v.id("employees"),
        teamId: v.optional(v.id("teams")),
        name: v.optional(v.string()),
        jobTitle: v.optional(v.string()),
        jobDescription: v.optional(v.string()),
        gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
        background: v.optional(v.string()),
        personality: v.optional(v.string()),
        status: v.optional(vEmployeeStatuses),
        statusMessage: v.optional(v.string()),
        isSupervisor: v.optional(v.boolean()),
        isCEO: v.optional(v.boolean()),
        builtInRole: v.optional(vBuiltInRoles),
        deskIndex: v.optional(v.number()),
        companyId: v.optional(v.id("companies")),
    },
    handler: async (ctx, args): Promise<Doc<"employees">> => {
        const { employeeId, ...updates } = args;

        const employee = await ctx.db.get(employeeId) as Doc<"employees">;
        if (!employee) throw new Error("Employee not found");

        // Use the type-safe update helper
        await patchEmployee(ctx, employeeId, updates);

        return await ctx.db.get(employeeId) as Doc<"employees">;
    },
});

export const getAllEmployees = query({
    args: {
        companyId: v.id("companies"),
    },
    handler: async (ctx, { companyId }): Promise<(Doc<"employees"> & { team: Doc<"teams"> })[]> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const employees = await ctx.db
            .query("employees")
            .filter((q) => q.eq(q.field("companyId"), companyId))
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
    args: {
        employeeId: v.id("employees"),
        includeImages: v.optional(v.boolean())
    },
    handler: async (ctx, { employeeId, includeImages }) => {
        const employee = await ctx.db.get(employeeId);
        if (!employee) return null;

        const team = await ctx.db.get(employee.teamId);
        if (!team) throw new Error("Team not found");

        // Get toolsets
        const toolsetIds = (await ctx.db.query("employeeToToolsets")
            .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
            .collect())
            .map((assignment) => assignment.toolsetId);
        const toolsets = await Promise.all(toolsetIds.map((toolsetId) => ctx.db.get(toolsetId)));
        const filteredToolsets = toolsets.filter((toolset) => toolset !== null);

        // Get skills
        const employeeSkills = await ctx.db
            .query("employeeToSkills")
            .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
            .collect();

        const enrichedSkills = await Promise.all(
            employeeSkills.map(async (empSkill) => {
                const skill = await ctx.db.get(empSkill.skillId);
                if (!skill) return null;
                return {
                    ...empSkill,
                    skill,
                    skillImageUrl: includeImages ? (await ctx.storage.getUrl(skill.imageStorageId)) : undefined,
                };
            })
        );

        const filteredSkills = enrichedSkills.filter(es => es !== null && es.skill !== null);

        return {
            ...employee,
            team: { _id: team._id, name: team.name },
            toolsets: filteredToolsets.map(t => ({
                _id: t._id,
                name: t.name,
                description: t.description,
                type: t.type,
                toolsetConfig: t.toolsetConfig,
            })),
            skills: filteredSkills.map(s => ({
                _id: s!.skill._id,
                name: s!.skill.name,
                description: s!.skill.description,
                imageUrl: s!.skillImageUrl,
            })),
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

export const setEmployeeCompanyId = mutation({
    args: {
        employeeId: v.id("employees"),
        companyId: v.id("companies"),
    },
    handler: async (ctx, { employeeId, companyId }) => {
        await ctx.db.patch(employeeId, { companyId });
    },
});

export const getEmployeesByCompany = query({
    args: {
        companyId: v.id("companies"),
    },
    handler: async (ctx, args) => {
        const { companyId } = args;

        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Get all employees for the company
        const employees = await ctx.db.query("employees")
            .filter((q) => q.eq(q.field("companyId"), companyId))
            .collect();

        // Only return employees that belong to the authenticated user
        const userEmployees = employees.filter(employee => employee.userId === userId);

        // Get team and toolset information for each employee
        const enrichedEmployees = await Promise.all(
            userEmployees.map(async (employee) => {
                // Get team
                const team = await ctx.db.get(employee.teamId);

                // Get toolsets
                const toolsetIds = (await ctx.db.query("employeeToToolsets")
                    .withIndex("by_employeeId", (q) => q.eq("employeeId", employee._id))
                    .collect())
                    .map((assignment) => assignment.toolsetId);
                const toolsets = await Promise.all(toolsetIds.map((toolsetId) => ctx.db.get(toolsetId)));
                const filteredToolsets = toolsets.filter((toolset) => toolset !== null);

                return {
                    ...employee,
                    team: team ? { _id: team._id, name: team.name } : null,
                    toolsets: filteredToolsets.map(t => ({
                        _id: t._id,
                        name: t.name,
                        description: t.description,
                        type: t.type,
                    })),
                };
            })
        );

        return enrichedEmployees;
    },
});

export const getEmployeeMicroApps = query({
    args: {
        employeeId: v.id("employees"),
    },
    handler: async (ctx, { employeeId }) => {
        const employee = await ctx.db.get(employeeId);
        if (!employee) return null;
    },
});