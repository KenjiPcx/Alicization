import React from 'react';
import EmployeeDrive from '@/components/micro-apps/office/employee-documentation';
import { Id } from '@/convex/_generated/dataModel';

interface EmployeeDriveMicroUIProps {
    title: string;
    toolCallId: string;
    employeeId?: Id<"employees">;
}

export default function EmployeeDriveMicroUI({ title, toolCallId, employeeId }: EmployeeDriveMicroUIProps) {
    return <EmployeeDrive
        title={title}
        toolCallId={toolCallId}
        employeeId={employeeId}
    />;
} 