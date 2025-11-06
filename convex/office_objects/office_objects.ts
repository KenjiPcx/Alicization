import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Mesh Types Management
export const createMeshType = mutation({
    args: {
        name: v.string(),
        category: v.union(
            v.literal("furniture"),
            v.literal("cluster"),
            v.literal("decoration"),
            v.literal("equipment"),
        ),
        displayName: v.string(),
        description: v.optional(v.string()),
        defaultScale: v.optional(v.array(v.number())),
        defaultRotation: v.optional(v.array(v.number())),
        isDraggable: v.boolean(),
        metadata: v.optional(v.object({
            deskCount: v.optional(v.number()),
            color: v.optional(v.string()),
            material: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("meshTypes", args);
    },
});

export const getMeshTypes = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("meshTypes").collect();
    },
});

export const getMeshTypeByName = query({
    args: { name: v.string() },
    handler: async (ctx, { name }) => {
        return await ctx.db
            .query("meshTypes")
            .withIndex("by_name", (q) => q.eq("name", name))
            .first();
    },
});

// Office Objects Management
export const createOfficeObject = mutation({
    args: {
        companyId: v.id("companies"),
        meshType: v.string(),
        identifier: v.string(),
        position: v.array(v.number()),
        rotation: v.optional(v.array(v.number())),
        scale: v.optional(v.array(v.number())),
        metadata: v.optional(v.object({
            teamId: v.optional(v.id("teams")),
            color: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert("officeObjects", {
            ...args,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const getOrCreateOfficeObject = mutation({
    args: {
        companyId: v.id("companies"),
        meshType: v.string(),
        identifier: v.string(),
        defaultPosition: v.optional(v.array(v.number())),
        defaultRotation: v.optional(v.array(v.number())),
        defaultScale: v.optional(v.array(v.number())),
        metadata: v.optional(v.object({
            teamId: v.optional(v.id("teams")),
            color: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const { companyId, meshType, identifier, defaultPosition, defaultRotation, defaultScale, metadata } = args;

        // Try to find existing object by identifier
        const existing = await ctx.db
            .query("officeObjects")
            .withIndex("by_identifier", (q) => q.eq("identifier", identifier))
            .filter((q) => q.eq(q.field("companyId"), companyId))
            .first();

        if (existing) {
            return existing._id;
        }

        // Create new office object
        const now = Date.now();
        const newId = await ctx.db.insert("officeObjects", {
            companyId,
            meshType,
            identifier,
            position: defaultPosition || [0, 0, 0],
            rotation: defaultRotation || [0, 0, 0],
            scale: defaultScale || [1, 1, 1],
            metadata,
            createdAt: now,
            updatedAt: now,
        });

        return newId;
    },
});

export const updateOfficeObjectPosition = mutation({
    args: {
        id: v.id("officeObjects"),
        position: v.array(v.number()),
        rotation: v.optional(v.array(v.number())),
        scale: v.optional(v.array(v.number())),
    },
    handler: async (ctx, args) => {
        const { id, position, rotation, scale } = args;
        const now = Date.now();

        return await ctx.db.patch(id, {
            position,
            rotation,
            scale,
            updatedAt: now,
        });
    },
});

export const updateTeamClusterPosition = mutation({
    args: {
        teamId: v.id("teams"),
        position: v.array(v.number()),
    },
    handler: async (ctx, args) => {
        // Verify team exists
        const team = await ctx.db.get(args.teamId);
        if (!team) {
            throw new Error("Team not found");
        }

        // Update team cluster position - keeping for backwards compatibility
        return await ctx.db.patch(args.teamId, {
            clusterPosition: args.position,
        });
    },
});

export const getOfficeObjects = query({
    args: {
        companyId: v.id("companies"),
    },
    handler: async (ctx, { companyId }) => {
        return await ctx.db
            .query("officeObjects")
            .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
            .collect();
    },
});

export const getOfficeObjectsByMeshType = query({
    args: {
        companyId: v.id("companies"),
        meshType: v.string(),
    },
    handler: async (ctx, { companyId, meshType }) => {
        return await ctx.db
            .query("officeObjects")
            .withIndex("by_companyId_meshType", (q) => q.eq("companyId", companyId).eq("meshType", meshType))
            .collect();
    },
});

export const getOfficeObject = query({
    args: {
        id: v.id("officeObjects"),
    },
    handler: async (ctx, { id }) => {
        return await ctx.db.get(id);
    },
});

export const getOfficeObjectByIdentifier = query({
    args: {
        companyId: v.id("companies"),
        identifier: v.string(),
    },
    handler: async (ctx, { companyId, identifier }) => {
        return await ctx.db
            .query("officeObjects")
            .withIndex("by_identifier", (q) => q.eq("identifier", identifier))
            .filter((q) => q.eq(q.field("companyId"), companyId))
            .first();
    },
});

// Seed default mesh types
export const seedMeshTypes = mutation({
    args: {},
    handler: async (ctx) => {
        const existingTypes = await ctx.db.query("meshTypes").collect();
        if (existingTypes.length > 0) {
            return { message: "Mesh types already seeded", count: existingTypes.length };
        }

        const defaultMeshTypes = [
            {
                name: "team-cluster",
                category: "cluster" as const,
                displayName: "Team Desk Cluster",
                description: "A group of desks for a team",
                isDraggable: true,
                metadata: { deskCount: 6 },
            },
            {
                name: "plant",
                category: "decoration" as const,
                displayName: "Office Plant",
                description: "A decorative plant for the office",
                isDraggable: true,
                metadata: { color: "#228B22" },
            },
            {
                name: "couch",
                category: "furniture" as const,
                displayName: "Office Couch",
                description: "A comfortable seating area",
                isDraggable: true,
                metadata: { color: "#4682B4" },
            },
            {
                name: "bookshelf",
                category: "furniture" as const,
                displayName: "Bookshelf",
                description: "Storage for books and documents",
                isDraggable: true,
                metadata: { color: "#8B4513" },
            },
            {
                name: "pantry",
                category: "equipment" as const,
                displayName: "Office Pantry",
                description: "Kitchen area with appliances",
                isDraggable: true,
                metadata: { color: "#FFFFFF" },
            },
        ];

        const created = [];
        for (const meshType of defaultMeshTypes) {
            const id = await ctx.db.insert("meshTypes", meshType);
            created.push(id);
        }

        return { message: "Mesh types seeded successfully", count: created.length };
    },
});

// Migrate existing team clusters to officeObjects
export const migrateTeamClustersToOfficeObjects = mutation({
    args: {},
    handler: async (ctx) => {
        // Get all teams with cluster positions
        const teams = await ctx.db.query("teams").collect();
        const teamsWithPositions = teams.filter(team => team.clusterPosition && team.companyId);

        if (teamsWithPositions.length === 0) {
            return { message: "No teams with cluster positions found", migrated: 0 };
        }

        const migrated = [];
        const now = Date.now();

        for (const team of teamsWithPositions) {
            // Check if this team cluster already exists in officeObjects
            const existing = await ctx.db
                .query("officeObjects")
                .withIndex("by_identifier", (q) => q.eq("identifier", `team-${team._id}`))
                .filter((q) => q.eq(q.field("companyId"), team.companyId!))
                .first();

            if (!existing) {
                // Create office object for this team cluster
                const officeObjectId = await ctx.db.insert("officeObjects", {
                    companyId: team.companyId!,
                    meshType: "team-cluster",
                    identifier: `team-${team._id}`,
                    position: team.clusterPosition!,
                    rotation: [0, 0, 0],
                    metadata: {
                        teamId: team._id,
                    },
                });

                migrated.push({
                    teamId: team._id,
                    teamName: team.name,
                    position: team.clusterPosition,
                    officeObjectId,
                });
            }
        }

        return {
            message: `Migrated ${migrated.length} team clusters to office objects`,
            migrated: migrated.length,
            details: migrated
        };
    },
});

// Seed default furniture objects
export const seedDefaultFurniture = mutation({
    args: {
        companyId: v.id("companies"),
    },
    handler: async (ctx, { companyId }) => {
        const created = [];

        // Default furniture positions based on your current hardcoded positions
        const defaultFurniture = [
            {
                meshType: "pantry",
                identifier: "pantry-main",
                position: [0, 0, -16], // -HALF_FLOOR + 1 where HALF_FLOOR = 17.5, so -16.5 ≈ -16
            },
            {
                meshType: "bookshelf",
                identifier: "bookshelf-main",
                position: [-10.25, 0, -17.3], // -HALF_FLOOR + 0.4/2
            },
            {
                meshType: "couch",
                identifier: "couch-main",
                position: [10.25, 0, -17], // -HALF_FLOOR + 1.0/2
            },
            // Plants - adding a few based on typical office layout
            {
                meshType: "plant",
                identifier: "plant-0",
                position: [-15, 0, -10],
            },
            {
                meshType: "plant",
                identifier: "plant-1",
                position: [15, 0, -10],
            },
            {
                meshType: "plant",
                identifier: "plant-2",
                position: [-15, 0, 10],
            },
            {
                meshType: "plant",
                identifier: "plant-3",
                position: [15, 0, 10],
            },
        ];

        for (const item of defaultFurniture) {
            // Check if this object already exists
            const existing = await ctx.db
                .query("officeObjects")
                .withIndex("by_identifier", (q) => q.eq("identifier", item.identifier))
                .filter((q) => q.eq(q.field("companyId"), companyId))
                .first();

            if (!existing) {
                const officeObjectId = await ctx.db.insert("officeObjects", {
                    companyId,
                    meshType: item.meshType,
                    identifier: item.identifier,
                    position: item.position,
                    rotation: [0, 0, 0],
                    metadata: {},
                });

                created.push({
                    identifier: item.identifier,
                    meshType: item.meshType,
                    position: item.position,
                    officeObjectId,
                });
            }
        }

        return {
            message: `Seeded ${created.length} default furniture objects`,
            created: created.length,
            details: created,
        };
    },
}); 