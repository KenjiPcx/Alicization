import { defineTable } from "convex/server";
import { v } from "convex/values";

export const officeObjectsTables = {
    // Define different types of 3D objects that can be rendered in the office
    meshTypes: defineTable({
        name: v.string(), // "plant", "couch", "team-cluster", "bookshelf", etc.
        category: v.union(
            v.literal("furniture"),
            v.literal("cluster"),
            v.literal("decoration"),
            v.literal("equipment"),
        ),
        displayName: v.string(), // "Office Plant", "Team Desk Cluster", etc.
        description: v.optional(v.string()),
        defaultScale: v.optional(v.array(v.number())), // [x, y, z] default scale
        defaultRotation: v.optional(v.array(v.number())), // [x, y, z] default rotation
        isDraggable: v.boolean(), // Can this object type be moved?
        metadata: v.optional(v.object({
            // Extensible metadata for different object types
            deskCount: v.optional(v.number()), // For team clusters
            color: v.optional(v.string()), // Default color
            material: v.optional(v.string()), // Material type
        })),
    }).index("by_name", ["name"])
        .index("by_category", ["category"]),

    // Store positions and properties for all draggable objects in the office
    officeObjects: defineTable({
        companyId: v.id("companies"),
        meshType: v.string(), // References meshTypes.name
        identifier: v.string(), // Unique identifier like "team-engineering", "plant-lobby-1", etc.
        position: v.array(v.number()), // [x, y, z] world position
        rotation: v.optional(v.array(v.number())), // [x, y, z] rotation in radians
        scale: v.optional(v.array(v.number())), // [x, y, z] scale multiplier
        metadata: v.optional(v.object({
            // Object-specific metadata
            teamId: v.optional(v.id("teams")), // For team-cluster type
            color: v.optional(v.string()), // Custom color override
        })),
        createdAt: v.optional(v.number()), // TODO: Remove this field
        updatedAt: v.optional(v.number()), // TODO: Remove this field
    }).index("by_companyId", ["companyId"])
        .index("by_meshType", ["meshType"])
        .index("by_identifier", ["identifier"])
        .index("by_companyId_meshType", ["companyId", "meshType"]),

}