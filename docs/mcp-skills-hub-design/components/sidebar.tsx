"use client"

import { Button } from "@/components/ui/button"
import { FileCode2, Server, Sparkles, Settings, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"

interface SidebarProps {
  activeTab: "skills" | "mcp" | "ai" | "settings"
  onTabChange: (tab: "skills" | "mcp" | "ai" | "settings") => void
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { theme, setTheme } = useTheme()

  const tabs = [
    { id: "skills" as const, label: "Skills", icon: FileCode2 },
    { id: "mcp" as const, label: "MCP", icon: Server },
    { id: "ai" as const, label: "AI Assistant", icon: Sparkles },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ]

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-semibold text-sidebar-foreground">MCP Skills Hub</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Developer Toolkit</p>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={`w-full justify-start ${
                  activeTab === tab.id
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {tab.label}
              </Button>
            )
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full justify-start gap-2"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>
        <div className="text-xs text-sidebar-foreground/60">
          <div>Version 1.0.0</div>
          <div className="mt-1">Next.js + React</div>
        </div>
      </div>
    </aside>
  )
}
