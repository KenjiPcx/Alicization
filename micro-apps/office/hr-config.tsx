import React from 'react';
import EmployeeConfig from '@/components/micro-apps/office/employee-config';
import { Id } from '@/convex/_generated/dataModel';

interface EmployeeConfigMicroUIProps {
  title: string;
  toolCallId: string;
  employeeId?: Id<"employees">;
}

export default function EmployeeConfigMicroUI({ title, toolCallId, employeeId }: EmployeeConfigMicroUIProps) {
  return <EmployeeConfig title={title} toolCallId={toolCallId} employeeId={employeeId} />;
}
