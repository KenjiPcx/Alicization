import React from 'react';
import { useOnboarding } from '@/hooks/use-onboarding';
import { MultiStepOnboarding, CompanyData, CEOData } from './multi-step-onboarding';

interface OnboardingModalProps {
    open: boolean;
}

export function OnboardingModal({ open }: OnboardingModalProps) {
    const { isLoading, createCompanyWithCEO } = useOnboarding();

    const handleComplete = async (companyData: CompanyData, ceoData: CEOData) => {
        try {
            await createCompanyWithCEO(companyData, ceoData);
        } catch (error) {
            console.error('Failed to complete onboarding:', error);
            // You might want to show an error toast here
        }
    };

    return (
        <MultiStepOnboarding
            open={open}
            onComplete={handleComplete}
            isLoading={isLoading}
        />
    );
} 