// Dynamic Skill Learning System - Allows employees to learn new skills organically
// When users say "let me teach you a skill", this tool creates the skill and documentation

/**
 * LEARN SKILL TOOL GUIDE
 * 
 * Use this tool when users want to teach you a new skill or workflow:
 * 
 * 📚 **learnSkill**: Create a new skill and generate documentation
 * - Triggered when user says "let me teach you a skill"
 * - Creates skill record with proficiency level
 * - Generates documentation artifact that auto-saves to company files
 * - Builds institutional knowledge that can be shared
 * 
 * 📚 **updateSkill:**
 * - If the user wants to update the workflow for an existing skill, you can call the learnSkill tool again with the same skill name and description.
 * - This will update the skill record and documentation artifact.
 * 
 * 💡 **Best Practices**:
 * - Listen carefully to the entire workflow description
 * - Ask clarifying questions if steps are unclear
 * - Use descriptive skill names that others can understand
 * - Set appropriate proficiency level based on complexity
 * - Create comprehensive documentation for future reference
 */

import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { z } from "zod";
import { ActionCtx } from "@/convex/_generated/server";
import { tool } from "ai";
import dedent from "dedent";
import { ResolveToolProps, withToolErrorHandling } from "@/lib/ai/tool-utils";

export const useLearnSkillPrompt = dedent`
    <Learn Skill Tool Docs>
    **Learn Skill Tool:**
    - learnSkill: Create a new skill when users teach you workflows
    
    **Learn new skills workflow:**
    - User says "let me teach you a skill" or similar and then describes the workflow
    - You create a text artifact to write out the workflow in markdown and collaborate with the user to refine the artifact
    - User tells you that you they are satisfied with the text in the artifact
    - Then you call the learnSkill tool to learn the skill
    
    **Guidelines:**
    - Use clear, descriptive skill names
    </Learn Skill Tool Docs>
`

export type LearnSkillResult = {
    success: boolean;
    message: string;
    skillId: Id<"skills">;
};

const resolveLearnSkillTool = ({
    ctx,
    threadId,
    userId,
    employeeId,
    companyId
}: ResolveToolProps) => tool({
    description: "Learn a new skill when the user teaches you a workflow. Creates skill record and generates documentation that gets saved to company files for institutional knowledge. Only call this tool after confirming the workflow details with the user. Always ask for user confirmation before calling this tool.",
    parameters: z.object({
        artifactGroupId: z.string().describe("The ID of the artifact group to save the documentation to. This is the ID of the artifact group in the database."),
        skillName: z.string().describe("Clear, descriptive name for the skill (e.g., 'Customer Onboarding Process', 'Bug Triage Workflow')"),
        skillDescription: z.string().describe("Brief description of what this skill accomplishes"),
    }),
    execute: async (args, { toolCallId }): Promise<LearnSkillResult> => {
        return withToolErrorHandling(
            async () => {
                const { artifactGroupId, skillName, skillDescription } = args;

                const backgroundJobStatusId = await ctx.runMutation(internal.backgroundJobStatuses.createBackgroundJobStatus, {
                    toolCallId,
                    threadId,
                    toolName: "learnSkill",
                    toolParameters: args,
                });

                // First, create the skill record
                const { skillId, imageUrl } = await ctx.runAction(internal.skills.internalCreateSkillWithIcon, {
                    name: skillName,
                    description: skillDescription,
                    userId,
                });

                await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
                    backgroundJobStatusId,
                    status: "running",
                    message: "Created skill record. Assigning skill to employee",
                    progress: 33,
                });

                // Then, assign the skill to this employee
                await ctx.runMutation(internal.skills.internalAddSkillToEmployee, {
                    employeeId,
                    skillId,
                    notes: "Learned directly from user instruction",
                });

                await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
                    backgroundJobStatusId,
                    status: "running",
                    message: "Assigned skill to employee. Creating company file",
                    progress: 67,
                });

                await ctx.runAction(internal.companyFiles.convertArtifactToCompanyFile, {
                    artifactGroupId,
                    skillId,
                    employeeId,
                    companyId,
                    userId,
                });

                await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
                    backgroundJobStatusId,
                    status: "completed",
                    message: "Successfully learned skill",
                    progress: 100,
                });

                return {
                    skillId,
                    imageUrl,
                };
            },
            {
                operation: "Learned skill",
                context: `${args.skillName}`,
                includeTechnicalDetails: true
            },
            (result) => ({
                message: `Successfully added documentation for "${args.skillName}". Documentation is being generated and will be saved to company files for future reference.`,
                ...result,
            })
        );
    },
});

export const resolveSkillToolset = (toolProps: ResolveToolProps) => {
    return {
        learnSkill: resolveLearnSkillTool(toolProps),
        // TODO: Add updateSkill, viewSkill
    }
}