import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PencilEditIcon, PlusIcon, SparklesIcon, CheckCircleFillIcon, CrossIcon } from '@/components/icons';
import { toast } from 'sonner';

interface CompanyConfigProps {
    title: string;
    toolCallId: string;
}

interface Company {
    _id: Id<"companies">;
    name: string;
    vision?: string;
    mission?: string;
    values?: string[];
    goals?: string[];
    userId: Id<"users">;
}

export default function CompanyConfig({ title }: CompanyConfigProps) {
    const user = useQuery(api.auth.currentUser);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Company>>({});

    // Get company data
    const companyData = useQuery(api.companies.getCompany, {
        fetchTeams: false,
        fetchEmployees: false,
    });
    const company = companyData?.company;

    // Update company mutation
    const updateCompany = useMutation(api.companies.updateCompany);

    // Initialize edit data when company data loads
    useEffect(() => {
        if (company && !isEditing) {
            setEditData({
                name: company.name,
                vision: company.vision || "",
                mission: company.mission || "",
                values: company.values || [],
                goals: company.goals || [],
            });
        }
    }, [company, isEditing]);

    const handleSave = async () => {
        if (!user?._id) return;

        try {
            await updateCompany({
                userId: user._id,
                name: editData.name,
                vision: editData.vision,
                mission: editData.mission,
                values: editData.values,
                goals: editData.goals,
            });

            setIsEditing(false);
            toast.success('Company details updated successfully!');
        } catch (error) {
            toast.error('Failed to update company details');
            console.error('Update failed:', error);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (company) {
            setEditData({
                name: company.name,
                vision: company.vision || "",
                mission: company.mission || "",
                values: company.values || [],
                goals: company.goals || [],
            });
        }
    };

    const addValue = () => {
        setEditData(prev => ({
            ...prev,
            values: [...(prev.values || []), ""]
        }));
    };

    const updateValue = (index: number, value: string) => {
        setEditData(prev => ({
            ...prev,
            values: prev.values?.map((v, i) => i === index ? value : v) || []
        }));
    };

    const removeValue = (index: number) => {
        setEditData(prev => ({
            ...prev,
            values: prev.values?.filter((_, i) => i !== index) || []
        }));
    };

    const addGoal = () => {
        setEditData(prev => ({
            ...prev,
            goals: [...(prev.goals || []), ""]
        }));
    };

    const updateGoal = (index: number, goal: string) => {
        setEditData(prev => ({
            ...prev,
            goals: prev.goals?.map((g, i) => i === index ? goal : g) || []
        }));
    };

    const removeGoal = (index: number) => {
        setEditData(prev => ({
            ...prev,
            goals: prev.goals?.filter((_, i) => i !== index) || []
        }));
    };

    if (!company) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Card className="p-8 text-center">
                    <CardHeader>
                        <CardTitle>No Company Found</CardTitle>
                        <CardDescription>
                            You need to create a company first before configuring it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button>
                            <PlusIcon size={16} />
                            Create Company
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{title}</h1>
                    <p className="text-muted-foreground">Configure your company&apos;s core information</p>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" size="sm" onClick={handleCancel}>
                                <CrossIcon size={16} />
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleSave}>
                                <CheckCircleFillIcon size={16} />
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <PencilEditIcon size={16} />
                            Edit
                        </Button>
                    )}
                </div>
            </div>

            {/* Company Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Company Information
                        <Badge variant="outline">{isEditing ? 'Editing' : 'View Mode'}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Company Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Company Name</Label>
                        {isEditing ? (
                            <Input
                                id="name"
                                value={editData.name || ""}
                                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter company name"
                            />
                        ) : (
                            <div className="text-2xl font-bold">{company.name}</div>
                        )}
                    </div>

                    {/* Vision */}
                    <div className="space-y-2">
                        <Label htmlFor="vision">Vision</Label>
                        {isEditing ? (
                            <Textarea
                                id="vision"
                                value={editData.vision || ""}
                                onChange={(e) => setEditData(prev => ({ ...prev, vision: e.target.value }))}
                                placeholder="Enter your company's vision..."
                                className="min-h-20"
                            />
                        ) : (
                            <div className="p-3 bg-muted rounded-md">
                                {company.vision || <span className="text-muted-foreground">No vision set</span>}
                            </div>
                        )}
                    </div>

                    {/* Mission */}
                    <div className="space-y-2">
                        <Label htmlFor="mission">Mission</Label>
                        {isEditing ? (
                            <Textarea
                                id="mission"
                                value={editData.mission || ""}
                                onChange={(e) => setEditData(prev => ({ ...prev, mission: e.target.value }))}
                                placeholder="Enter your company's mission..."
                                className="min-h-20"
                            />
                        ) : (
                            <div className="p-3 bg-muted rounded-md">
                                {company.mission || <span className="text-muted-foreground">No mission set</span>}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Values and Goals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Values */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Company Values</CardTitle>
                            {isEditing && (
                                <Button variant="outline" size="sm" onClick={addValue}>
                                    <PlusIcon size={16} />
                                    Add Value
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {isEditing ? (
                            <div className="space-y-2">
                                {(editData.values || []).map((value, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input
                                            value={value}
                                            onChange={(e) => updateValue(index, e.target.value)}
                                            placeholder="Enter a company value"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeValue(index)}
                                        >
                                            <CrossIcon size={16} />
                                        </Button>
                                    </div>
                                ))}
                                {(editData.values || []).length === 0 && (
                                    <p className="text-muted-foreground text-sm">No values added yet</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {company.values?.map((value, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Badge variant="secondary">{value}</Badge>
                                    </div>
                                )) || <span className="text-muted-foreground">No values set</span>}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Goals */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Company Goals</CardTitle>
                            {isEditing && (
                                <Button variant="outline" size="sm" onClick={addGoal}>
                                    <PlusIcon size={16} />
                                    Add Goal
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {isEditing ? (
                            <div className="space-y-2">
                                {(editData.goals || []).map((goal, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input
                                            value={goal}
                                            onChange={(e) => updateGoal(index, e.target.value)}
                                            placeholder="Enter a company goal"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeGoal(index)}
                                        >
                                            <CrossIcon size={16} />
                                        </Button>
                                    </div>
                                ))}
                                {(editData.goals || []).length === 0 && (
                                    <p className="text-muted-foreground text-sm">No goals added yet</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {company.goals?.map((goal, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Badge variant="secondary">{goal}</Badge>
                                    </div>
                                )) || <span className="text-muted-foreground">No goals set</span>}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* AI Assistant Tips */}
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <SparklesIcon size={16} />
                        AI Assistant Tips
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-600 dark:text-blue-400">
                    <ul className="space-y-1">
                        <li>• You can ask me to help refine your vision and mission statements</li>
                        <li>• I can suggest company values based on your industry and goals</li>
                        <li>• Need help setting SMART goals? Just ask!</li>
                        <li>• I can analyze your current configuration and suggest improvements</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
} 