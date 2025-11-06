import { v } from "convex/values";

import { storeFile } from "@convex-dev/agent";
import { action } from "./_generated/server";
import { components } from "./_generated/api";

export const uploadFile = action({
    args: {
        filename: v.string(),
        mimeType: v.string(),
        bytes: v.bytes(),
        sha256: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = (await ctx.auth.getUserIdentity())?.subject;
        if (!userId) {
            throw new Error("Unauthorized");
        }
        // Note: we're using storeFile which will store the file in file storage
        // or re-use an existing file with the same hash and track references.
        const {
            file: { fileId, url },
        } = await storeFile(
            ctx,
            components.agent,
            new Blob([args.bytes], { type: args.mimeType }),
            {
                filename: args.filename,
                sha256: args.sha256,
            }
        );
        return { fileId, url };
    },
});
