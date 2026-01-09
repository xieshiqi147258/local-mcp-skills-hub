"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Send, User, Bot, FileCode2, Eye, Edit, Wand2 } from "lucide-react"
import type { Skill } from "./skills-panel"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  skillContext?: Skill
}

interface AIPanelProps {
  currentSkill?: Skill | null
}

export function AIPanel({ currentSkill }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I can help you work with your Skills. I can read, analyze, optimize, and modify entire skill packages. Select a skill from the browser or describe what you'd like to create.",
    },
  ])
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      skillContext: currentSkill || undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: currentSkill
          ? `I've analyzed "${currentSkill.name}". Here are my suggestions for improvement...`
          : "I can help you create a new skill or optimize an existing one. What would you like to do?",
      }
      setMessages((prev) => [...prev, assistantMessage])
    }, 1000)
  }

  const quickActions = [
    { label: "Optimize Skill", icon: Wand2, action: "optimize" },
    { label: "Add Examples", icon: FileCode2, action: "examples" },
    { label: "Review Quality", icon: Eye, action: "review" },
    { label: "Refactor", icon: Edit, action: "refactor" },
  ]

  const handleQuickAction = (action: string) => {
    if (!currentSkill) return
    setInput(`${action} the current skill: ${currentSkill.name}`)
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">AI Assistant</h2>
              <p className="text-sm text-muted-foreground">Powered by Claude</p>
            </div>
          </div>
          {currentSkill && (
            <Badge variant="outline" className="gap-2">
              <FileCode2 className="h-3 w-3" />
              {currentSkill.name}
            </Badge>
          )}
        </div>

        {currentSkill && (
          <div className="mt-4 flex items-center gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.action}
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickAction(action.action)}
                  className="gap-2 h-8"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {action.label}
                </Button>
              )
            })}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-4 ${message.role === "user" ? "justify-end" : ""}`}>
              {message.role === "assistant" && (
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="flex flex-col gap-2 max-w-[80%]">
                <Card className={`p-4 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </Card>
                {message.skillContext && message.role === "user" && (
                  <Badge variant="secondary" className="w-fit gap-2 text-xs">
                    <FileCode2 className="h-3 w-3" />
                    Context: {message.skillContext.name}
                  </Badge>
                )}
              </div>
              {message.role === "user" && (
                <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-border bg-card p-4">
        <div className="max-w-3xl mx-auto">
          {!currentSkill && (
            <p className="text-xs text-muted-foreground mb-3 text-center">
              Select a skill from the browser to work with it, or ask me to create a new one
            </p>
          )}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                currentSkill ? `Ask about "${currentSkill.name}"...` : "Ask me anything about your skills..."
              }
              className="flex-1 bg-background"
            />
            <Button onClick={handleSend} className="gap-2">
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
