"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserTasks } from "./user-tasks";

interface UserTasksModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserTasksModal({ isOpen, onOpenChange }: UserTasksModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Pending Tasks</DialogTitle>
                </DialogHeader>
                <div className="p-0">
                    <UserTasks />
                </div>
            </DialogContent>
        </Dialog>
    );
} 