"use client"

import { useState } from "react"
import { SkillsBrowser } from "./skills-browser"
import { SkillsEditor } from "./skills-editor"

export type Skill = {
  id: string
  name: string
  path: string
  type: "markdown" | "json" | "yaml"
  favorite?: boolean
  content: string
  description?: string
}

export function SkillsPanel() {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [skills] = useState<Skill[]>([
    {
      id: "1",
      name: "code-review.md",
      path: "Claude Code Skills/code-review.md",
      type: "markdown",
      favorite: true,
      description: "Review code for quality and best practices",
      content: `# Code Review

## Description
Review code for quality, security, and best practices.

## Instructions
1. Analyze code structure and patterns
2. Check for security vulnerabilities
3. Suggest improvements and optimizations
4. Ensure code follows best practices

## Examples
\`\`\`typescript
// Example code to review
function processData(data: any) {
  return data.map(item => item.value)
}
\`\`\``,
    },
    {
      id: "2",
      name: "git-commit.md",
      path: "Claude Code Skills/git-commit.md",
      type: "markdown",
      description: "Generate conventional commit messages",
      content: `# Git Commit Message Generator

## Description
Generate commit messages following Conventional Commits specification.

## Instructions
1. Analyze code changes
2. Determine commit type (feat, fix, docs, etc.)
3. Write clear, concise commit message
4. Include scope and breaking changes if needed`,
    },
    {
      id: "3",
      name: "filesystem-server.json",
      path: "MCP Configs/filesystem-server.json",
      type: "json",
      content: `{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
    }
  }
}`,
    },
  ])

  return (
    <div className="flex h-full">
      <SkillsBrowser skills={skills} selectedSkill={selectedSkill} onSelectSkill={setSelectedSkill} />
      <SkillsEditor skill={selectedSkill} />
    </div>
  )
}
