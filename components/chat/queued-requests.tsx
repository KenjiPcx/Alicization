'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface QueuedRequestsProps {
    threadId: string;
}

export function QueuedRequests({ threadId }: QueuedRequestsProps) {
    const queuedRequests = useQuery(api.queue.getQueuedRequests, { threadId });

    if (!queuedRequests || queuedRequests.length === 0) {
        return null;
    }

    return (
        <div className="mb-4 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
                Queued Messages ({queuedRequests.length})
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
                {queuedRequests.map((request, index) => (
                    <div
                        key={request._id}
                        className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-dashed"
                    >
                        <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                            {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{request.title}</span>
                                <span className="text-xs text-muted-foreground">
                                    from {request.sender}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {request.content}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 