"use client"

import { useState } from "react"
import { SkillsPanel } from "./skills-panel"
import { MCPPanel } from "./mcp-panel"
import { AIPanel } from "./ai-panel"
import { SettingsPanel } from "./settings-panel"
import { Sidebar } from "./sidebar"

export function MainLayout() {
  const [activeTab, setActiveTab] = useState<"skills" | "mcp" | "ai" | "settings">("skills")

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-hidden">
        {activeTab === "skills" && <SkillsPanel />}
        {activeTab === "mcp" && <MCPPanel />}
        {activeTab === "ai" && <AIPanel />}
        {activeTab === "settings" && <SettingsPanel />}
      </main>
    </div>
  )
}
