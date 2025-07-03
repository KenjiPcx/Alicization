import { Label } from "@radix-ui/react-dropdown-menu";
import { Dialog, DialogTrigger } from "../ui/dialog";

import { DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ModeToggle } from "../layout/mode-toggle";
import { Button } from "../ui/button";
import { useState } from "react";

interface SettingsDialogProps {
    debugMode: boolean;
    toggleDebugMode: () => void;
}

export default function SettingsDialog({ debugMode, toggleDebugMode }: SettingsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    zIndex: 10,
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                }}>Open Settings</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label>Theme</Label>
                        <ModeToggle />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label>Debug Mode</Label>
                        <Button onClick={toggleDebugMode} variant="outline">Toggle Debug Mode ({debugMode ? 'On' : 'Off'})</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}