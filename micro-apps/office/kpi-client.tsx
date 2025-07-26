import React from 'react';
import KPIDashboard from '@/components/micro-apps/office/kpi-dashboard';
import { ScopeAndId } from '@/lib/types';

interface KPIClientMicroUIProps {
  title: string;
  scopeAndId: ScopeAndId | null;
}

export default function KPIClientMicroUI({ title, scopeAndId }: KPIClientMicroUIProps) {
  return <KPIDashboard title={title} scopeAndId={scopeAndId} />;
}
