import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, SparklesIcon } from '@/components/icons';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EmployeeConfigProps {
    title: string;
    toolCallId: string;
    employeeId?: Id<"employees">;
}
import {
    User,
    MapPin,
    Crown,
    Settings,
    Globe,
    Shield,
    Brain,
    Users,
    Zap
} from 'lucide-react';

export default function EmployeeConfig({ employeeId }: EmployeeConfigProps) {
    // Fetch employee data with skills and tools
    const employeeData = useQuery(api.employees.getEmployeeById,
        employeeId ? { employeeId, includeImages: true } : "skip"
    );

    if (!employeeId) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Card className="p-8 text-center">
                    <CardHeader>
                        <CardTitle>No Employee Selected</CardTitle>
                        <CardDescription>
                            Please select an employee to view their profile.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (!employeeData) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Card className="p-8 text-center">
                    <CardHeader>
                        <CardTitle>Loading...</CardTitle>
                        <CardDescription>
                            Fetching employee profile data...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const { skills = [], toolsets = [] } = employeeData;

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header Profile Section - GitHub Style */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar and Basic Info */}
                <div className="flex flex-col items-center md:items-start">
                    <div className="h-32 w-32 mb-4 ring-4 ring-primary/20 rounded-full flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {getInitials(employeeData.name)}
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {employeeData.isCEO && (
                            <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                                <Crown className="h-3 w-3 mr-1" />
                                CEO
                            </Badge>
                        )}
                        {employeeData.isSupervisor && (
                            <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                                <Shield className="h-3 w-3 mr-1" />
                                Supervisor
                            </Badge>
                        )}
                        <Badge variant="outline" className="capitalize">
                            <User className="h-3 w-3 mr-1" />
                            {employeeData.gender}
                        </Badge>
                    </div>
                </div>

                {/* Profile Details */}
                <div className="flex-1 space-y-4">
                    <div>
                        <h1 className="text-4xl font-bold">{employeeData.name}</h1>
                        <p className="text-xl text-muted-foreground">{employeeData.jobTitle}</p>
                        <p className="text-sm text-muted-foreground mt-2">{employeeData.jobDescription}</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{employeeData.team?.name || 'No Team'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>Desk {employeeData.deskIndex ?? 'Roaming'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Zap className="h-4 w-4" />
                            <span>{toolsets.length} Toolsets</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Brain className="h-4 w-4" />
                            <span>{skills.length} Skills</span>
                        </div>
                    </div>


                </div>
            </div>

            {/* Background and Personality - Condensed */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4" />
                        About
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                    <div>
                        <h4 className="font-medium text-sm mb-1">Background</h4>
                        <p className="text-muted-foreground text-sm">{employeeData.background}</p>
                    </div>
                    <div>
                        <h4 className="font-medium text-sm mb-1">Personality</h4>
                        <p className="text-muted-foreground text-sm">{employeeData.personality}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Skills Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Skills ({skills.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {skills.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No skills learned yet</p>
                            <p className="text-sm mt-2">Say &quot;let me teach you a skill&quot; to teach this employee a new workflow, or contact HR to assign existing skills.</p>
                        </div>
                    ) : (
                        <TooltipProvider>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {skills.map((skillData) => (
                                    <Tooltip key={skillData._id}>
                                        <TooltipTrigger asChild>
                                            <Card className="p-4 hover:shadow-md transition-shadow cursor-help">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 flex items-center justify-center flex-shrink-0">
                                                        {skillData.imageUrl ? (
                                                            <img
                                                                src={skillData.imageUrl}
                                                                alt={skillData.name}
                                                                className="w-8 h-8 object-cover rounded"
                                                            />
                                                        ) : (
                                                            <Brain className="w-6 h-6 text-cyan-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-sm truncate">
                                                            {skillData.name || 'Unknown Skill'}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                            {skillData.description || 'No description available'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Card>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold">
                                                    {skillData.name || 'Unknown Skill'}
                                                </h4>
                                                <p className="text-sm">
                                                    {skillData.description || 'No description available'}
                                                </p>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        </TooltipProvider>
                    )}
                </CardContent>
            </Card>

            {/* Toolsets Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Toolsets & Access ({toolsets.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {toolsets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No toolsets assigned yet</p>
                            <p className="text-sm mt-2">Contact IT to assign toolsets and access permissions to this employee.</p>
                        </div>
                    ) : (
                        <TooltipProvider>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {toolsets.map((toolset) => (
                                    <Tooltip key={toolset._id}>
                                        <TooltipTrigger asChild>
                                            <Card className="p-4 hover:shadow-md transition-shadow cursor-help">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {toolset.type === "builtin" ? (
                                                                <Settings className="w-4 h-4 text-blue-500" />
                                                            ) : (
                                                                <Globe className="w-4 h-4 text-green-500" />
                                                            )}
                                                            <h4 className="font-semibold">{toolset.name}</h4>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{toolset.description}</p>
                                                        <Badge variant="outline" className="text-xs">
                                                            {toolset.type === "builtin" ? "Built-in" : "MCP"}
                                                        </Badge>
                                                    </div>
                                                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-2" />
                                                </div>
                                            </Card>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold">{toolset.name}</h4>
                                                <p className="text-sm">{toolset.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Type: {toolset.type === "builtin" ? "Built-in" : "MCP"}
                                                </p>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        </TooltipProvider>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 