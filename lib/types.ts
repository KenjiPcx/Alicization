import type { StatusType } from "@/components/navigation/status-indicator";
import type { Doc, Id } from "@/convex/_generated/dataModel";

// Base Convex types
export type User = Doc<"usersMetadata">;
export type Employee = Doc<"employees">;
export type Team = Doc<"teams">;
export type Tool = Doc<"tools">;
export type Chat = Doc<"chats">;
export type BackgroundJobStatus = Doc<"backgroundJobStatuses">;
export type Artifact = Doc<"artifacts">;
export type ScheduledJob = Doc<"scheduledJobs">;
export type CompanyFile = Doc<"companyFiles">;
export type Vote = Doc<"votes">;
export type Suggestion = Doc<"suggestions">;
export type Tag = Doc<"tags">;
export type UserType = Doc<"usersMetadata">["type"];
export type Company = Doc<"companies">;
export type ScopeAndId = {
    scope: "company";
    companyId: Id<"companies">;
} | {
    scope: "team";
    teamId: Id<"teams">;
} | {
    scope: "employee";
    employeeId: Id<"employees">;
};
export type KPI = Doc<"kpis">;
export type Memory = Doc<"memories">;
export type Task = Doc<"tasks">;
export type OfficeObject = Doc<"officeObjects">;

export type CompanyData = {
    company: Doc<"companies"> | null;
    teams: Doc<"teams">[];
    employees: Doc<"employees">[];
}

// Compound types
export type FullEmployee = Employee & {
    toolsets: Pick<Toolset, "_id" | "name" | "description" | "type" | "toolsetConfig">[];
    skills: {
        _id: Id<"skills">;
        name: string;
        description: string;
    }[];
    team: Team | {
        _id: Id<"teams">;
        name: string;
    };
};

export type ArtifactKind = Doc<"artifacts">["kind"];

export type OfficeMicroAppKind = "kpi-dashboard" | "company-config" | "employee-config" | "employee-drive";

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

export type Toolset = Doc<"toolsets">

export type Attachment = {
    name: string;
    url: string;
    contentType: string;
};