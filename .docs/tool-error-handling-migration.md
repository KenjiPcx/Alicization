# Tool Error Handling Migration Guide

This guide shows how to migrate existing AI tools to use the new error handling utilities, and how to choose between string-based and structured object responses.

## Response Format

All tools now return structured objects for consistent error handling:

```typescript
return {
  success: true,
  message: "Operation completed successfully",
  // ... other result fields
};
// or on error:
return {
  success: false,
  message: "Operation failed: error details"
};
```

## Before (Old Pattern)

```typescript
export const someOfficeTool = createTool({
    description: "Does something with the office",
    args: z.object({
        companyId: z.string(),
        action: z.string(),
    }),
    handler: async (ctx, args, { toolCallId }): Promise<string> => {
        try {
            if (!ctx.threadId) throw new Error("Thread ID is required");
            if (!ctx.userId) throw new Error("User ID is required");
            if (!ctx.messageId) throw new Error("Message ID is required");

            const { companyId, action } = args;

            const result = await ctx.runMutation(internal.company.updateCompany, {
                companyId,
                action,
                userId: ctx.userId,
            });

            return `Company ${action} completed successfully with result: ${result}`;
        } catch (error) {
            if (error instanceof Error) {
                return `Company ${action} failed: ${error.message}`;
            }
            return `Company ${action} failed: An unknown error occurred. Please try again.`;
        }
    },
})
```

## After (New Pattern)

```typescript
import { withToolErrorHandling } from "@/lib/ai/tool-utils";

export const someOfficeTool = createTool({
    description: "Does something with the office",
    args: z.object({
        companyId: z.string(),
        action: z.string(),
    }),
    handler: async (ctx, args, { toolCallId }): Promise<{
        success: boolean;
        message: string;
        result?: any;
        actionType?: string;
    }> => {
        return withToolErrorHandling(
            async () => {
                if (!ctx.threadId) throw new Error("Thread ID is required");
                if (!ctx.userId) throw new Error("User ID is required");
                if (!ctx.messageId) throw new Error("Message ID is required");

                const { companyId, action } = args;

                const result = await ctx.runMutation(internal.company.updateCompany, {
                    companyId,
                    action,
                    userId: ctx.userId,
                });

                return { result, action };
            },
            {
                operation: "Company update",
                context: undefined,
                includeTechnicalDetails: true
            },
            ({ result, action }) => ({
                message: `Company ${action} completed successfully`,
                result: result,
                actionType: action
            })
        );
    },
})
```

## Benefits

1. **Eliminates Duplication**: No more copy-pasting try-catch blocks
2. **Consistent Error Messages**: Standardized error formatting across all tools
3. **Type Safety**: Automatic handling of `instanceof Error` checks
4. **Better Logging**: Automatic error logging with context
5. **Maintainability**: Changes to error handling logic only need to be made in one place
6. **Structured Data**: Return rich data objects with success indicators
7. **Programmatic Handling**: Built-in success/failure flags for easy error checking
8. **Better Collaboration**: Each tool is self-contained, reducing merge conflicts

## Why Inline Error Definitions?

We moved away from centralized `ToolErrors` to inline error definitions for better collaboration:

- **Self-Contained Tools**: Each tool file contains everything needed (logic + error handling)
- **Reduced Conflicts**: Team members working on different tools don't edit the same shared file
- **Easier Reviews**: Error handling changes are visible alongside the tool logic
- **Simpler Imports**: Only import `withToolErrorHandling`, no need for `ToolErrors`
- **Custom Context**: Each tool can define specific error context relevant to its operation

## Usage Patterns

#### Simple Tool
```typescript
return withToolErrorHandling(
    async () => {
        if (!ctx.threadId) throw new Error("Thread ID is required");
        if (!ctx.userId) throw new Error("User ID is required");
        
        const employee = await createEmployee(args);
        return employee;
    },
    {
        operation: "Employee creation",
        context: undefined,
        includeTechnicalDetails: true
    },
    (employee) => ({
        message: `Employee ${employee.name} created successfully`,
        employeeId: employee._id,
        teamId: employee.teamId
    })
);
```

