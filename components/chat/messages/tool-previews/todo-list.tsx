'use client';

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlannerToolResult } from "@/lib/ai/tools/advanced/planner";

interface TodoListPreviewProps {
    args: {
        title?: string;
        description?: string;
        plan?: string;
        todos?: string[];
    };
    toolCallId: string;
    toolName: string;
    threadId: string;
    result?: PlannerToolResult;
}

export function TodoListPreview({ args, toolCallId, toolName, threadId, result }: TodoListPreviewProps) {
    const getToolLabel = () => {
        switch (toolName) {
            case 'setPlanAndTodos':
                return args.title ? 'Creating Task Plan' : 'Updating Plan';
            case 'selectNextTodo':
                return 'Starting Next Todo';
            case 'completeCurrentTodoAndMoveToNextTodo':
                return 'Completing Todo';
            default:
                return 'Task Management';
        }
    };

    const getToolIcon = () => {
        switch (toolName) {
            case 'setPlanAndTodos':
                return '📋';
            case 'selectNextTodo':
                return '▶️';
            case 'completeCurrentTodoAndMoveToNextTodo':
                return '✅';
            default:
                return '📝';
        }
    };

    // If no result yet, show loader
    if (!result) {
        return (
            <div className="border border-hacker-border rounded-lg p-4 bg-gradient-to-r from-hacker-bg to-hacker-bg-secondary shadow-lg shadow-hacker-accent/20">
                <div className="flex items-center gap-2 mb-3">
                    <div className="text-lg text-hacker-accent-bright">{getToolIcon()}</div>
                    <h3 className="font-medium text-hacker-text">{getToolLabel()}</h3>
                </div>
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-hacker-accent/20 rounded w-3/4"></div>
                    <div className="h-4 bg-hacker-accent/20 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    // Show error state if the operation failed
    if (result && !result.success) {
        return (
            <div className="border border-red-200 dark:border-red-700 rounded-lg p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20">
                <div className="flex items-center gap-2 mb-3">
                    <div className="text-lg text-red-500">❌</div>
                    <h3 className="font-medium text-red-600 dark:text-red-400">{getToolLabel()} Failed</h3>
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                    {result.message}
                </div>
            </div>
        );
    }

    // Use task data from the result
    const taskData = result.task;

    // Show loading state while waiting for task data (fallback for setPlanAndTodos without task data)
    if (!taskData && toolName !== 'setPlanAndTodos') {
        return (
            <div className="border border-hacker-border rounded-lg p-4 bg-gradient-to-r from-hacker-bg to-hacker-bg-secondary shadow-lg shadow-hacker-accent/20">
                <div className="flex items-center gap-2 mb-3">
                    <div className="text-lg text-hacker-accent-bright">{getToolIcon()}</div>
                    <h3 className="font-medium text-hacker-text">{getToolLabel()}</h3>
                </div>
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-hacker-accent/20 rounded w-3/4"></div>
                    <div className="h-4 bg-hacker-accent/20 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    // For setPlanAndTodos, show the preview of what will be created
    if (toolName === 'setPlanAndTodos' && !taskData) {
        return (
            <div className="border border-hacker-border rounded-lg p-4 bg-gradient-to-r from-hacker-bg to-hacker-bg-secondary shadow-lg shadow-hacker-accent/20">
                <div className="flex items-center gap-2 mb-3">
                    <div className="text-lg animate-pulse text-hacker-accent-bright">{getToolIcon()}</div>
                    <h3 className="font-medium text-hacker-text">{getToolLabel()}</h3>
                </div>

                {args.title && (
                    <div className="mb-3">
                        <h4 className="text-lg font-semibold text-hacker-text">{args.title}</h4>
                        {args.description && (
                            <p className="text-sm text-hacker-text-secondary mt-1">{args.description}</p>
                        )}
                    </div>
                )}

                {args.plan && (
                    <div className="mb-3 p-2 bg-hacker-accent/10 border border-hacker-accent/20 rounded">
                        <p className="text-sm font-medium text-hacker-text">Plan:</p>
                        <p className="text-sm text-hacker-text-secondary">{args.plan}</p>
                    </div>
                )}

                {args.todos && args.todos.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-hacker-text">Creating {args.todos.length} todos:</p>
                        {args.todos.map((todo, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-hacker-accent/10 border border-hacker-accent/20 rounded">
                                <Circle className="w-4 h-4 text-hacker-text-secondary" />
                                <span className="text-sm text-hacker-text-secondary">{todo}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Show the actual task data
    const task = taskData || { title: args.title || '', description: args.description || '', todos: [] };
    const todos = task?.todos || [];
    const pendingCount = todos.filter(t => t.status === 'pending').length;
    const inProgressCount = todos.filter(t => t.status === 'in-progress').length;
    const completedCount = todos.filter(t => t.status === 'completed').length;
    const totalCount = todos.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="border border-hacker-border rounded-lg p-4 bg-gradient-to-r from-hacker-bg to-hacker-bg-secondary shadow-lg shadow-hacker-accent/20">
            <div className="flex items-center gap-2 mb-3">
                <div className="text-lg text-hacker-accent-bright">{getToolIcon()}</div>
                <h3 className="font-medium text-hacker-text">{getToolLabel()}</h3>
                <div className="ml-auto flex items-center gap-2 text-sm">
                    <span className="text-hacker-text-secondary">
                        {completedCount}/{totalCount} completed
                    </span>
                </div>
            </div>

            {task.title && (
                <div className="mb-3">
                    <h4 className="text-lg font-semibold text-hacker-text">{task.title}</h4>
                    {task.description && (
                        <p className="text-sm text-hacker-text-secondary mt-1">{task.description}</p>
                    )}
                </div>
            )}

            {task.plan && (
                <div className="mb-3">
                    <p className="text-sm font-medium text-hacker-text">Plan:</p>
                    <p className="text-sm text-hacker-text-secondary">{task.plan}</p>
                </div>
            )}

            {/* Progress bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-hacker-text-secondary mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                </div>
                <div className="w-full bg-hacker-accent/20 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-hacker-accent to-hacker-accent-bright h-2 rounded-full transition-all duration-300 ease-out shadow-sm shadow-hacker-accent/50"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 mb-4 text-sm">
                {pendingCount > 0 && (
                    <div className="flex items-center gap-1">
                        <Circle className="w-4 h-4 text-hacker-pending" />
                        <span className="text-hacker-pending">{pendingCount} pending</span>
                    </div>
                )}
                {inProgressCount > 0 && (
                    <div className="flex items-center gap-1">
                        <Loader2 className="w-4 h-4 text-hacker-progress animate-spin" />
                        <span className="text-hacker-progress">{inProgressCount} in progress</span>
                    </div>
                )}
                <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-hacker-success" />
                    <span className="text-hacker-success">{completedCount} completed</span>
                </div>
            </div>

            {/* Todo list */}
            {todos.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {todos.map((todo, index) => {
                        const isInProgress = todo.status === 'in-progress';
                        const isCompleted = todo.status === 'completed';

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-center gap-3 p-2 rounded transition-all",
                                    isInProgress && "bg-hacker-progress/20 border-l-2 border-hacker-progress shadow-sm shadow-hacker-progress/20",
                                    isCompleted && "bg-hacker-success/10 border-l-2 border-hacker-success/50 opacity-75",
                                    !isInProgress && !isCompleted && "bg-hacker-pending/10 border border-hacker-pending/20"
                                )}
                            >
                                <div className="flex-shrink-0">
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-hacker-success" />
                                    ) : isInProgress ? (
                                        <Loader2 className="w-5 h-5 text-hacker-progress animate-spin" />
                                    ) : (
                                        <Circle className="w-5 h-5 text-hacker-pending" />
                                    )}
                                </div>
                                <span className={cn(
                                    "text-sm flex-1",
                                    isCompleted && "line-through text-hacker-success/70",
                                    isInProgress && "font-medium text-hacker-progress-bright",
                                    !isInProgress && !isCompleted && "text-hacker-text"
                                )}>
                                    {todo.title}
                                </span>
                                {isInProgress && (
                                    <span className="text-xs text-hacker-progress animate-pulse">
                                        Working...
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Update messages for specific tools */}
            {toolName === 'selectNextTodo' && inProgressCount > 0 && (
                <div className="mt-3 p-2 bg-hacker-progress/20 border border-hacker-progress/40 rounded text-sm text-hacker-progress-bright">
                    Starting next todo...
                </div>
            )}

            {toolName === 'completeCurrentTodoAndMoveToNextTodo' && (pendingCount > 0 || inProgressCount > 0) && (
                <div className="mt-3 p-2 bg-hacker-success/20 border border-hacker-success/40 rounded text-sm text-hacker-success">
                    Completing current todo and moving to next...
                </div>
            )}
        </div>
    );
} 