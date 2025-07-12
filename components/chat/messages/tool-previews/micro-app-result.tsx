'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useMicroApp } from '@/hooks/use-micro-app';
import { Button } from '@/components/ui/button';
import { ExternalLinkIcon } from 'lucide-react';

interface MicroAppResultProps {
  result: {
    microAppType: string;
    scope: string;
    companyId?: string;
    teamId?: string;
    employeeId?: string;
    message: string;
  };
  toolCallId: string;
  isReadonly: boolean;
  autoOpen: boolean;
}

export function MicroAppResult({ result, toolCallId, isReadonly, autoOpen }: MicroAppResultProps) {
  const { openOfficeMicroApp, isVisible, toolCallId: currentToolCallId } = useMicroApp();

  const [opened, setOpened] = useState(false)

  const handleOpenMicroApp = useCallback(() => {
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
    setOpened(true);
  }, [openOfficeMicroApp, result, toolCallId, setOpened]);

  useEffect(() => {
    if (autoOpen && !opened) {
      // Check if a micro app is already open
      if (isVisible && currentToolCallId) {
        // If a different micro app is already open, don't auto-open this one
        if (currentToolCallId !== toolCallId) {
          console.log(`Micro app ${currentToolCallId} is already open, not auto-opening ${toolCallId}`);
          return;
        }
        // If the same micro app is already open, don't open it again
        if (currentToolCallId === toolCallId) {
          setOpened(true);
          return;
        }
      }
      handleOpenMicroApp();
    }
  }, [autoOpen, opened, isVisible, currentToolCallId, toolCallId, handleOpenMicroApp]);

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