#### Complex Tool with Multiple Return Fields
```typescript
return withToolErrorHandling(
    async () => {
        if (!ctx.threadId) throw new Error("Thread ID is required");
        if (!ctx.userId) throw new Error("User ID is required");
        
        const results = await processComplexOperation(args);
        return results;
    },
    {
        operation: "Company configuration",
        context: undefined,
        includeTechnicalDetails: true
    },
    (results) => ({
        message: `Configuration updated successfully`,
        updatedFields: results.changed,
        affectedEmployees: results.employeeCount,
        configId: results.configId,
        timestamp: new Date().toISOString()
    })
);
```

#### Tool with Conditional Response Fields
```typescript
return withToolErrorHandling(
    async () => {
        if (!ctx.threadId) throw new Error("Thread ID is required");
        if (!ctx.userId) throw new Error("User ID is required");
        
        const result = await analyzeTeamPerformance(args);
        return result;
    },
    {
        operation: "Team analysis",
        context: undefined,
        includeTechnicalDetails: true
    },
    (result) => ({
        message: `Team analysis completed`,
        teamId: result.teamId,
        overallScore: result.score,
        ...(result.improvements && { suggestions: result.improvements }),
        ...(result.warnings && { warnings: result.warnings })
    })
);
```

#### Tool with Custom Error Context
```typescript
return withToolErrorHandling(
    async () => {
        if (!ctx.threadId) throw new Error("Thread ID is required");
        if (!ctx.userId) throw new Error("User ID is required");
        
        return await complexOperation();
    },
    {
        operation: "Complex operation",
        context: `for user ${ctx.userId}`,
        includeTechnicalDetails: true
    }
);
```

#### Tool that Only Needs Some Context Fields
```typescript
return withToolErrorHandling(
    async () => {
        if (!ctx.userId) throw new Error("User ID is required");
        
        return await userSpecificOperation();
    },
    { operation: "User operation" }
);
```

## Migration Strategy

1. **Replace try-catch blocks** with `withToolErrorHandling`
2. **Remove exclamation operators** by replacing `validateToolContext` with manual validation
3. **Define error handling inline** within each tool (no more importing `ToolErrors`)
4. **Update return types** to structured objects
5. **Update success formatters** to return objects instead of strings
6. **Update tool consumers** to handle structured responses

## Type Safety Examples

### Strong Typing for Structured Responses
```typescript
interface EmployeeCreationResult {
    success: boolean;
    message: string;
    employeeId?: string;
    teamId?: string;
    onboardingRequired?: boolean;
}

export const createEmployeeTool = createTool({
    handler: async (ctx, args, { toolCallId }): Promise<EmployeeCreationResult> => {
        return withToolErrorHandling<any, Omit<EmployeeCreationResult, 'success' | 'message'>>(
            async () => {
                if (!ctx.threadId) throw new Error("Thread ID is required");
                if (!ctx.userId) throw new Error("User ID is required");
                if (!ctx.messageId) throw new Error("Message ID is required");
                
                const employee = await createEmployee(args);
                return employee;
            },
            ToolErrors.employee('creation'),
            (employee) => ({
                message: `Employee ${employee.name} created successfully`,
                employeeId: employee._id,
                teamId: employee.teamId,
                onboardingRequired: employee.needsOnboarding
            })
        );
    },
})
```

## Migration Checklist

- [ ] Import the utility function: `withToolErrorHandling` (no longer need `ToolErrors`)
- [ ] Replace try-catch blocks with `withToolErrorHandling`
- [ ] Replace `validateToolContext` with manual `if (!ctx.field)` checks
- [ ] Remove TypeScript exclamation operators (`!`)
- [ ] Change return type to structured object with `success` and `message` fields
- [ ] Define error configuration inline within each tool (better for collaboration)
- [ ] Update success formatters to return objects instead of strings
- [ ] Define proper TypeScript interfaces for return types
- [ ] Update tool consumers to handle structured responses
- [ ] Remove old error handling code
- [ ] Test that errors are properly handled and logged 