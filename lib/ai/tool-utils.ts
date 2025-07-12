/**
 * Utility functions for AI tool error handling and common patterns
 * 
 * @example
 * // Basic structured response
 * return withToolErrorHandling(
 *   async () => {
 *     if (!ctx.threadId) throw new Error("Thread ID is required");
 *     if (!ctx.userId) throw new Error("User ID is required");
 *     if (!ctx.messageId) throw new Error("Message ID is required");
 *     
 *     const result = await someAsyncOperation();
 *     return result;
 *   },
 *   { operation: "Document creation" },
 *   (result) => ({
 *     message: `Document created successfully with ID: ${result.id}`,
 *     documentId: result.id
 *   })
 * );
 * 
 * @example
 * // Using predefined error patterns
 * return withToolErrorHandling(
 *   async () => {
 *     if (!ctx.threadId) throw new Error("Thread ID is required");
 *     if (!ctx.userId) throw new Error("User ID is required");
 *     
 *     const employee = await createEmployee(args);
 *     return employee;
 *   },
 *   ToolErrors.employee('creation'),
 *   (employee) => ({
 *     message: `Employee ${employee.name} created successfully`,
 *     employeeId: employee._id,
 *     teamId: employee.teamId
 *   })
 * );
 * 
 * @example
 * // Simple operation without custom success formatting
 * return withToolErrorHandling(
 *   async () => {
 *     if (!ctx.userId) throw new Error("User ID is required");
 *     return await updateCompany(args);
 *   },
 *   ToolErrors.company('update')
 * );
 */

export interface ToolErrorOptions {
    /**
     * The operation being attempted (e.g., "Artifact creation", "Company update")
     */
    operation: string;
    /**
     * Additional context to include in error messages (optional)
     */
    context?: string;
    /**
     * Whether to include technical error details in the message (default: true)
     */
    includeTechnicalDetails?: boolean;
}

export interface ToolResult<T = string> {
    success: boolean;
    message: string;
    data?: T;
}

/**
 * Formats an error message consistently across all tools
 */
function formatErrorMessage(
    operation: string,
    error: unknown,
    options: ToolErrorOptions
): string {
    const { context, includeTechnicalDetails = true } = options;

    let errorDetails = '';
    if (includeTechnicalDetails && error instanceof Error) {
        errorDetails = `: ${error.message}`;
    }

    const contextSuffix = context ? ` (${context})` : '';

    return `${operation} failed${errorDetails}${contextSuffix}. Please try again or contact support if the issue persists.`;
}

/**
 * Wraps an async function with try-catch error handling
 * Returns a consistent result format with success/error messages
 */
export async function withErrorHandling<T = string>(
    operation: () => Promise<T>,
    options: ToolErrorOptions
): Promise<ToolResult<T>> {
    try {
        const result = await operation();
        return {
            success: true,
            message: `${options.operation} completed successfully`,
            data: result
        };
    } catch (error) {
        console.error(`${options.operation} error:`, error);
        return {
            success: false,
            message: formatErrorMessage(options.operation, error, options)
        };
    }
}

/**
 * Wraps an async function for tools that return structured objects
 * All tools should use this pattern for consistent error handling
 * 
 * @param operation - The async function to execute
 * @param options - Error handling configuration
 * @param formatSuccess - Optional function to format the success response
 * @returns Promise that resolves to a structured response object
 */
export async function withToolErrorHandling<T, R>(
    operation: () => Promise<T>,
    options: ToolErrorOptions,
    formatSuccess?: (result: T) => { message: string } & R
): Promise<{ message: string; success: boolean } & R> {
    try {
        const result = await operation();
        if (formatSuccess) {
            return {
                success: true,
                ...formatSuccess(result)
            };
        }
        return {
            success: true,
            message: `${options.operation} completed successfully`
        } as { message: string; success: boolean } & R;
    } catch (error) {
        console.error(`${options.operation} error:`, error);
        return {
            success: false,
            message: formatErrorMessage(options.operation, error, options)
        } as { message: string; success: boolean } & R;
    }
}

/**
 * Wraps a sync function with try-catch error handling
 */
export function withSyncErrorHandling<T = string>(
    operation: () => T,
    options: ToolErrorOptions
): ToolResult<T> {
    try {
        const result = operation();
        return {
            success: true,
            message: `${options.operation} completed successfully`,
            data: result
        };
    } catch (error) {
        console.error(`${options.operation} error:`, error);
        return {
            success: false,
            message: formatErrorMessage(options.operation, error, options)
        };
    }
}



