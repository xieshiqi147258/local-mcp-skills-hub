"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Play, Square, Settings, Trash2, FileText, RefreshCw, Copy } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ServerStatus = "running" | "stopped" | "error"

type MCPServer = {
  id: string
  name: string
  type: "stdio" | "sse"
  status: ServerStatus
  command: string
  args: string[]
  description?: string
}

export function MCPPanel() {
  const [platform, setPlatform] = useState("claude-desktop")
  const [servers] = useState<MCPServer[]>([
    {
      id: "1",
      name: "filesystem",
      type: "stdio",
      status: "running",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
      description: "File system access and operations",
    },
    {
      id: "2",
      name: "database",
      type: "stdio",
      status: "stopped",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-postgres"],
      description: "PostgreSQL database connection",
    },
    {
      id: "3",
      name: "web-search",
      type: "sse",
      status: "error",
      command: "node",
      args: ["dist/index.js"],
      description: "Web search and content retrieval",
    },
    {
      id: "4",
      name: "github",
      type: "stdio",
      status: "running",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      description: "GitHub repository operations",
    },
  ])

  const getStatusColor = (status: ServerStatus) => {
    switch (status) {
      case "running":
        return "bg-success"
      case "stopped":
        return "bg-muted-foreground"
      case "error":
        return "bg-destructive"
    }
  }

  const getStatusText = (status: ServerStatus) => {
    switch (status) {
      case "running":
        return "Running"
      case "stopped":
        return "Stopped"
      case "error":
        return "Error"
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">MCP Configuration</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your MCP servers and configurations</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Server
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Platform:</span>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude-desktop">Claude Desktop</SelectItem>
                <SelectItem value="claude-code">Claude Code</SelectItem>
                <SelectItem value="cursor">Cursor</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>%APPDATA%/Claude/claude_desktop_config.json</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {servers.map((server) => (
            <Card key={server.id} className="p-5 bg-card border-border hover:border-primary/50 transition-colors">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{server.name}</h3>
                      <Badge variant="secondary" className="text-xs font-mono">
                        {server.type}
                      </Badge>
                    </div>
                    {server.description && <p className="text-sm text-muted-foreground mt-1">{server.description}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${getStatusColor(server.status)} animate-pulse`} />
                  <span className="text-sm font-medium text-foreground">{getStatusText(server.status)}</span>
                </div>

                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {server.command} {server.args.join(" ")}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {server.status === "running" ? (
                    <Button size="sm" variant="outline" className="flex-1 gap-2 bg-transparent">
                      <Square className="h-3.5 w-3.5" />
                      Stop
                    </Button>
                  ) : server.status === "error" ? (
                    <Button size="sm" variant="outline" className="flex-1 gap-2 bg-transparent">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Restart
                    </Button>
                  ) : (
                    <Button size="sm" variant="default" className="flex-1 gap-2">
                      <Play className="h-3.5 w-3.5" />
                      Start
                    </Button>
                  )}
                  {server.status === "error" && (
                    <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                      <FileText className="h-3.5 w-3.5" />
                      Logs
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="w-9 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="w-9 p-0 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
