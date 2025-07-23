import { useEffect } from 'react';
import OfficeScene from './office-scene';
import ChatDialog from './dialogs/chat-dialog';
import { useAppStore } from '@/lib/store/app-store';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useOfficeData } from '@/hooks/use-office-data';

// Main Office Simulation Component
export default function OfficeSimulation() {
    const { setUserMetadata } = useAppStore();

    // Fetch user metadata for onboarding and user type management
    const userMetadata = useQuery(api.usage.getCurrentUserMetadata);
    useEffect(() => {
        if (userMetadata) {
            setUserMetadata({ userType: userMetadata.type });
        }
    }, [userMetadata, setUserMetadata]);

    // Fetch office data from database (reactive!)
    const { company, teams, employees, desks, isLoading } = useOfficeData();

    // Get company ID from the first team (all teams should have same companyId)
    const companyId = company?._id;

    if (isLoading) {
        return (
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>Loading office data...</div>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <OfficeScene
                teams={teams}
                employees={employees}
                desks={desks}
                companyId={companyId}
            />

            <ChatDialog />
        </div>
    );
}
