import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, SparklesIcon } from '@/components/icons';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Badge } from '@/components/ui/badge';

interface EmployeeConfigProps {
    title: string;
    toolCallId: string;
    employeeId?: Id<"employees">;
}
import {
    User,
    MapPin,
    Calendar,
    Star,
    Trophy,
    Briefcase,
    Users,
    Zap,
    Brain,
    ChevronRight,
    Shield,
    Crown,
    Settings
} from 'lucide-react';

export default function EmployeeConfig({ title, employeeId }: EmployeeConfigProps) {
    // Fetch employee data with skills and tools
    const employeeData = useQuery(api.employees.getEmployeeById,
        employeeId ? { employeeId } : "skip"
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

    const { skills = [], tools = [] } = employeeData;

    // Calculate skill stats
    const skillsByProficiency = skills.reduce((acc: Record<string, number>, skillData) => {
        acc[skillData.proficiencyLevel] = (acc[skillData.proficiencyLevel] || 0) + 1;
        return acc;
    }, {});

    // Calculate overall level based on skills
    const totalSkillPoints = skills.reduce((sum, skillData) => {
        const proficiencyPoints = {
            learning: 1,
            competent: 2,
            proficient: 3,
            expert: 4
        };
        return sum + proficiencyPoints[skillData.proficiencyLevel];
    }, 0);

    const currentLevel = Math.floor(totalSkillPoints / 10) + 1;
    const currentLevelPoints = totalSkillPoints % 10;
    const nextLevelPoints = 10;

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const getProficiencyColor = (level: string) => {
        switch (level) {
            case 'learning': return 'bg-yellow-500';
            case 'competent': return 'bg-blue-500';
            case 'proficient': return 'bg-green-500';
            case 'expert': return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    const getProficiencyLabel = (level: string) => {
        switch (level) {
            case 'learning': return 'Learning';
            case 'competent': return 'Competent';
            case 'proficient': return 'Proficient';
            case 'expert': return 'Expert';
            default: return level;
        }
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
                            <span>{tools.length} Tools</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Brain className="h-4 w-4" />
                            <span>{skills.length} Skills</span>
                        </div>
                    </div>

                    {/* Level and XP */}
                    <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-purple-500" />
                                <span className="font-semibold">Level {currentLevel}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {currentLevelPoints}/{nextLevelPoints} XP
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(currentLevelPoints / nextLevelPoints) * 100}%` }}
                            />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Background and Personality */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        About
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">Background</h4>
                        <p className="text-muted-foreground">{employeeData.background}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Personality</h4>
                        <p className="text-muted-foreground">{employeeData.personality}</p>
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
                            <p className="text-sm mt-2">Say "let me teach you a skill" to teach this employee a new workflow, or contact HR to assign existing skills.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Proficiency Overview */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(skillsByProficiency).map(([level, count]) => (
                                    <div key={level} className="text-center p-3 rounded-lg bg-muted">
                                        <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${getProficiencyColor(level)}`} />
                                        <div className="font-bold">{count}</div>
                                        <div className="text-xs text-muted-foreground">{getProficiencyLabel(level)}</div>
                                    </div>
                                ))}
                            </div>

                            {/* All Skills */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {skills.map((skillData) => (
                                    <div key={skillData._id} className="flex items-center justify-between p-3 rounded-lg border">
                                        <div className="flex-1">
                                            <div className="font-medium">{skillData.skill?.name}</div>
                                            <div className="text-xs text-muted-foreground">{skillData.skill?.description}</div>
                                            {skillData.notes && (
                                                <div className="text-xs text-blue-600 mt-1">{skillData.notes}</div>
                                            )}
                                            <div className="text-xs text-gray-500 mt-1">
                                                Acquired: {new Date(skillData.dateAcquired).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={`${getProficiencyColor(skillData.proficiencyLevel)} text-white ml-3`}
                                        >
                                            {getProficiencyLabel(skillData.proficiencyLevel)}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tools Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Tools & Access ({tools.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {tools.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No tools assigned yet</p>
                            <p className="text-sm mt-2">Contact HR to assign tools and access permissions to this employee.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tools.map((tool) => (
                                <Card key={tool._id} className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{tool.name}</h4>
                                            <p className="text-sm text-muted-foreground mb-2">{tool.description}</p>
                                            <Badge variant="outline" className="text-xs">
                                                {tool.type.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-2" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 