import { internalMutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { vProviderMetadata, vUsage } from "@convex-dev/agent";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

const HOUR_IN_MS = 60 * 60 * 1000;

function getBillingPeriod(at: number) {
    const now = new Date(at);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth());
    return startOfMonth.toISOString().split("T")[0];
}

export const getCurrentUserMetadata = query({
    args: {
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("User not authenticated");
        }
        const userMetadata = await ctx.db.query("usersMetadata")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();
        return userMetadata;
    },
});

export const insertRawUsage = internalMutation({
    args: {
        userId: v.string(),
        agentName: v.optional(v.string()),
        model: v.string(),
        provider: v.string(),
        usage: vUsage,
        providerMetadata: vProviderMetadata,
    },
    handler: async (ctx, args) => {
        const billingPeriod = getBillingPeriod(Date.now());
        return await ctx.db.insert("rawUsage", {
            ...args,
            billingPeriod,
        });
    },
});

const provider = v.string();
const model = v.string();
/**
 * Called from a cron monthly to calculate the
 * invoices for the previous billing period
 */
export const generateInvoices = internalMutation({
    args: {
        billingPeriod: v.optional(v.string()),
        cursor: v.optional(v.string()),
        inProgress: v.optional(
            v.object({
                userId: v.string(),
                usage: v.record(
                    provider,
                    v.record(
                        model,
                        v.object({
                            inputTokens: v.number(),
                            outputTokens: v.number(),
                            cachedInputTokens: v.number(),
                        })
                    )
                ),
            })
        ),
    },
    handler: async (ctx, args) => {
        // Assume we're billing within a week of the previous billing period
        const weekAgo = Date.now() - 7 * 24 * HOUR_IN_MS;
        const billingPeriod = args.billingPeriod ?? getBillingPeriod(weekAgo);

        const result = await ctx.db
            .query("rawUsage")
            .withIndex("billingPeriod_userId", (q) =>
                q.eq("billingPeriod", billingPeriod)
            )
            .paginate({
                cursor: args.cursor ?? null,
                numItems: 100,
            });
        let currentInvoice = args.inProgress;
        for (const doc of result.page) {
            const cachedPromptTokens =
                doc.providerMetadata?.openai?.cachedPromptTokens ?? 0;
            const tokens = {
                inputTokens: doc.usage.promptTokens - cachedPromptTokens,
                outputTokens: doc.usage.completionTokens,
                cachedInputTokens: cachedPromptTokens,
            };
            if (!currentInvoice) {
                currentInvoice = {
                    userId: doc.userId,
                    usage: { [doc.provider]: { [doc.model]: tokens } },
                };
            } else if (doc.userId !== currentInvoice.userId) {
                await createInvoice(ctx, currentInvoice, billingPeriod);
                currentInvoice = {
                    userId: doc.userId,
                    usage: { [doc.provider]: { [doc.model]: tokens } },
                };
            } else {
                const currentTokens = currentInvoice.usage[doc.provider][doc.model];
                currentTokens.inputTokens += tokens.inputTokens;
                currentTokens.outputTokens += tokens.outputTokens;
                currentTokens.cachedInputTokens += tokens.cachedInputTokens;
            }
        }
        if (result.isDone) {
            if (currentInvoice) {
                await createInvoice(ctx, currentInvoice, billingPeriod);
            }
        } else {
            await ctx.runMutation(internal.usage.generateInvoices, {
                billingPeriod,
                cursor: result.continueCursor,
                inProgress: currentInvoice,
            });
        }
    },
});

// TODO: Map employeeId to userId and pool into one single invoice
const MILLION = 1000000;

const PRICING: Record<
    string,
    Record<
        string,
        { inputPrice: number; cachedInputPrice: number; outputPrice: number }
    >
> = {
    "openai.chat": {
        "gpt-4o-mini": {
            inputPrice: 0.3,
            cachedInputPrice: 0.15,
            outputPrice: 1.2,
        },
    },
};

async function createInvoice(
    ctx: MutationCtx,
    invoice: {
        userId: string;
        usage: Record<
            string,
            Record<
                string,
                { inputTokens: number; outputTokens: number; cachedInputTokens: number }
            >
        >;
    },
    billingPeriod: string
) {
    let amount = 0;
    for (const provider of Object.keys(invoice.usage)) {
        for (const model of Object.keys(invoice.usage[provider])) {
            if (PRICING[provider][model] === undefined) {
                throw new Error(`Missing pricing for ${provider} ${model}`);
            }
            const { inputPrice, cachedInputPrice, outputPrice } =
                PRICING[provider][model];
            const { inputTokens, cachedInputTokens, outputTokens } =
                invoice.usage[provider][model];
            amount +=
                ((inputTokens - cachedInputTokens) / MILLION) * inputPrice +
                (cachedInputTokens / MILLION) * cachedInputPrice +
                (outputTokens / MILLION) * outputPrice;
        }
    }
    // Check if the invoice already exists
    const existingInvoice = await ctx.db
        .query("invoices")
        .withIndex("billingPeriod_userId", (q) =>
            q.eq("billingPeriod", billingPeriod).eq("userId", invoice.userId)
        )
        .filter((q) => q.neq(q.field("status"), "failed"))
        .first();
    if (existingInvoice) {
        console.error(
            `Invoice already exists for ${invoice.userId} ${billingPeriod}`
        );
    } else {
        await ctx.db.insert("invoices", {
            userId: invoice.userId,
            amount,
            billingPeriod,
            status: "pending",
        });
    }
}