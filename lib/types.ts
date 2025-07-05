import type { StatusType } from "@/components/navigation/status-indicator";
import type { FullEmployee } from "@/convex/schema";

export type {
    Chat,
    Employee,
    FullEmployee,
    Team,
    Tool,
    User,
    ArtifactKind,
    Artifact,
    BackgroundJobStatus,
    ScheduledJob,
    CompanyFile,
    Suggestion,
    Vote,
    Tag,
    UserType,
} from "@/convex/schema";

import type { Doc, Id } from "@/convex/_generated/dataModel";

// Frontend-specific employee data that extends the backend model
export interface EmployeeData extends Doc<"employees"> {
    initialPosition: [number, number, number];
    isBusy: boolean;
    deskId?: string;
    team: string; // Team name for display
}

// Frontend-specific team data that extends the backend model
export interface TeamData extends Doc<"teams"> {
    employees: Id<"employees">[];
    supervisorId?: Id<"employees">;
}

export type DeskLayoutData = {
    id: string;
    position: [number, number, number];
    rotationY: number;
    team: string;
}