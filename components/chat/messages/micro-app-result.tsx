'use client';

import React from 'react';
import { useMicroApp } from '@/hooks/use-micro-app';
import { Button } from '@/components/ui/button';
import { ExternalLinkIcon } from 'lucide-react';

interface MicroAppResultProps {
  result: any;
  toolCallId: string;
  isReadonly: boolean;
}

export function MicroAppResult({ result, toolCallId, isReadonly }: MicroAppResultProps) {
  const { openOfficeMicroApp } = useMicroApp();

  const handleOpenMicroApp = () => {
    // Open the office micro UI directly
    const boundingBox = {
      top: window.innerHeight * 0.1,
      left: window.innerWidth * 0.1,
      width: window.innerWidth * 0.8,
      height: window.innerHeight * 0.8,
    };

    const microAppData = {
      microAppType: result.microAppType,
      toolCallId,
      companyId: result.companyId,
      teamId: result.teamId,
      employeeId: result.employeeId,
    };

    const title = result.message || 'Micro App';

    openOfficeMicroApp(toolCallId, boundingBox, result.microAppType, microAppData, title);
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{result.message}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Micro app is ready to open
          </p>
        </div>
        {!isReadonly && (
          <Button 
            onClick={handleOpenMicroApp}
            variant="default"
            size="sm"
            className="ml-4"
          >
            <ExternalLinkIcon size={16} />
            Open
          </Button>
        )}
      </div>
    </div>
  );
} 