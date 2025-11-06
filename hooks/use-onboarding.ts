import { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useChatStore } from '@/lib/store/chat-store';
import { CompanyData, CEOData } from '@/components/onboarding/multi-step-onboarding';
import { useAppStore } from '@/lib/store/app-store';
import type { Id } from '@/convex/_generated/dataModel';

export function useOnboarding() {
    // const [isLoading, setIsLoading] = useState(false);

    // const { setCurrentMode, initialVisibilityType, setThreadId } = useChatStore();
    // const { setActiveChatParticipant, setIsChatModalOpen } = useAppStore();

    // // Convex queries and mutations
    // const createCompanyMutation = useMutation(api.companies.createCompany);
    // const getOrCreateManagementTeam = useAction(api.onboarding.getOrCreateManagementTeam);
    // const getOrCreateCEO = useAction(api.onboarding.getOrCreateCEO);
    // const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
    // const completeOnboardingMutation = useMutation(api.onboarding.completeOnboarding);
    // const resetOnboardingMutation = useMutation(api.onboarding.resetOnboarding);
    // const createThread = useMutation(api.chat.createThread);

    // // Show onboarding if user needs it and data is loaded
    // const showOnboarding = onboardingStatus?.needsOnboarding ?? false;

    // const completeOnboarding = async () => {
    //     try {
    //         await completeOnboardingMutation();
    //     } catch (error) {
    //         console.error('Failed to complete onboarding:', error);
    //     }
    // };

    // const createCompanyWithCEO = async (companyData: CompanyData, ceoData: CEOData) => {
    //     try {
    //         setIsLoading(true);

    //         // Create company with user-provided data
    //         const companyId = await createCompanyMutation({
    //             name: companyData.name,
    //             description: companyData.description,
    //             vision: companyData.vision || "Company vision",
    //             mission: companyData.mission || "Company mission",
    //         });

    //         // Get or create management team
    //         const managementTeamId = await getOrCreateManagementTeam({
    //             companyId,
    //         });

    //         // Create CEO with selected data
    //         const ceoId = await getOrCreateCEO({
    //             companyId,
    //             name: ceoData.name,
    //             jobDescription: `Chief Executive Officer - ${ceoData.background}`,
    //             gender: ceoData.gender,
    //             background: ceoData.background,
    //             personality: ceoData.personality,
    //             statusMessage: `Ready to lead ${companyData.name} to success`,
    //             isSupervisor: true,
    //             isCEO: true,
    //             deskIndex: 0,
    //             jobTitle: "CEO",
    //         });

    //         // Create a chat with the CEO agent
    //         const { threadId } = await createThread({
    //             chatOwnerId: ceoId,
    //             chatType: "employee",
    //             visibility: initialVisibilityType,
    //         });

    //         // Switch to chat mode and open the thread
    //         setCurrentMode('Chat');
    //         setThreadId(threadId);
    //         setIsChatModalOpen(true);
    //         setActiveChatParticipant({
    //             type: "employee",
    //             employeeId: ceoId as Id<"employees">,
    //             teamId: managementTeamId as Id<"teams">,
    //             companyId,
    //         });

    //         console.log("Chat modal opened");
    //         // Complete onboarding
    //         await completeOnboarding();

    //         return { companyId, managementTeamId, ceoId, threadId };
    //     } catch (error) {
    //         console.error('Failed to create company with CEO:', error);
    //         throw error;
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    // const resetOnboarding = async () => {
    //     try {
    //         await resetOnboardingMutation();
    //     } catch (error) {
    //         console.error('Failed to reset onboarding:', error);
    //     }
    // };

    // return {
    //     showOnboarding,
    //     isLoading,
    //     createCompanyWithCEO,
    //     completeOnboarding,
    //     resetOnboarding,
    //     onboardingStatus, // Expose the full status for debugging
    //     isLoadingStatus: onboardingStatus === undefined, // Loading state for the query
    // };
} 