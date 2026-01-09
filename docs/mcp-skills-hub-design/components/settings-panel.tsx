"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff } from "lucide-react"

export function SettingsPanel() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiProvider, setApiProvider] = useState("anthropic")

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border bg-card px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Configure your MCP Skills Hub preferences</p>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 max-w-3xl">
          <Card className="p-6 bg-card border-border">
            <h3 className="text-base font-semibold text-foreground mb-4">Path Configuration</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skills-path">Skills Directory</Label>
                <Input id="skills-path" placeholder="/path/to/skills" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mcp-path">MCP Config Path</Label>
                <Input
                  id="mcp-path"
                  placeholder="%APPDATA%/Claude/claude_desktop_config.json"
                  className="bg-background"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <h3 className="text-base font-semibold text-foreground mb-4">AI Configuration</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Default Provider</Label>
                <Select value={apiProvider} onValueChange={setApiProvider}>
                  <SelectTrigger id="provider" className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="ollama">Ollama (Local)</SelectItem>
                    <SelectItem value="custom">Custom API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {apiProvider === "anthropic" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="relative">
                      <Input
                        id="api-key"
                        type={showApiKey ? "text" : "password"}
                        placeholder="sk-ant-************************"
                        className="bg-background pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Select defaultValue="claude-3-5-sonnet">
                      <SelectTrigger id="model" className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claude-3-5-sonnet">claude-3-5-sonnet-20241022</SelectItem>
                        <SelectItem value="claude-3-opus">claude-3-opus-20240229</SelectItem>
                        <SelectItem value="claude-3-haiku">claude-3-haiku-20240307</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <h3 className="text-base font-semibold text-foreground mb-4">Appearance</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select defaultValue="dark">
                  <SelectTrigger id="theme" className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">Follow System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select defaultValue="zh-CN">
                  <SelectTrigger id="language" className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh-CN">中文</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline">Reset to Defaults</Button>
            <Button>Save Changes</Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
