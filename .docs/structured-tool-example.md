# Structured Tool Response Example

This document shows how to convert the `createArtifact` tool to use the new structured response pattern.

## Previous Implementation (Before Migration)

```typescript
export const createArtifact = createTool({
    description: "Create a artifact for activities...",
    args: z.object({
        title: z.string().describe("The title of the artifact"),
        type: z.enum(["text", "sheet", "code", "image", "video", "music"]).describe("The type of the artifact"),
        generationPrompt: z.string().describe("The prompt to generate the artifact"),
    }),
    handler: async (ctx, args, { toolCallId }): Promise<string> => {
        try {
            if (!ctx.threadId) throw new Error("Thread ID is required");
            if (!ctx.userId) throw new Error("User ID is required");
            if (!ctx.messageId) throw new Error("Message ID is required");
            
            const { title, type, generationPrompt } = args;

            const backgroundJobStatusId = await ctx.runMutation(internal.backgroundJobStatuses.createBackgroundJobStatus, {
                toolCallId,
                threadId: ctx.threadId,
                messageId: ctx.messageId,
                toolName: "createArtifact",
                toolParameters: args,
            });

            const jobId = await ctx.runAction(internal.artifacts.scheduleArtifactGeneration, {
                threadId: ctx.threadId,
                employeeId: ctx.userId,
                messageId: ctx.messageId,
                title: title,
                kind: type,
                generationPrompt: generationPrompt,
                toolCallId,
                backgroundJobStatusId,
            });

            return `Artifact scheduled to be created in the background with job id: ${jobId}. Will notify you when it is ready.`;
        } catch (error) {
            if (error instanceof Error) {
                return `Artifact creation failed: ${error.message}`;
            }
            return `Artifact creation failed: An unknown error occurred. Please try again.`;
        }
    },
})
```

## Updated Implementation (Structured Response)

```typescript
interface ArtifactCreationResult {
    success: boolean;
    message: string;
    jobId?: string;
    artifactTitle?: string;
    artifactType?: string;
    toolCallId?: string;
    estimatedCompletionTime?: string;
}

export const createArtifact = createTool({
    description: "Create a artifact for activities that need to generate some form of content output. This tool will call other functions that will generate the contents of the document based on the title and kind of artifact. This is a background job, you will receive a job id and the results when it is available. After calling this tool, you can continue doing other things or just end your turn.",
    args: z.object({
        title: z.string().describe("The title of the artifact"),
        type: z.enum(["text", "sheet", "code", "image", "video", "music"]).describe("The type of the artifact"),
        generationPrompt: z.string().describe("The prompt to generate the artifact, you should be as specific as possible with what you want to generate"),
    }),
    handler: async (ctx, args, { toolCallId }): Promise<ArtifactCreationResult> => {
        return withToolErrorHandling<string, Omit<ArtifactCreationResult, 'success' | 'message'>>(
            async () => {
                if (!ctx.threadId) throw new Error("Thread ID is required");
                if (!ctx.userId) throw new Error("User ID is required");
                if (!ctx.messageId) throw new Error("Message ID is required");
                
                const { title, type, generationPrompt } = args;

                const backgroundJobStatusId = await ctx.runMutation(internal.backgroundJobStatuses.createBackgroundJobStatus, {
                    toolCallId,
                    threadId: ctx.threadId,
                    messageId: ctx.messageId,
                    toolName: "createArtifact",
                    toolParameters: args,
                });

                const jobId = await ctx.runAction(internal.artifacts.scheduleArtifactGeneration, {
                    threadId: ctx.threadId,
                    employeeId: ctx.userId,
                    messageId: ctx.messageId,
                    title: title,
                    kind: type,
                    generationPrompt: generationPrompt,
                    toolCallId,
                    backgroundJobStatusId,
                });

                return jobId;
            },
            {
                operation: "Artifact creation",
                includeTechnicalDetails: true
            },
            (jobId) => ({
                message: `Artifact "${args.title}" scheduled to be created in the background. Will notify you when ready.`,
                jobId: jobId,
                artifactTitle: args.title,
                artifactType: args.type,
                toolCallId: toolCallId,
                estimatedCompletionTime: getEstimatedCompletionTime(args.type)
            })
        );
    },
})

// Helper function to estimate completion time based on artifact type
function getEstimatedCompletionTime(type: string): string {
    const estimates = {
        text: "30-60 seconds",
        sheet: "45-90 seconds", 
        code: "60-120 seconds",
        image: "90-180 seconds",
        video: "300-600 seconds",
        music: "240-480 seconds"
    };
    return estimates[type as keyof typeof estimates] || "60-120 seconds";
}
```

## Benefits of Structured Response

### 1. **Rich Data for UI Updates**
```typescript
// The UI can now display detailed progress information
const result = await createArtifactTool.run(args);
if (result.success) {
    showNotification({
        title: `Creating ${result.artifactType} artifact`,
        message: result.message,
        estimatedTime: result.estimatedCompletionTime,
        jobId: result.jobId
    });
}
```

### 2. **Programmatic Error Handling**
```typescript
const result = await createArtifactTool.run(args);
if (!result.success) {
    // Handle specific error cases
    logError(`Artifact creation failed`, {
        toolCallId: result.toolCallId,
        errorMessage: result.message
    });
    
    // Show user-friendly error
    showErrorDialog(result.message);
    return;
}

// Continue with success flow
trackArtifactCreation(result.jobId, result.artifactType);
```

### 3. **Type Safety**
```typescript
// TypeScript ensures all expected fields are present
function handleArtifactCreation(result: ArtifactCreationResult) {
    if (result.success) {
        // TypeScript knows these fields exist when success is true
        console.log(`Job ID: ${result.jobId}`);
        console.log(`Title: ${result.artifactTitle}`);
        console.log(`Type: ${result.artifactType}`);
    }
}
```

### 4. **Better Testing**
```typescript
// Tests can verify specific response fields
test('artifact creation returns proper structure', async () => {
    const result = await createArtifact.handler(mockCtx, mockArgs, { toolCallId: 'test' });
    
    expect(result.success).toBe(true);
    expect(result.jobId).toMatch(/^[a-z0-9]+$/);
    expect(result.artifactTitle).toBe(mockArgs.title);
    expect(result.artifactType).toBe(mockArgs.type);
    expect(result.estimatedCompletionTime).toBeDefined();
});
```

## Migration Steps

1. **Define the response interface** with all fields you want to return
2. **Update the handler return type** to use the interface
3. **Replace `withToolErrorHandling`** with `withStructuredToolErrorHandling`
4. **Update the success formatter** to return an object instead of a string
5. **Add type parameters** to specify the generic types correctly
6. **Update tool consumers** to handle the structured response
7. **Add tests** for the new response structure

## Best Practices

### 1. **Always Include Core Fields**
```typescript
interface ToolResult {
    success: boolean;  // Always required
    message: string;   // Always required
    // ... other fields
}
```

### 2. **Use Optional Fields for Conditional Data**
```typescript
interface ProcessResult {
    success: boolean;
    message: string;
    processId?: string;        // Only present on success
    errors?: string[];         // Only present on failure
    warnings?: string[];       // May be present on success
}
```

### 3. **Provide Meaningful Messages**
```typescript
// Good
message: `Artifact "${title}" scheduled for creation. Estimated completion: ${estimatedTime}`

// Bad  
message: "Success"
```

### 4. **Include Context for Debugging**
```typescript
interface DebugToolResult {
    success: boolean;
    message: string;
    toolCallId: string;        // Always include for traceability
    timestamp: string;         // When the operation occurred
    duration?: number;         // How long it took (on completion)
}
``` 