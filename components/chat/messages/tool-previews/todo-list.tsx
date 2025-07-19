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
        status?: "pending" | "in-progress" | "completed" | "blocked";
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

    const getStatusDisplay = (status: string) => {
        switch (status) {
            case 'pending':
                return { label: 'PENDING', color: 'text-hacker-pending', bg: 'bg-hacker-pending/10' };
            case 'in-progress':
                return { label: 'IN PROGRESS', color: 'text-hacker-progress', bg: 'bg-hacker-progress/10' };
            case 'completed':
                return { label: 'COMPLETED', color: 'text-hacker-success', bg: 'bg-hacker-success/10' };
            case 'blocked':
                return { label: 'BLOCKED', color: 'text-red-500', bg: 'bg-red-500/10' };
            default:
                return null;
        }
    };

    // If no result yet, show loader
    if (!result) {
        return (
            <div className="border border-hacker-border rounded-lg p-4 bg-gradient-to-r from-hacker-bg to-hacker-bg-secondary shadow-lg shadow-hacker-accent/20 relative overflow-hidden">
                {args.status && (
                    <div className="absolute top-2 right-2 z-10">
                        <div className={cn(
                            "px-2 py-1 rounded text-xs font-medium border",
                            getStatusDisplay(args.status)?.bg,
                            getStatusDisplay(args.status)?.color,
                            "border-current/30"
                        )}>
                            {getStatusDisplay(args.status)?.label}
                        </div>
                    </div>
                )}
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
            <div className="border border-red-200 dark:border-red-700 rounded-lg p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 relative overflow-hidden">
                {args.status && (
                    <div className="absolute top-2 right-2 z-10">
                        <div className={cn(
                            "px-2 py-1 rounded text-xs font-medium border",
                            getStatusDisplay(args.status)?.bg,
                            getStatusDisplay(args.status)?.color,
                            "border-current/30"
                        )}>
                            {getStatusDisplay(args.status)?.label}
                        </div>
                    </div>
                )}
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
            <div className="border border-hacker-border rounded-lg p-4 bg-gradient-to-r from-hacker-bg to-hacker-bg-secondary shadow-lg shadow-hacker-accent/20 relative overflow-hidden">
                {args.status && (
                    <div className="absolute top-2 right-2 z-10">
                        <div className={cn(
                            "px-2 py-1 rounded text-xs font-medium border",
                            getStatusDisplay(args.status)?.bg,
                            getStatusDisplay(args.status)?.color,
                            "border-current/30"
                        )}>
                            {getStatusDisplay(args.status)?.label}
                        </div>
                    </div>
                )}
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
            <div className="border border-hacker-border rounded-lg p-4 bg-gradient-to-r from-hacker-bg to-hacker-bg-secondary shadow-lg shadow-hacker-accent/20 relative overflow-hidden">
                {args.status && (
                    <div className="absolute top-2 right-2 z-10">
                        <div className={cn(
                            "px-2 py-1 rounded text-xs font-medium border",
                            getStatusDisplay(args.status)?.bg,
                            getStatusDisplay(args.status)?.color,
                            "border-current/30"
                        )}>
                            {getStatusDisplay(args.status)?.label}
                        </div>
                    </div>
                )}

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

    // Get task status from either task data or args
    const taskStatus = task?.status || args.status;
    const isBlocked = taskStatus === 'blocked';

    return (
        <div className={cn(
            "border rounded-lg p-4 shadow-lg relative overflow-hidden",
            isBlocked
                ? "border-red-500/30 bg-gradient-to-r from-red-950/20 to-red-900/30 shadow-red-500/20"
                : "border-hacker-border bg-gradient-to-r from-hacker-bg to-hacker-bg-secondary shadow-hacker-accent/20"
        )}>
            {/* Status stamp overlay - covers entire tool preview */}
            {taskStatus && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className={cn(
                        "text-8xl font-black opacity-30 select-none",
                        "drop-shadow-2xl",
                        getStatusDisplay(taskStatus)?.color
                    )}>
                        {getStatusDisplay(taskStatus)?.label}
                    </div>
                </div>
            )}

            {taskStatus && (
                <div className="absolute top-2 right-2 z-10">
                    <div className={cn(
                        "px-2 py-1 rounded text-xs font-medium border",
                        getStatusDisplay(taskStatus)?.bg,
                        getStatusDisplay(taskStatus)?.color,
                        "border-current/30"
                    )}>
                        {getStatusDisplay(taskStatus)?.label}
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2 mb-3">
                <div className={cn(
                    "text-lg",
                    isBlocked ? "text-red-400" : "text-hacker-accent-bright"
                )}>{getToolIcon()}</div>
                <h3 className={cn(
                    "font-medium",
                    isBlocked ? "text-red-100" : "text-hacker-text"
                )}>{getToolLabel()}</h3>
                <div className="ml-auto flex items-center gap-2 text-sm">
                    <span className={cn(
                        isBlocked ? "text-red-300" : "text-hacker-text-secondary"
                    )}>
                        {completedCount}/{totalCount} completed
                    </span>
                </div>
            </div>

            {task.title && (
                <div className="mb-3">
                    <h4 className={cn(
                        "text-lg font-semibold",
                        isBlocked ? "text-red-100" : "text-hacker-text"
                    )}>{task.title}</h4>
                    {task.description && (
                        <p className={cn(
                            "text-sm mt-1",
                            isBlocked ? "text-red-300" : "text-hacker-text-secondary"
                        )}>{task.description}</p>
                    )}
                </div>
            )}

            {task.plan && (
                <div className="mb-3">
                    <p className={cn(
                        "text-sm font-medium",
                        isBlocked ? "text-red-100" : "text-hacker-text"
                    )}>Plan:</p>
                    <p className={cn(
                        "text-sm",
                        isBlocked ? "text-red-300" : "text-hacker-text-secondary"
                    )}>{task.plan}</p>
                </div>
            )}

            {/* Progress bar */}
            <div className="mb-4">
                <div className={cn(
                    "flex justify-between text-xs mb-1",
                    isBlocked ? "text-red-300" : "text-hacker-text-secondary"
                )}>
                    <span>Progress</span>
                    <span>{progress}%</span>
                </div>
                <div className={cn(
                    "w-full rounded-full h-2",
                    isBlocked ? "bg-red-500/20" : "bg-hacker-accent/20"
                )}>
                    <div
                        className={cn(
                            "h-2 rounded-full transition-all duration-300 ease-out shadow-sm",
                            isBlocked
                                ? "bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/50"
                                : "bg-gradient-to-r from-hacker-accent to-hacker-accent-bright shadow-hacker-accent/50"
                        )}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 mb-4 text-sm">
                {pendingCount > 0 && (
                    <div className="flex items-center gap-1">
                        <Circle className={cn(
                            "w-4 h-4",
                            isBlocked ? "text-red-400" : "text-hacker-pending"
                        )} />
                        <span className={cn(
                            isBlocked ? "text-red-400" : "text-hacker-pending"
                        )}>{pendingCount} pending</span>
                    </div>
                )}
                {inProgressCount > 0 && (
                    <div className="flex items-center gap-1">
                        <Loader2 className={cn(
                            "w-4 h-4 animate-spin",
                            isBlocked ? "text-red-400" : "text-hacker-progress"
                        )} />
                        <span className={cn(
                            isBlocked ? "text-red-400" : "text-hacker-progress"
                        )}>{inProgressCount} in progress</span>
                    </div>
                )}
                <div className="flex items-center gap-1">
                    <CheckCircle2 className={cn(
                        "w-4 h-4",
                        isBlocked ? "text-red-500" : "text-hacker-success"
                    )} />
                    <span className={cn(
                        isBlocked ? "text-red-500" : "text-hacker-success"
                    )}>{completedCount} completed</span>
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
                                    isInProgress && !isBlocked && "bg-hacker-progress/20 border-l-2 border-hacker-progress shadow-sm shadow-hacker-progress/20",
                                    isInProgress && isBlocked && "bg-red-500/20 border-l-2 border-red-500 shadow-sm shadow-red-500/20",
                                    isCompleted && isBlocked && "bg-red-500/10 border-l-2 border-red-500/50 opacity-75",
                                    isCompleted && !isBlocked && "bg-hacker-success/10 border-l-2 border-hacker-success/50 opacity-75",
                                    !isInProgress && !isCompleted && !isBlocked && "bg-hacker-pending/10 border border-hacker-pending/20",
                                    !isInProgress && !isCompleted && isBlocked && "bg-red-500/10 border border-red-500/20"
                                )}
                            >
                                <div className="flex-shrink-0">
                                    {isCompleted ? (
                                        <CheckCircle2 className={cn(
                                            "w-5 h-5",
                                            isBlocked ? "text-red-500" : "text-hacker-success"
                                        )} />
                                    ) : isInProgress ? (
                                        <Loader2 className={cn(
                                            "w-5 h-5 animate-spin",
                                            isBlocked ? "text-red-500" : "text-hacker-progress"
                                        )} />
                                    ) : (
                                        <Circle className={cn(
                                            "w-5 h-5",
                                            isBlocked ? "text-red-400" : "text-hacker-pending"
                                        )} />
                                    )}
                                </div>
                                <span className={cn(
                                    "text-sm flex-1",
                                    isCompleted && isBlocked && "line-through text-red-500/70",
                                    isCompleted && !isBlocked && "line-through text-hacker-success/70",
                                    isInProgress && !isBlocked && "font-medium text-hacker-progress-bright",
                                    isInProgress && isBlocked && "font-medium text-red-400",
                                    !isInProgress && !isCompleted && !isBlocked && "text-hacker-text",
                                    !isInProgress && !isCompleted && isBlocked && "text-red-200"
                                )}>
                                    {todo.title}
                                </span>
                                {isInProgress && (
                                    <span className={cn(
                                        "text-xs animate-pulse",
                                        isBlocked ? "text-red-400" : "text-hacker-progress"
                                    )}>
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
                <div className={cn(
                    "mt-3 p-2 border rounded text-sm",
                    isBlocked
                        ? "bg-red-500/20 border-red-500/40 text-red-300"
                        : "bg-hacker-progress/20 border-hacker-progress/40 text-hacker-progress-bright"
                )}>
                    Starting next todo...
                </div>
            )}

            {toolName === 'completeCurrentTodoAndMoveToNextTodo' && (pendingCount > 0 || inProgressCount > 0) && (
                <div className={cn(
                    "mt-3 p-2 border rounded text-sm",
                    isBlocked
                        ? "bg-red-500/20 border-red-500/40 text-red-300"
                        : "bg-hacker-success/20 border-hacker-success/40 text-hacker-success"
                )}>
                    Completing current todo and moving to next...
                </div>
            )}
        </div>
    );
} 