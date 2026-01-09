"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, ChevronRight, ChevronDown, Folder, FolderOpen, FileText, FileJson, Star } from "lucide-react"
import type { Skill, SkillFolder } from "./skills-panel"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SkillsBrowserProps {
  skills: Skill[]
  folders: SkillFolder[]
  selectedSkill: Skill | null
  onSelectSkill: (skill: Skill) => void
}

export function SkillsBrowser({ skills, folders, selectedSkill, onSelectSkill }: SkillsBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["1", "2"]))

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const buildTree = () => {
    if (!folders || folders.length === 0) {
      return []
    }

    const tree: Map<string, SkillFolder> = new Map()
    const rootFolders: SkillFolder[] = []

    folders.forEach((folder) => {
      tree.set(folder.id, { ...folder, children: [] })
    })

    folders.forEach((folder) => {
      if (folder.parentId) {
        const parent = tree.get(folder.parentId)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(tree.get(folder.id)!)
        }
      } else {
        rootFolders.push(tree.get(folder.id)!)
      }
    })

    return rootFolders
  }

  const getIcon = (type: Skill["type"]) => {
    switch (type) {
      case "markdown":
        return FileText
      case "json":
      case "yaml":
        return FileJson
      default:
        return FileText
    }
  }

  const renderFolder = (folder: SkillFolder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const folderSkills = skills.filter((s) => s.folderId === folder.id)
    const hasContent = folderSkills.length > 0 || (folder.children && folder.children.length > 0)

    return (
      <div key={folder.id}>
        <button
          onClick={() => toggleFolder(folder.id)}
          className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-foreground flex items-center gap-2 group"
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          {hasContent && (
            <span className="flex-shrink-0">
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </span>
          )}
          {!hasContent && <span className="w-3.5" />}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{folder.name}</span>
          <span className="text-xs text-muted-foreground ml-auto">{folderSkills.length}</span>
        </button>

        {isExpanded && (
          <div>
            {folder.children && folder.children.map((childFolder) => renderFolder(childFolder, level + 1))}
            {folderSkills.map((skill) => {
              const Icon = getIcon(skill.type)
              return (
                <button
                  key={skill.id}
                  onClick={() => onSelectSkill(skill)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 group ${
                    selectedSkill?.id === skill.id ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground"
                  }`}
                  style={{ paddingLeft: `${28 + (level + 1) * 16}px` }}
                >
                  <Icon
                    className={`h-3.5 w-3.5 flex-shrink-0 ${
                      selectedSkill?.id === skill.id ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-sm truncate flex-1">{skill.name}</span>
                  {skill.favorite && <Star className="h-3 w-3 fill-warning text-warning flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const tree = buildTree()
  const rootSkills = skills?.filter((s) => !s.folderId) || []

  return (
    <div className="w-80 border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Skills Browser</h2>
          <Button size="sm" className="h-8 gap-2">
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background border-border"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {tree.map((folder) => renderFolder(folder))}
          {rootSkills.map((skill) => {
            const Icon = getIcon(skill.type)
            return (
              <button
                key={skill.id}
                onClick={() => onSelectSkill(skill)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 group ${
                  selectedSkill?.id === skill.id ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 flex-shrink-0 ${
                    selectedSkill?.id === skill.id ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span className="text-sm truncate flex-1">{skill.name}</span>
                {skill.favorite && <Star className="h-3 w-3 fill-warning text-warning flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
