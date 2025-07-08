import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDownIcon, PlusIcon, SparklesIcon } from '@/components/icons';
// Remove useAuth import since it doesn't exist
import { cn } from '@/lib/utils';

interface KPIDashboardProps {
    title: string;
    toolCallId: string;
}

interface KPI {
    _id: Id<"kpis">;
    name: string;
    description: string;
    currentValue?: number;
    target?: number;
    unit: string;
    direction: "increase" | "decrease";
    status: "pending" | "in-progress" | "completed" | "failed";
    statusMessage?: string;
    quarter: "Q1" | "Q2" | "Q3" | "Q4";
    year: number;
}

export default function KPIDashboard({ title, toolCallId }: KPIDashboardProps) {
    const user = useQuery(api.auth.currentUser);
    const [selectedQuarter, setSelectedQuarter] = useState<"Q1" | "Q2" | "Q3" | "Q4">("Q1");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Get company ID from user
    const company = useQuery(api.companies.getCompany, user?._id ? { userId: user._id } : "skip");

    // Get KPIs for the company
    const kpis = useQuery(
        api.kpis.getKPIs,
        company?._id
            ? {
                scope: "company",
                companyId: company._id,
                quarter: selectedQuarter,
                year: selectedYear,
            }
            : "skip"
    );

    // Get KPI dashboard summary
    const dashboard = useQuery(
        api.kpis.getKPIDashboard,
        company?._id
            ? {
                scope: "company",
                companyId: company._id,
                quarter: selectedQuarter,
                year: selectedYear,
            }
            : "skip"
    );

    const calculateProgress = (kpi: KPI) => {
        if (!kpi.currentValue || !kpi.target) return 0;

        const progress = (kpi.currentValue / kpi.target) * 100;
        return Math.min(100, Math.max(0, progress));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500';
            case 'in-progress':
                return 'bg-blue-500';
            case 'failed':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getDirectionIcon = (direction: string, currentValue?: number, target?: number) => {
        if (!currentValue || !target) return null;

        const isOnTrack = direction === 'increase' ? currentValue >= target * 0.8 : currentValue <= target * 1.2;
        return isOnTrack ? '📈' : '📉';
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{title}</h1>
                    <p className="text-muted-foreground">Track and manage key performance indicators</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <PlusIcon size={16} />
                        Add KPI
                    </Button>
                    <Button variant="outline" size="sm">
                        <SparklesIcon size={16} />
                        Analyze
                    </Button>
                </div>
            </div>

            {/* Time Period Selector */}
            <Tabs value={selectedQuarter} onValueChange={(value) => setSelectedQuarter(value as any)}>
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="Q1">Q1</TabsTrigger>
                        <TabsTrigger value="Q2">Q2</TabsTrigger>
                        <TabsTrigger value="Q3">Q3</TabsTrigger>
                        <TabsTrigger value="Q4">Q4</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="px-3 py-1 border rounded-md"
                        >
                            {[2024, 2025, 2026].map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Tabs>

            {/* Dashboard Summary */}
            {dashboard && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total KPIs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboard.summary.totalKPIs || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{dashboard.summary.completedKPIs || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{dashboard.summary.inProgressKPIs || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboard.summary.completionRate?.toFixed(1) || 0}%</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kpis?.map((kpi) => {
                    const progress = calculateProgress(kpi);
                    return (
                        <Card key={kpi._id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            {kpi.name}
                                            {getDirectionIcon(kpi.direction, kpi.currentValue, kpi.target)}
                                        </CardTitle>
                                        <CardDescription className="text-sm mt-1">
                                            {kpi.description}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className={cn("ml-2", getStatusColor(kpi.status))}>
                                        {kpi.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Current vs Target */}
                                <div className="flex items-center justify-between text-sm">
                                    <span>Current: <strong>{kpi.currentValue || 0}{kpi.unit}</strong></span>
                                    <span>Target: <strong>{kpi.target || 0}{kpi.unit}</strong></span>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span>Progress</span>
                                        <span>{progress.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>

                                {/* Status Message */}
                                {kpi.statusMessage && (
                                    <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                        {kpi.statusMessage}
                                    </div>
                                )}

                                {/* Period */}
                                <div className="text-xs text-muted-foreground border-t pt-2">
                                    {kpi.quarter} {kpi.year}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Empty State */}
            {(!kpis || kpis.length === 0) && (
                <Card className="p-8 text-center">
                    <CardHeader>
                        <CardTitle>No KPIs Found</CardTitle>
                        <CardDescription>
                            Get started by creating your first KPI for {selectedQuarter} {selectedYear}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button>
                            <PlusIcon size={16} />
                            Create First KPI
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 