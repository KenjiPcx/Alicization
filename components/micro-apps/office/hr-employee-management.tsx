"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Users, UserPlus, Settings, Crown, Shield, Package, Plus, Minus, Globe, Code } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";
import type { Id } from "@/convex/_generated/dataModel";

interface HREmployeeManagementProps {
    title?: string;
    companyId?: Id<"companies">;
}

interface SelectedEmployee {
    _id: Id<"employees">;
    name: string;
    jobTitle: string;
    builtInRole?: string;
    isCEO?: boolean;
    isSupervisor: boolean;
    team: { _id: Id<"teams">; name: string };
    toolsets: Array<{
        _id: Id<"toolsets">;
        name: string;
        description: string;
        type: "builtin" | "mcp";
    }>;
}

export default function HREmployeeManagement({ title, companyId }: HREmployeeManagementProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState<SelectedEmployee | null>(null);
    const [isAssigningToolsets, setIsAssigningToolsets] = useState(false);

    // Fetch employees for the company
    const employees = useQuery(api.employees.getEmployeesByCompany,
        companyId ? { companyId } : "skip"
    );

    // Fetch all toolsets for assignment
    const allToolsets = useQuery(api.toolsets.getToolsetsByCompany,
        companyId ? { companyId } : "skip"
    );

    const assignToolset = useMutation(api.toolsets.assignToolsetToEmployee);
    const removeToolset = useMutation(api.toolsets.removeToolsetFromEmployee);

    // Filter employees based on search
    const filteredEmployees = useMemo(() => {
        if (!employees) return [];
        if (!searchQuery) return employees;

        return employees.filter(employee =>
            employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.team?.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [employees, searchQuery]);

    const handleAssignToolset = async (toolsetId: Id<"toolsets">) => {
        if (!selectedEmployee || !allToolsets) return;

        console.log("Attempting to assign toolset:", toolsetId, "to employee:", selectedEmployee._id);
        console.log("Current toolsets for employee:", selectedEmployee.toolsets.map(t => t._id));

        try {
            await assignToolset({
                employeeId: selectedEmployee._id,
                toolsetId,
            });

            console.log("Successfully assigned toolset");

            // Find the toolset that was just assigned and add it to the local state
            const assignedToolset = allToolsets.find(t => t._id === toolsetId);
            if (assignedToolset) {
                setSelectedEmployee(prev => prev ? {
                    ...prev,
                    toolsets: [...prev.toolsets, {
                        _id: assignedToolset._id,
                        name: assignedToolset.name,
                        description: assignedToolset.description,
                        type: assignedToolset.type,
                    }]
                } : null);
            }
        } catch (error: any) {
            console.error("Failed to assign toolset:", error);
            // Show user-friendly error message with the actual error
            alert(`Failed to assign toolset: ${error.message || 'Unknown error'}`);
        }
    };

    const handleRemoveToolset = async (toolsetId: Id<"toolsets">) => {
        if (!selectedEmployee) return;

        try {
            await removeToolset({
                employeeId: selectedEmployee._id,
                toolsetId,
            });

            // Update selected employee by removing the toolset from the local state
            setSelectedEmployee(prev => prev ? {
                ...prev,
                toolsets: prev.toolsets.filter(t => t._id !== toolsetId)
            } : null);
        } catch (error) {
            console.error("Failed to remove toolset:", error);
            alert("Failed to remove toolset. Please try again.");
        }
    };

    const getEmployeeIcon = (employee: any) => {
        if (employee.isCEO || employee.builtInRole === "ceo") return <Crown className="h-4 w-4 text-yellow-500" />;
        if (employee.isSupervisor) return <Shield className="h-4 w-4 text-blue-500" />;
        return <Users className="h-4 w-4 text-gray-500" />;
    };

    const getRoleBadge = (employee: any) => {
        if (employee.isCEO || employee.builtInRole === "ceo") return { label: "CEO", color: "bg-yellow-500" };
        if (employee.builtInRole === "cto") return { label: "CTO", color: "bg-purple-500" };
        if (employee.builtInRole === "chro") return { label: "CHRO", color: "bg-green-500" };
        if (employee.builtInRole === "cfo") return { label: "CFO", color: "bg-blue-500" };
        if (employee.builtInRole === "cmo") return { label: "CMO", color: "bg-pink-500" };
        if (employee.builtInRole === "cso") return { label: "CSO", color: "bg-orange-500" };
        if (employee.builtInRole === "coo") return { label: "COO", color: "bg-indigo-500" };
        if (employee.isSupervisor) return { label: "Supervisor", color: "bg-gray-500" };
        return null;
    };

    const getAvailableToolsets = () => {
        if (!allToolsets || !selectedEmployee) return [];
        return allToolsets.filter(toolset =>
            !selectedEmployee.toolsets.some(assigned => assigned._id === toolset._id)
        );
    };

    if (!companyId) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Card className="p-8 text-center">
                    <CardHeader>
                        <CardTitle>No Company Selected</CardTitle>
                        <CardDescription>
                            Please select a company to manage employees.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (!employees || !allToolsets) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Card className="p-8 text-center">
                    <CardHeader>
                        <CardTitle>Loading...</CardTitle>
                        <CardDescription>
                            Fetching employee data...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold flex items-center gap-3">
                        <Users className="h-10 w-10" />
                        Employee Management
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                        Manage employees and assign toolsets
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search employees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-80"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Employees</p>
                                <p className="text-2xl font-bold">{employees.length}</p>
                            </div>
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">C-Level</p>
                                <p className="text-2xl font-bold">{employees.filter(e => e.builtInRole?.startsWith('c') || e.isCEO).length}</p>
                            </div>
                            <Crown className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Supervisors</p>
                                <p className="text-2xl font-bold">{employees.filter(e => e.isSupervisor).length}</p>
                            </div>
                            <Shield className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Available Toolsets</p>
                                <p className="text-2xl font-bold">{allToolsets.length}</p>
                            </div>
                            <Package className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Employee Directory */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Employee Directory ({filteredEmployees.length})
                    </CardTitle>
                    <CardDescription>
                        Click on an employee to view details and manage toolset assignments
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredEmployees.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No employees found</p>
                            <p className="text-sm mt-2">Try adjusting your search query.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredEmployees.map((employee) => {
                                const roleBadge = getRoleBadge(employee);
                                return (
                                    <Card
                                        key={employee._id}
                                        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => setSelectedEmployee(employee as SelectedEmployee)}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                {getEmployeeIcon(employee)}
                                                <h4 className="font-semibold truncate">{employee.name}</h4>
                                            </div>
                                            {roleBadge && (
                                                <Badge className={`text-white text-xs ${roleBadge.color}`}>
                                                    {roleBadge.label}
                                                </Badge>
                                            )}
                                        </div>

                                        <p className="text-sm text-muted-foreground mb-2">{employee.jobTitle}</p>
                                        <p className="text-xs text-muted-foreground mb-3">Team: {employee.team?.name}</p>

                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-muted-foreground">
                                                {employee.toolsets?.length || 0} toolsets
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-8 px-2">
                                                View Details
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Employee Detail Modal */}
            <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    {selectedEmployee && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {getEmployeeIcon(selectedEmployee)}
                                    {selectedEmployee.name}
                                </DialogTitle>
                                <DialogDescription>
                                    {selectedEmployee.jobTitle} • Team: {selectedEmployee.team.name}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6">
                                {/* Role Badges */}
                                <div className="flex gap-2">
                                    {(() => {
                                        const badge = getRoleBadge(selectedEmployee);
                                        if (badge) {
                                            return (
                                                <Badge className={`text-white ${badge.color}`}>
                                                    {badge.label}
                                                </Badge>
                                            );
                                        }
                                        return <Badge variant="outline">Employee</Badge>;
                                    })()}
                                </div>

                                <Separator />

                                {/* Toolset Management */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold">Assigned Toolsets ({selectedEmployee.toolsets.length})</h3>
                                        <div className="flex gap-2">
                                            {/* Debug info - remove in production */}
                                            <span className="text-xs text-muted-foreground">
                                                Available: {getAvailableToolsets().length}
                                            </span>
                                            <Button
                                                onClick={() => setIsAssigningToolsets(!isAssigningToolsets)}
                                                variant="outline"
                                                size="sm"
                                            >
                                                {isAssigningToolsets ? "Done" : "Manage Toolsets"}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Current Toolsets */}
                                    <div className="space-y-2">
                                        {selectedEmployee.toolsets.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-8 border rounded-lg">
                                                No toolsets assigned to this employee
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {selectedEmployee.toolsets.map((toolset) => (
                                                    <div key={toolset._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            {toolset.type === "builtin" ? (
                                                                <Code className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                                            ) : (
                                                                <Globe className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-medium text-base">{toolset.name}</p>
                                                                <p className="text-sm text-muted-foreground">{toolset.description}</p>
                                                                <Badge variant="outline" className="text-xs mt-1">
                                                                    {toolset.type === "builtin" ? "Built-in" : "MCP"}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        {isAssigningToolsets && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleRemoveToolset(toolset._id)}
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Minus className="h-4 w-4 mr-1" />
                                                                Remove
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Available Toolsets for Assignment */}
                                    {isAssigningToolsets && (
                                        <>
                                            <Separator className="my-6" />
                                            <div>
                                                <h4 className="font-medium mb-4 text-lg">Available Toolsets to Assign</h4>
                                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                                    {getAvailableToolsets().map((toolset) => (
                                                        <div key={toolset._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-green-50 dark:hover:bg-green-950/20">
                                                            <div className="flex items-center gap-3 flex-1">
                                                                {toolset.type === "builtin" ? (
                                                                    <Code className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                                                ) : (
                                                                    <Globe className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                                )}
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="font-medium text-base">{toolset.name}</p>
                                                                    <p className="text-sm text-muted-foreground">{toolset.description}</p>
                                                                    <Badge variant="outline" className="text-xs mt-1">
                                                                        {toolset.type === "builtin" ? "Built-in" : "MCP"}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleAssignToolset(toolset._id)}
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                                            >
                                                                <Plus className="h-4 w-4 mr-1" />
                                                                Assign
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                                {getAvailableToolsets().length === 0 && (
                                                    <p className="text-sm text-muted-foreground text-center py-8 border rounded-lg">
                                                        All available toolsets have been assigned to this employee
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
} 