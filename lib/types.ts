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

// export type EmployeeData = FullEmployee & {
//     initialPosition: [number, number, number];
//     deskId?: string;
//     id: string; // TODO: Remove this once we have a proper employee type
//     isBusy: boolean;
// }

export interface EmployeeData {
    id: string;
    initialPosition: [number, number, number];
    isBusy: boolean;
    isCEO?: boolean;
    name: string;
    team: string;
    deskId?: string;
    status?: StatusType;
    statusMessage?: string;
}

export interface TeamData {
    id: string;
    name: string;
    description: string;
    employees: string[];
}

export type DeskLayoutData = {
    id: string;
    position: [number, number, number];
    rotationY: number;
    team: string;
}