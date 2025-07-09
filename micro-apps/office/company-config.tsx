import React from 'react';
import CompanyConfig from '@/components/micro-apps/office/company-config';

interface CompanyConfigMicroUIProps {
  title: string;
  toolCallId: string;
}

export default function CompanyConfigMicroUI({ title, toolCallId }: CompanyConfigMicroUIProps) {
  return <CompanyConfig title={title} toolCallId={toolCallId} />;
}
