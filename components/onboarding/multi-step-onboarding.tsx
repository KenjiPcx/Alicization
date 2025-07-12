import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Building, Users, Sparkles, ArrowRight, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface CompanyData {
    name: string;
    description: string;
    vision: string;
    mission: string;
}

export interface CEOData {
    name: string;
    gender: 'male' | 'female';
    personality: string;
    background: string;
}

interface MultiStepOnboardingProps {
    open: boolean;
    onComplete: (companyData: CompanyData, ceoData: CEOData) => void;
    isLoading?: boolean;
}

export function MultiStepOnboarding({ open, onComplete, isLoading = false }: MultiStepOnboardingProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [companyData, setCompanyData] = useState<CompanyData>({
        name: '',
        description: '',
        vision: '',
        mission: '',
    });
    const [ceoData, setCeoData] = useState<CEOData>({
        name: '',
        gender: 'female',
        personality: '',
        background: '',
    });

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleCEOSelect = (gender: 'male' | 'female') => {
        if (gender === 'female') {
            setCeoData({
                name: 'Alice',
                gender: 'female',
                personality: 'Strategic, analytical, and deeply committed to achieving perfection. Alice approaches challenges with logical precision while maintaining a warm, supportive leadership style.',
                background: 'An artificial intelligence with exceptional strategic thinking and leadership capabilities, inspired by the Advanced AI from Project Alicization.',
            });
        } else {
            setCeoData({
                name: 'Eugeo',
                gender: 'male',
                personality: 'Determined, loyal, and naturally charismatic. Eugeo leads with integrity and focuses on building strong relationships while driving towards ambitious goals.',
                background: 'A natural-born leader with unwavering determination and a talent for inspiring teams, based on the character from Project Alicization.',
            });
        }
    };

    const canProceedFromStep1 = companyData.name.trim() && companyData.description.trim();
    const canProceedFromStep2 = ceoData.name.trim();

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Create Your Company</h3>
                <p className="text-muted-foreground">
                    Let&apos;s start by setting up your AI company. Don&apos;t worry, you can change these details later.
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <Label htmlFor="company-name">Company Name *</Label>
                    <Input
                        id="company-name"
                        value={companyData.name}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Alicization Corp"
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label htmlFor="company-description">Description *</Label>
                    <Textarea
                        id="company-description"
                        value={companyData.description}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of what your company does..."
                        className="mt-1"
                        rows={3}
                    />
                </div>

                <div>
                    <Label htmlFor="company-vision">Vision</Label>
                    <Textarea
                        id="company-vision"
                        value={companyData.vision}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, vision: e.target.value }))}
                        placeholder="Your company's long-term vision..."
                        className="mt-1"
                        rows={2}
                    />
                </div>

                <div>
                    <Label htmlFor="company-mission">Mission</Label>
                    <Textarea
                        id="company-mission"
                        value={companyData.mission}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, mission: e.target.value }))}
                        placeholder="Your company's mission statement..."
                        className="mt-1"
                        rows={2}
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleNext} disabled={!canProceedFromStep1}>
                    Next: Choose CEO
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Choose Your CEO</h3>
                <p className="text-muted-foreground">
                    Select your AI Chief Executive Officer from Project Alicization
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Alice Option */}
                <Card
                    className={`cursor-pointer transition-all hover:shadow-lg ${ceoData.name === 'Alice' ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                    onClick={() => handleCEOSelect('female')}
                >
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2">
                            A
                        </div>
                        <CardTitle>Alice</CardTitle>
                        <CardDescription>Strategic AI Leader</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <div><strong>Personality:</strong> Analytical, strategic</div>
                            <div><strong>Leadership Style:</strong> Logical precision with warmth</div>
                            <div><strong>Specialty:</strong> Strategic planning & optimization</div>
                        </div>
                        {ceoData.name === 'Alice' && (
                            <Badge className="w-full justify-center mt-3">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Selected
                            </Badge>
                        )}
                    </CardContent>
                </Card>

                {/* Eugeo Option */}
                <Card
                    className={`cursor-pointer transition-all hover:shadow-lg ${ceoData.name === 'Eugeo' ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                    onClick={() => handleCEOSelect('male')}
                >
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2">
                            E
                        </div>
                        <CardTitle>Eugeo</CardTitle>
                        <CardDescription>Charismatic Visionary</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <div><strong>Personality:</strong> Determined, loyal</div>
                            <div><strong>Leadership Style:</strong> Inspiring & relationship-focused</div>
                            <div><strong>Specialty:</strong> Team building & vision execution</div>
                        </div>
                        {ceoData.name === 'Eugeo' && (
                            <Badge className="w-full justify-center mt-3">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Selected
                            </Badge>
                        )}
                    </CardContent>
                </Card>
            </div>

            {ceoData.name && (
                <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">{ceoData.name}&apos;s Background</h4>
                    <p className="text-sm text-muted-foreground">{ceoData.background}</p>
                </div>
            )}

            <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <Button onClick={handleNext} disabled={!canProceedFromStep2}>
                    Next: Complete Setup
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Welcome to Your AI Office! 🏢</h3>
                <p className="text-muted-foreground">
                    Your company and CEO are ready. Let&apos;s start building your AI-powered organization.
                </p>
            </div>

            {/* Company Summary */}
            <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Company Overview</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <strong>Company:</strong> {companyData.name}
                    </div>
                    <div>
                        <strong>CEO:</strong> {ceoData.name}
                    </div>
                </div>
            </div>

            {/* Quick Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg text-center">
                    <Building className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <h4 className="font-semibold">Company Management</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track KPIs, manage teams, and set strategic goals
                    </p>
                </div>

                <div className="p-4 border rounded-lg text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <h4 className="font-semibold">AI Employees</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                        Hire specialists and build high-performing teams
                    </p>
                </div>

                <div className="p-4 border rounded-lg text-center">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <h4 className="font-semibold">Intelligent Workflows</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                        Automate tasks and measure performance
                    </p>
                </div>
            </div>

            {/* CTA */}
            <div className="text-center pt-4 border-t">
                <h3 className="font-semibold mb-2">Ready to start?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Talk to {ceoData.name} to set up your first team and start defining company KPIs.
                </p>
                <Button
                    onClick={() => onComplete(companyData, ceoData)}
                    size="lg"
                    className="gap-2"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            Setting up your office...
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </>
                    ) : (
                        <>
                            Talk to {ceoData.name}
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>

            <div className="flex justify-start">
                <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            </div>
        </div>
    );

    return (
        <Dialog open={open}>
            <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto custom-scrollbar">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-2xl font-bold mb-2">
                        Setup Your AI Office
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Step {currentStep} of 3
                    </DialogDescription>
                </DialogHeader>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center space-x-2 mb-6">
                    {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === currentStep
                                    ? 'bg-primary text-primary-foreground'
                                    : step < currentStep
                                        ? 'bg-green-500 text-white'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                            >
                                {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                            </div>
                            {step < 3 && (
                                <div
                                    className={`w-12 h-0.5 mx-2 ${step < currentStep ? 'bg-green-500' : 'bg-muted'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="py-4">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                </div>
            </DialogContent>
        </Dialog>
    );
} 