import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, SparklesIcon } from '@/components/icons';

interface EmployeeConfigProps {
    title: string;
    toolCallId: string;
}

export default function EmployeeConfig({ title, toolCallId }: EmployeeConfigProps) {
    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{title}</h1>
                    <p className="text-muted-foreground">Manage employee configurations and settings</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <PlusIcon size={16} />
                        Add Employee
                    </Button>
                    <Button variant="outline" size="sm">
                        <SparklesIcon size={16} />
                        AI Recommendations
                    </Button>
                </div>
            </div>

            {/* Coming Soon */}
            <Card className="p-8 text-center">
                <CardHeader>
                    <CardTitle>Employee Configuration</CardTitle>
                    <CardDescription>
                        This feature is coming soon! Employee management and configuration tools will be available here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">
                        Features will include:
                    </p>
                    <ul className="text-left text-muted-foreground space-y-2 mb-6">
                        <li>• Employee profile management</li>
                        <li>• Role and permission settings</li>
                        <li>• Performance tracking configuration</li>
                        <li>• Goal assignment and tracking</li>
                        <li>• Integration with KPI dashboard</li>
                    </ul>
                    <Button disabled>
                        Coming Soon
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
} 