"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { Clock, AlertCircle, Eye, HelpCircle, Lock, CheckCircle2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function UserTasks() {
    const { isAuthenticated } = useConvexAuth();

    // Get the current user
    const user = useQuery(api.auth.currentUser);

    // Get pending tasks for the current user
    const pendingTasks = useQuery(api.userTasks.getAllPendingUserTasks,
        user?._id ? { userId: user._id } : "skip"
    );

    if (!isAuthenticated || !user) {
        return (
            <Card className="w-80 bg-background/95 backdrop-blur-sm border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        User Tasks
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        {!isAuthenticated ? "Sign in to view tasks" : "Loading..."}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!pendingTasks) {
        return (
            <Card className="w-80 bg-background/95 backdrop-blur-sm border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        User Tasks
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">Loading tasks...</div>
                </CardContent>
            </Card>
        );
    }

    const getTaskIcon = (type: string) => {
        switch (type) {
            case "approval": return <CheckCircle2 className="h-4 w-4 text-orange-500" />;
            case "review": return <Eye className="h-4 w-4 text-blue-500" />;
            case "question": return <HelpCircle className="h-4 w-4 text-purple-500" />;
            case "permission": return <Lock className="h-4 w-4 text-red-500" />;
            default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getTaskColor = (type: string) => {
        switch (type) {
            case "approval": return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
            case "review": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
            case "question": return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
            case "permission": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
            default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
        }
    };

    return (
        <Card className="w-80 bg-background/95 backdrop-blur-sm border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    User Tasks
                    {pendingTasks.length > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                            {pendingTasks.length}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {pendingTasks.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                        No pending tasks
                    </div>
                ) : (
                    <ScrollArea className="h-64">
                        <div className="space-y-3">
                            {pendingTasks.map((task, index) => (
                                <div key={task._id}>
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            {getTaskIcon(task.type)}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge
                                                        variant="secondary"
                                                        className={`text-xs ${getTaskColor(task.type)}`}
                                                    >
                                                        {task.type.toUpperCase()}
                                                    </Badge>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDistanceToNow(task.createdAt, { addSuffix: true })}
                                                    </div>
                                                </div>
                                                <p className="text-sm leading-relaxed">{task.message}</p>
                                                {task.context && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {task.context}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Button size="sm" variant="outline" className="h-7 text-xs">
                                                        Respond
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-7 text-xs">
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {index < pendingTasks.length - 1 && <Separator className="mt-3" />}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
} 