import React from 'react';
import EmployeeConfig from '@/components/micro-apps/office/employee-config';

interface EmployeeConfigMicroUIProps {
  title: string;
  toolCallId: string;
}

export default function EmployeeConfigMicroUI({ title, toolCallId }: EmployeeConfigMicroUIProps) {
  return <EmployeeConfig title={title} toolCallId={toolCallId} />;
}
