import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
    FileText,
    Search,
    Calendar,
    Brain,
    Filter,
    ExternalLink,
    BookOpen,
    Sparkles,
    Users,
    CheckCircle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmployeeDriveProps {
    title: string;
    toolCallId: string;
    employeeId?: Id<"employees">;
}

export default function EmployeeDrive({ title, employeeId }: EmployeeDriveProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSkillId, setSelectedSkillId] = useState<Id<"skills"> | 'all'>('all');

    // Fetch employee data to get skills
    const employeeData = useQuery(api.employees.getEmployeeById,
        employeeId ? { employeeId } : "skip"
    );

    // Fetch drive files
    const driveFiles = useQuery(api.companyFiles.getEmployeeDrive,
        employeeId ? {
            employeeId,
            skillId: selectedSkillId !== 'all' ? selectedSkillId : undefined
        } : "skip"
    );

    if (!employeeId) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Card className="p-8 text-center">
                    <CardHeader>
                        <CardTitle>No Employee Selected</CardTitle>
                        <CardDescription>
                            Please select an employee to view their documentation.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (!employeeData || !driveFiles) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Card className="p-8 text-center">
                    <CardHeader>
                        <CardTitle>Loading...</CardTitle>
                        <CardDescription>
                            Fetching employee drive...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    // Filter files based on search query
    const filteredFiles = driveFiles.filter((file: any) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (file.aiSummary && file.aiSummary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (file.skill && file.skill.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Group files by skill
    const filesBySkill = filteredFiles.reduce((acc: any, file: any) => {
        const skillKey = file.skill ? file.skill._id : 'no-skill';
        const skillName = file.skill ? file.skill.name : 'General Files';

        if (!acc[skillKey]) {
            acc[skillKey] = {
                skillName,
                skill: file.skill,
                files: []
            };
        }
        acc[skillKey].files.push(file);
        return acc;
    }, {} as Record<string, { skillName: string; skill: any; files: any[] }>);

    const getFileIcon = (mimeType?: string, type?: string) => {
        if (type === 'artifact' || mimeType?.includes('markdown')) return <FileText className="h-4 w-4" />;
        if (mimeType?.includes('pdf')) return <FileText className="h-4 w-4 text-red-600" />;
        if (mimeType?.includes('image')) return <FileText className="h-4 w-4 text-green-600" />;
        if (mimeType?.includes('json') || mimeType?.includes('yaml')) return <FileText className="h-4 w-4 text-blue-600" />;
        return <BookOpen className="h-4 w-4" />;
    };

    const getFileTypeLabel = (type: string) => {
        switch (type) {
            case 'artifact': return 'Documentation';
            case 'information': return 'Data File';
            default: return 'File';
        }
    };

    const formatFileSize = (bytes: number) => {
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    };

    const handleFileOpen = (fileUrl: string) => {
        window.open(fileUrl, '_blank');
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                        {employeeData.name}&apos;s Drive
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Files, documentation, and resources accessible to this employee
                    </p>
                </div>

                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search files and documentation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Select value={selectedSkillId} onValueChange={(value) => setSelectedSkillId(value as Id<"skills"> | 'all')}>
                        <SelectTrigger className="w-full sm:w-64">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Filter by skill" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Skills</SelectItem>
                            {employeeData.skills?.map((skillData) => (
                                <SelectItem key={skillData._id} value={skillData._id}>
                                    {skillData.name || 'Unknown Skill'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{filteredFiles.length}</span>
                        <span className="text-muted-foreground">Files</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950 rounded-lg">
                        <Brain className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{Object.keys(filesBySkill).length}</span>
                        <span className="text-muted-foreground">Skills Covered</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 dark:bg-purple-950 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">{filteredFiles.filter(f => f.embeddingStatus === 'completed').length}</span>
                        <span className="text-muted-foreground">Searchable</span>
                    </div>
                </div>
            </div>

            {/* Documentation Content */}
            {filteredFiles.length === 0 ? (
                <Card className="p-8 text-center">
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                                <BookOpen className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">No Files Found</h3>
                            <p className="text-muted-foreground mt-1">
                                {searchQuery
                                    ? "Try adjusting your search or filter criteria"
                                    : "This employee doesn&apos;t have access to any files yet"
                                }
                            </p>
                        </div>
                        {!searchQuery && (
                            <p className="text-sm text-muted-foreground">
                                Say &quot;let me teach you a skill&quot; to create documentation, or upload files to the team drive
                            </p>
                        )}
                    </div>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.entries(filesBySkill).map(([skillKey, { skillName, skill, files }]: [string, any]) => (
                        <Card key={skillKey}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Brain className="h-5 w-5 text-purple-600" />
                                        <span>{skillName}</span>
                                    </div>
                                    <Badge variant="outline" className="ml-auto">
                                        {files.length} file{files.length !== 1 ? 's' : ''}
                                    </Badge>
                                </CardTitle>
                                {skill && (
                                    <CardDescription>
                                        {skill.description}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {files.map((file: any) => (
                                        <Card key={file._id} className="p-4 hover:shadow-md transition-shadow">
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        {getFileIcon(file.mimeType, file.type)}
                                                        <div className="min-w-0 flex-1">
                                                            <h4 className="font-semibold text-sm truncate">{file.name}</h4>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatFileSize(file.size)} • {new Date(file._creationTime).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => file.fileUrl && handleFileOpen(file.fileUrl)}
                                                        className="shrink-0"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {file.aiSummary && (
                                                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <Sparkles className="h-3 w-3" />
                                                            <span className="font-medium">AI Summary</span>
                                                        </div>
                                                        <p className="text-xs line-clamp-2 overflow-hidden">{file.aiSummary}</p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant={file.embeddingStatus === 'completed' ? 'default' : 'secondary'}
                                                            className="text-xs"
                                                        >
                                                            {file.embeddingStatus === 'completed' ? 'Searchable' : 'Processing'}
                                                        </Badge>
                                                    </div>
                                                    <Badge
                                                        variant={file.type === 'artifact' ? 'default' : 'secondary'}
                                                        className="text-xs"
                                                    >
                                                        {getFileTypeLabel(file.type)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
} 