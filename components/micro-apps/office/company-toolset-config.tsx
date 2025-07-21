"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Plus, Wrench, Code, Globe, Activity, AlertCircle, CheckCircle, Package } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

interface CompanyToolsetConfigProps {
    title?: string;
    companyId?: Id<"companies">;
}

interface NewToolsetFormData {
    name: string;
    description: string;
    category: string;
    type: "builtin" | "mcp";
    // MCP specific fields
    connectionType?: "sse" | "stdio";
    connectionUrl?: string;
    runCommand?: string;
    args?: string;
    env?: string;
}

export default function CompanyToolsetConfig({ title, companyId }: CompanyToolsetConfigProps) {
    const [isAddingToolset, setIsAddingToolset] = useState(false);
    const [newToolsetData, setNewToolsetData] = useState<NewToolsetFormData>({
        name: "",
        description: "",
        category: "",
        type: "builtin",
    });

    // Fetch toolsets for the company
    const toolsets = useQuery(api.toolsets.getToolsetsByCompany,
        companyId ? { companyId } : "skip"
    );

    const createToolset = useMutation(api.toolsets.createToolset);
    const updateToolset = useMutation(api.toolsets.updateToolset);
    const deleteToolset = useMutation(api.toolsets.deleteToolset);

    const handleAddToolset = async () => {
        try {
            await createToolset({
                name: newToolsetData.name,
                description: newToolsetData.description,
                category: newToolsetData.category,
                type: newToolsetData.type,
                toolsetConfig: newToolsetData.type === "mcp" ? {
                    connectionType: newToolsetData.connectionType || "sse",
                    connectionUrl: newToolsetData.connectionUrl,
                    runCommand: newToolsetData.runCommand,
                    args: newToolsetData.args ? newToolsetData.args.split(",").map(s => s.trim()) : undefined,
                    env: newToolsetData.env ? JSON.parse(newToolsetData.env) : undefined,
                } : undefined,
                companyId,
            });

            // Reset form
            setNewToolsetData({
                name: "",
                description: "",
                category: "",
                type: "builtin",
            });
            setIsAddingToolset(false);
        } catch (error) {
            console.error("Failed to create toolset:", error);
        }
    };

    const getToolsetIcon = (toolset: any) => {
        if (toolset.type === "builtin") return <Code className="h-5 w-5 text-blue-500" />;
        if (toolset.type === "mcp") return <Globe className="h-5 w-5 text-green-500" />;
        return <Package className="h-5 w-5 text-gray-500" />;
    };

    const getToolsetTypeLabel = (toolset: any) => {
        if (toolset.type === "builtin") return "Built-in";
        if (toolset.type === "mcp") return "MCP";
        return "Unknown";
    };

    const getToolsetStatus = (toolset: any) => {
        if (toolset.isActive === false) return { icon: <AlertCircle className="h-4 w-4" />, label: "Inactive", color: "bg-red-500" };
        if (toolset.type === "builtin") return { icon: <CheckCircle className="h-4 w-4" />, label: "Built-in", color: "bg-blue-500" };
        return { icon: <Activity className="h-4 w-4" />, label: "Active", color: "bg-green-500" };
    };

    if (!companyId) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Card className="p-8 text-center">
                    <CardHeader>
                        <CardTitle>No Company Selected</CardTitle>
                        <CardDescription>
                            Please select a company to manage toolsets.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (!toolsets) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Card className="p-8 text-center">
                    <CardHeader>
                        <CardTitle>Loading...</CardTitle>
                        <CardDescription>
                            Fetching company toolsets...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold flex items-center gap-3">
                        <Settings className="h-10 w-10" />
                        Company Toolset Configuration
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                        Manage and configure toolsets available to your company
                    </p>
                </div>

                <Dialog open={isAddingToolset} onOpenChange={setIsAddingToolset}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Add Toolset
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Toolset</DialogTitle>
                            <DialogDescription>
                                Configure a new toolset for your company. Choose between built-in toolsets or MCP integrations.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Toolset Name</Label>
                                    <Input
                                        id="name"
                                        value={newToolsetData.name}
                                        onChange={(e) => setNewToolsetData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., Python Interpreter"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="category">Category</Label>
                                    <Input
                                        id="category"
                                        value={newToolsetData.category}
                                        onChange={(e) => setNewToolsetData(prev => ({ ...prev, category: e.target.value }))}
                                        placeholder="e.g., Development, Analysis"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={newToolsetData.description}
                                    onChange={(e) => setNewToolsetData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe what this toolset provides..."
                                    rows={3}
                                />
                            </div>

                            {/* Toolset Type */}
                            <div>
                                <Label htmlFor="type">Toolset Type</Label>
                                <Select
                                    value={newToolsetData.type}
                                    onValueChange={(value: "builtin" | "mcp") => setNewToolsetData(prev => ({ ...prev, type: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="builtin">Built-in Toolset</SelectItem>
                                        <SelectItem value="mcp">MCP Integration</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            {/* Type-specific configuration */}
                            {newToolsetData.type === "builtin" && (
                                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                                    <h4 className="font-medium mb-2">Built-in Toolset</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Built-in toolsets are pre-configured collections of tools defined in the codebase.
                                        They don't require additional configuration.
                                    </p>
                                </div>
                            )}

                            {newToolsetData.type === "mcp" && (
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="connectionType">Connection Type</Label>
                                        <Select
                                            value={newToolsetData.connectionType || "sse"}
                                            onValueChange={(value: "sse" | "stdio") => setNewToolsetData(prev => ({ ...prev, connectionType: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sse">SSE (Server-Sent Events)</SelectItem>
                                                <SelectItem value="stdio">Standard I/O</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {newToolsetData.connectionType === "sse" && (
                                        <div>
                                            <Label htmlFor="connectionUrl">Connection URL</Label>
                                            <Input
                                                id="connectionUrl"
                                                value={newToolsetData.connectionUrl || ""}
                                                onChange={(e) => setNewToolsetData(prev => ({ ...prev, connectionUrl: e.target.value }))}
                                                placeholder="https://api.example.com/mcp"
                                            />
                                        </div>
                                    )}

                                    {newToolsetData.connectionType === "stdio" && (
                                        <>
                                            <div>
                                                <Label htmlFor="runCommand">Run Command</Label>
                                                <Input
                                                    id="runCommand"
                                                    value={newToolsetData.runCommand || ""}
                                                    onChange={(e) => setNewToolsetData(prev => ({ ...prev, runCommand: e.target.value }))}
                                                    placeholder="node mcp-server.js"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="args">Arguments (comma-separated)</Label>
                                                <Input
                                                    id="args"
                                                    value={newToolsetData.args || ""}
                                                    onChange={(e) => setNewToolsetData(prev => ({ ...prev, args: e.target.value }))}
                                                    placeholder="--port, 3000, --verbose"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <Label htmlFor="env">Environment Variables (JSON)</Label>
                                        <Textarea
                                            id="env"
                                            value={newToolsetData.env || ""}
                                            onChange={(e) => setNewToolsetData(prev => ({ ...prev, env: e.target.value }))}
                                            placeholder='{"API_KEY": "your-key", "DEBUG": "true"}'
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setIsAddingToolset(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleAddToolset} disabled={!newToolsetData.name || !newToolsetData.description}>
                                    Add Toolset
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Toolsets</p>
                                <p className="text-2xl font-bold">{toolsets.length}</p>
                            </div>
                            <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Built-in</p>
                                <p className="text-2xl font-bold">{toolsets.filter(t => t.type === "builtin").length}</p>
                            </div>
                            <Code className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">MCP Toolsets</p>
                                <p className="text-2xl font-bold">{toolsets.filter(t => t.type === "mcp").length}</p>
                            </div>
                            <Globe className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active</p>
                                <p className="text-2xl font-bold">{toolsets.filter(t => t.isActive !== false).length}</p>
                            </div>
                            <Activity className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Toolsets Directory */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Toolsets Directory ({toolsets.length})
                    </CardTitle>
                    <CardDescription>
                        All toolsets registered and available to your company
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {toolsets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No toolsets configured yet</p>
                            <p className="text-sm mt-2">Add your first toolset to get started with company-wide integrations.</p>
                        </div>
                    ) : (
                        <TooltipProvider>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                {toolsets.map((toolset) => {
                                    const status = getToolsetStatus(toolset);
                                    return (
                                        <Tooltip key={toolset._id}>
                                            <TooltipTrigger asChild>
                                                <Card className="p-3 hover:shadow-md transition-shadow cursor-help">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            {getToolsetIcon(toolset)}
                                                            <h4 className="font-medium text-sm truncate">{toolset.name}</h4>
                                                        </div>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${status.color} flex-shrink-0 mt-0.5`} />
                                                    </div>

                                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                        {toolset.description}
                                                    </p>

                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex gap-1">
                                                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                                                {getToolsetTypeLabel(toolset)}
                                                            </Badge>
                                                            {toolset.category && (
                                                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 max-w-20 truncate">
                                                                    {toolset.category}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <div className="w-3 h-3">{status.icon}</div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-xs">
                                                <div className="space-y-2">
                                                    <h4 className="font-semibold">{toolset.name}</h4>
                                                    <p className="text-sm">{toolset.description}</p>
                                                    <div className="text-xs text-muted-foreground space-y-1">
                                                        <p>Type: {getToolsetTypeLabel(toolset)}</p>
                                                        {toolset.category && <p>Category: {toolset.category}</p>}
                                                        {toolset.type === "mcp" && toolset.toolsetConfig && (
                                                            <p>Connection: {toolset.toolsetConfig.connectionType}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </TooltipProvider>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 