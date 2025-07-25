import React from 'react';
import { useMicroApp } from '@/hooks/use-micro-app';
import { AnimatePresence, motion } from 'framer-motion';
import { useWindowSize } from 'usehooks-ts';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MicroAppMessages } from '@/components/micro-apps/artifact/micro-app-messages';
import { MultimodalInput } from '@/components/chat/multimodal-input';
import type { Attachment, UIMessage } from 'ai';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from '@/components/chat/visibility-selector';
import type { Dispatch, SetStateAction } from 'react';
import type { ScopeAndId, Vote } from '@/lib/types';
import KPIClientMicroUI from '@/micro-apps/office/kpi-client';
import CompanyConfigMicroUI from '@/micro-apps/office/company-config';
import EmployeeConfigMicroUI from '@/micro-apps/office/hr-config';
import EmployeeDriveMicroUI from '@/micro-apps/office/employee-drive';
import CompanyToolsetConfig from '@/components/micro-apps/office/company-toolset-config';
import HREmployeeManagement from '@/components/micro-apps/office/hr-employee-management';
import { MicroAppData } from '@/lib/store/micro-app-store';

interface OfficeMicroAppProps {
  microAppType: string;
  microAppData: MicroAppData;
  chatId: string;
  input: string;
  setInput: UseChatHelpers['setInput'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  status: 'submitted' | 'ready' | 'pending' | 'failed' | 'success';
  stop: UseChatHelpers['stop'];
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  append: UseChatHelpers['append'];
  messages: Array<UIMessage>;
  votes: Array<Vote> | undefined;
  isReadonly: boolean;
  selectedVisibilityType: VisibilityType;
}

export function OfficeMicroApp({
  microAppType,
  microAppData,
  chatId,
  input,
  setInput,
  handleSubmit,
  status,
  stop,
  attachments,
  setAttachments,
  append,
  messages,
  votes,
  isReadonly,
  selectedVisibilityType,
}: OfficeMicroAppProps) {
  const title = microAppData.title;
  const { isVisible, boundingBox, closeMicroApp } = useMicroApp();
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  // Detect if screen is vertical (taller than wide)
  const isVerticalScreen = windowHeight && windowWidth ? windowHeight > windowWidth : false;

  // Use vertical layout for vertical screens, horizontal for others
  const useVerticalLayout = isVerticalScreen && !isMobile;

  const renderMicroApp = () => {
    switch (microAppType) {
      case 'kpi-dashboard':
        // Determine the proper scope and ID based on available data
        let scopeAndId: ScopeAndId | null = null;
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
        } else if (microAppData.companyId) {
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
            employeeId={microAppData.employeeId}
          />
        );

      case 'employee-drive':
        return (
          <EmployeeDriveMicroUI
            title={title}
            toolCallId={microAppData.toolCallId || ''}
            employeeId={microAppData.employeeId}
          />
        );

      case 'company-toolset-config':
        return (
          <CompanyToolsetConfig
            title={title}
            companyId={microAppData.companyId}
          />
        );

      case 'employee-directory-config':
        return (
          <HREmployeeManagement
            title={title}
            companyId={microAppData.companyId}
          />
        );

      default:
        return (
          <div className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Unknown Office Micro App</h2>
            <p className="text-muted-foreground">
              Office micro app type &quot;{microAppType}&quot; is not supported.
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
          className={`flex ${useVerticalLayout ? 'flex-col' : 'flex-row'} h-[85dvh] w-[85dvw] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 overflow-hidden rounded-lg shadow-2xl bg-background`}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.4 } }}
        >
          {/* Main content - render first in vertical layout */}
          <motion.div
            className={`relative ${useVerticalLayout ? 'h-[65%] w-full' : 'flex-1'} dark:bg-muted bg-background flex flex-col ${useVerticalLayout ? '' : 'md:border-l'} ${useVerticalLayout ? 'border-b' : ''} dark:border-zinc-700 border-zinc-200`}
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
              height: useVerticalLayout ? '65%' : '100%',
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
            <div className="flex-1 overflow-auto custom-scrollbar">
              {renderMicroApp()}
            </div>
          </motion.div>

          {/* Chat sidebar */}
          {!isMobile && (
            <motion.div
              className={`relative ${useVerticalLayout ? 'h-[35%] w-full' : 'w-[450px] h-full'} bg-muted dark:bg-background shrink-0`}
              initial={{ opacity: 0, x: useVerticalLayout ? 0 : 10, y: useVerticalLayout ? 10 : 0, scale: 1 }}
              animate={{
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                transition: {
                  delay: 0.2,
                  type: 'spring',
                  stiffness: 200,
                  damping: 30,
                },
              }}
              exit={{
                opacity: 0,
                x: 0,
                y: 0,
                scale: 1,
                transition: { duration: 0 },
              }}
            >
              <div className="flex flex-col h-full justify-between items-center">
                <MicroAppMessages
                  chatId={chatId}
                  status={status}
                  votes={votes}
                  messages={messages}
                  isReadonly={isReadonly}
                />

                <form className="flex flex-row gap-2 relative items-end w-full px-4 pb-4">
                  <MultimodalInput
                    chatId={chatId}
                    input={input}
                    setInput={setInput}
                    handleSubmit={handleSubmit}
                    status={status}
                    stop={stop}
                    attachments={attachments}
                    setAttachments={setAttachments}
                    messages={messages}
                    append={append}
                    className="bg-background dark:bg-muted"
                    selectedVisibilityType={selectedVisibilityType}
                  />
                </form>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
} 