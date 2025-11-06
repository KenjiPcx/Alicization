import { Label } from "@radix-ui/react-dropdown-menu";
import { Dialog, DialogTrigger } from "../ui/dialog";
import { DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ModeToggle } from "../layout/mode-toggle";
import { Button } from "../ui/button";
import { useState } from "react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

interface SettingsDialogProps {
    debugMode: boolean;
    toggleDebugMode: () => void;
    trigger?: React.ReactNode;
}

export default function SettingsDialog({ debugMode, toggleDebugMode, trigger }: SettingsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { isAuthenticated } = useConvexAuth();
    const { signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline">
                        Settings
                    </Button>
                )}
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
                        <Button onClick={toggleDebugMode} variant="outline">
                            Toggle Debug Mode ({debugMode ? 'On' : 'Off'})
                        </Button>
                    </div>
                    {isAuthenticated && (
                        <div className="flex flex-col gap-2">
                            <Label>Account</Label>
                            <Button
                                onClick={handleSignOut}
                                variant="destructive"
                                className="flex items-center gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}