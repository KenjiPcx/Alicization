import { Artifact } from '@/components/artifact/create-artifact';
import { DocumentSkeleton } from '@/components/chat/messages/document-skeleton';
import {
    CopyIcon,
    SparklesIcon,
    MenuIcon,
} from '@/components/icons';
import type { Suggestion } from '@/lib/types';
import { toast } from 'sonner';
import KPIDashboard from '@/components/micro-apps/kpi-dashboard';
import CompanyConfig from '@/components/micro-apps/company-config';
import EmployeeConfig from '@/components/micro-apps/employee-config';

interface MicroAppArtifactMetadata {
    suggestions: Array<Suggestion>;
}

export const microAppArtifact = new Artifact<'micro-app', MicroAppArtifactMetadata>({
    kind: 'micro-app',
    description: 'A micro application for viewing and managing specific data.',
    initialize: async ({ artifactId, setMetadata }) => {
        setMetadata({
            suggestions: [],
        });
    },
    content: ({
        content,
        isLoading,
        metadata,
    }) => {
        if (isLoading || !content) {
            return <DocumentSkeleton artifactKind="text" />;
        }

        let microAppData;
        try {
            microAppData = JSON.parse(content);
        } catch (error) {
            return <div className="p-4 text-red-500">Error parsing micro-app data</div>;
        }

        const { type, title, toolCallId } = microAppData;

        return (
            <div className="h-full w-full">
                {type === 'kpi-dashboard' && (
                    <KPIDashboard
                        title={title}
                        toolCallId={toolCallId}
                    />
                )}
                {type === 'company-config' && (
                    <CompanyConfig
                        title={title}
                        toolCallId={toolCallId}
                    />
                )}
                {type === 'employee-config' && (
                    <EmployeeConfig
                        title={title}
                        toolCallId={toolCallId}
                    />
                )}
            </div>
        );
    },
    actions: [
        {
            icon: <SparklesIcon size={18} />,
            description: 'Refresh data',
            onClick: async () => {
                // Refresh the data by triggering a re-fetch
                // This could call the appropriate API to refresh the data
                toast.success('Data refreshed!');
            },
        },
        {
            icon: <CopyIcon size={18} />,
            description: 'Copy configuration',
            onClick: ({ content }) => {
                navigator.clipboard.writeText(content);
                toast.success('Configuration copied to clipboard!');
            },
        },
    ],
    toolbar: [
        {
            description: 'Update configuration',
            icon: <MenuIcon />,
            onClick: ({ appendMessage }) => {
                appendMessage({
                    role: 'user',
                    content: 'Help me update the configuration for this dashboard.',
                });
            },
        },
    ],
}); 