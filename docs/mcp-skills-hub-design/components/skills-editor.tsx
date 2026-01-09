"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Eye, Save, Play } from "lucide-react"
import type { Skill } from "./skills-panel"
import { ScrollArea } from "@/components/ui/scroll-area"
import ReactMarkdown from "react-markdown"

interface SkillsEditorProps {
  skill: Skill | null
}

export function SkillsEditor({ skill }: SkillsEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [content, setContent] = useState(skill?.content || "")

  if (!skill) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-medium text-foreground">No skill selected</h3>
            <p className="text-sm text-muted-foreground mt-1">Select a skill from the browser to start editing</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-foreground">{skill.name}</h2>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
            <TabsList className="h-8">
              <TabsTrigger value="edit" className="text-xs">
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs">
                <Eye className="h-3 w-3 mr-1.5" />
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-2 bg-transparent">
            <Sparkles className="h-3.5 w-3.5" />
            AI Optimize
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-2 bg-transparent">
            <Play className="h-3.5 w-3.5" />
            Test
          </Button>
          <Button size="sm" className="h-8 gap-2">
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "edit" ? (
          <div className="h-full">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full p-4 bg-background text-foreground font-mono text-sm resize-none focus:outline-none"
              placeholder="Start writing your skill..."
              style={{ tabSize: 2 }}
            />
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-6 prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

function FileText({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}
