import React from 'react';
import { useMicroApp } from '@/hooks/use-micro-app';
import { AnimatePresence, motion } from 'framer-motion';
import { useWindowSize } from 'usehooks-ts';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KPIClientMicroUI from '@/micro-apps/office/kpi-client';
import CompanyConfigMicroUI from '@/micro-apps/office/company-config';
import EmployeeConfigMicroUI from '@/micro-apps/office/employee-config';

interface OfficeMicroAppProps {
  microAppType: string;
  microAppData: any;
  title: string;
}

export function OfficeMicroApp({ microAppType, microAppData, title }: OfficeMicroAppProps) {
  const { isVisible, boundingBox, closeMicroApp } = useMicroApp();
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  const renderMicroApp = () => {
    switch (microAppType) {
      case 'kpi-dashboard':
        // Determine the proper scope and ID based on available data
        let scopeAndId;
        if (microAppData.employeeId) {
          scopeAndId = {
            scope: "employee" as const,
            employeeId: microAppData.employeeId,
          };
        } else if (microAppData.teamId) {
          scopeAndId = {
            scope: "team" as const,
            teamId: microAppData.teamId,
          };
        } else {
          scopeAndId = {
            scope: "company" as const,
            companyId: microAppData.companyId,
          };
        }
        
        return (
          <KPIClientMicroUI 
            title={title}
            scopeAndId={scopeAndId}
          />
        );
      
      case 'company-config':
        return (
          <CompanyConfigMicroUI 
            title={title}
            toolCallId={microAppData.toolCallId || ''}
          />
        );
      
      case 'employee-config':
        return (
          <EmployeeConfigMicroUI 
            title={title}
            toolCallId={microAppData.toolCallId || ''}
          />
        );
      
      default:
        return (
          <div className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Unknown Office Micro App</h2>
            <p className="text-muted-foreground">
              Office micro app type "{microAppType}" is not supported.
            </p>
          </div>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="office-micro-app"
          data-testid="office-micro-app"
          className="flex flex-row h-[85dvh] w-[85dvw] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 overflow-hidden rounded-lg shadow-2xl bg-background"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.4 } }}
        >
          {/* Main content */}
          <motion.div
            className="relative flex-1 dark:bg-muted bg-background h-full flex flex-col"
            initial={{
              opacity: 1,
              x: boundingBox.left,
              y: boundingBox.top,
              height: boundingBox.height,
              width: boundingBox.width,
              borderRadius: 50,
            }}
            animate={{
              opacity: 1,
              x: 0,
              y: 0,
              height: '100%',
              width: '100%',
              borderRadius: 0,
              transition: {
                delay: 0,
                type: 'spring',
                stiffness: 200,
                damping: 30,
              },
            }}
            exit={{
              opacity: 0,
              scale: 0.5,
              transition: {
                delay: 0.1,
                type: 'spring',
                stiffness: 600,
                damping: 30,
              },
            }}
          >
            {/* Header */}
            <div className="p-4 flex flex-row justify-between items-center border-b">
              <div>
                <h1 className="text-lg font-semibold">{title}</h1>
                <p className="text-sm text-muted-foreground">
                  {microAppType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Dashboard
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeMicroApp}
                className="h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {renderMicroApp()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 