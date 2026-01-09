<template>
  <div class="folder-item" :class="{ 'is-root': depth === 0, 'is-expanded': expandedFolders.has(folder.id) }">
    <!-- 文件夹头部 -->
    <button 
      class="folder-header" 
      :style="{ paddingLeft: `${depth * 16 + 12}px` }" 
      @click="$emit('toggle-folder', folder.id)"
      @contextmenu.prevent="$emit('folder-context-menu', $event, folder)"
    >
      <span class="folder-chevron-wrapper">
        <ChevronRight v-if="!expandedFolders.has(folder.id)" class="folder-chevron" />
        <ChevronDown v-else class="folder-chevron expanded" />
      </span>
      <span class="folder-icon-wrapper">
        <FolderOpen v-if="expandedFolders.has(folder.id)" class="folder-icon expanded" />
        <Folder v-else class="folder-icon" />
      </span>
      <span class="folder-name">{{ folder.name }}</span>
      <span v-if="totalItemCount > 0" class="folder-count">{{ totalItemCount }}</span>
    </button>

    <!-- 文件夹内容 -->
    <div v-if="expandedFolders.has(folder.id)" class="folder-content">
      <!-- 连接线 -->
      <div class="tree-line" :style="{ left: `${depth * 16 + 20}px` }"></div>
      
      <!-- 子文件夹 - 递归 -->
      <template v-for="subFolder in subFolders" :key="subFolder.id">
        <FolderTreeItem
          :folder="subFolder"
          :expanded-folders="expandedFolders"
          :selected-skill="selectedSkill"
          :highlighted-file-path="highlightedFilePath"
          :get-skills-in-folder="getSkillsInFolder"
          :get-sub-folders="getSubFolders"
          :depth="depth + 1"
          @toggle-folder="$emit('toggle-folder', $event)"
          @select-skill="$emit('select-skill', $event)"
          @folder-context-menu="(e, f) => $emit('folder-context-menu', e, f)"
          @file-context-menu="(e, f) => $emit('file-context-menu', e, f)"
        />
      </template>

      <!-- 当前文件夹的文件 -->
      <button
        v-for="skill in filesInFolder"
        :key="skill.id"
        class="skill-item"
        :class="{ 
          active: selectedSkill?.id === skill.id,
          'is-skill-md': isSkillMd(skill.name),
          'is-highlighted': isHighlighted(skill.path)
        }"
        :style="{ paddingLeft: `${(depth + 1) * 16 + 12}px` }"
        @click="$emit('select-skill', skill)"
        @contextmenu.prevent="$emit('file-context-menu', $event, skill)"
      >
        <!-- SKILL.md 特殊图标 -->
        <span v-if="isSkillMd(skill.name)" class="skill-badge">
          <Sparkles class="skill-badge-icon" />
        </span>
        <FileText v-else-if="getFileIconType(skill.type) === 'text'" class="file-icon" />
        <FileJson v-else-if="getFileIconType(skill.type) === 'json'" class="file-icon json" />
        <FileCode v-else-if="getFileIconType(skill.type) === 'code'" class="file-icon code" />
        <File v-else class="file-icon" />
        <span class="skill-name" :class="{ 'skill-md-name': isSkillMd(skill.name) }">{{ skill.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, FileJson, FileCode, File, Sparkles } from "lucide-vue-next";
import type { SkillFile, SkillFolder } from "@/utils/api";

defineOptions({
  name: "FolderTreeItem"
});

const props = defineProps<{
  folder: SkillFolder;
  expandedFolders: Set<string>;
  selectedSkill: SkillFile | null;
  highlightedFilePath?: string | null;
  getSkillsInFolder: (folderId: string | null) => SkillFile[];
  getSubFolders: (parentId: string | null) => SkillFolder[];
  depth: number;
}>();

defineEmits<{
  (e: "toggle-folder", folderId: string): void;
  (e: "select-skill", skill: SkillFile): void;
  (e: "folder-context-menu", event: MouseEvent, folder: SkillFolder): void;
  (e: "file-context-menu", event: MouseEvent, file: SkillFile): void;
}>();

const subFolders = computed(() => props.getSubFolders(props.folder.id));
const filesInFolder = computed(() => props.getSkillsInFolder(props.folder.id));
const totalItemCount = computed(() => subFolders.value.length + filesInFolder.value.length);

// Check if a file is highlighted (Requirement 14.7)
const isHighlighted = (filePath: string): boolean => {
  if (!props.highlightedFilePath) return false;
  const normalizedPath = filePath.replace(/\\/g, '/');
  const normalizedHighlight = props.highlightedFilePath.replace(/\\/g, '/');
  return normalizedPath === normalizedHighlight;
};

// 检查是否是 SKILL.md 文件
const isSkillMd = (name: string): boolean => {
  return name.toLowerCase() === 'skill.md';
};

// 根据文件类型返回图标类型
const getFileIconType = (type: string): 'text' | 'json' | 'code' | 'file' => {
  if (type === 'markdown' || type === 'text') return 'text';
  if (type === 'json') return 'json';
  if (['javascript', 'typescript', 'python', 'shell', 'vue', 'html', 'css', 'scss', 'less', 'sql', 'graphql', 'rust', 'go', 'java', 'kotlin', 'swift', 'c', 'cpp', 'csharp', 'ruby', 'php', 'perl', 'r', 'lua', 'dockerfile', 'makefile'].includes(type)) return 'code';
  return 'file';
};
</script>

<style lang="scss" scoped>
.folder-item {
  position: relative;
  
  &.is-root {
    margin-bottom: var(--space-1);
    
    > .folder-header {
      font-weight: 600;
    }
  }
  
  &.is-expanded > .folder-header {
    .folder-icon { color: var(--primary); }
  }
}

.folder-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: all 150ms ease;
  
  &:hover {
    background-color: var(--accent);
  }
}

.folder-chevron-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.folder-chevron {
  width: 14px;
  height: 14px;
  color: var(--muted-foreground);
  transition: transform 150ms ease;
  
  &.expanded {
    color: var(--primary);
  }
}

.folder-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.folder-icon {
  width: 16px;
  height: 16px;
  color: var(--muted-foreground);
  transition: color 150ms ease;
  
  &.expanded {
    color: var(--primary);
  }
}

.folder-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-count {
  font-size: 11px;
  color: var(--muted-foreground);
  background-color: var(--muted);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  font-weight: 500;
}

.folder-content {
  position: relative;
}

// 树形连接线
.tree-line {
  position: absolute;
  top: 0;
  bottom: 8px;
  width: 1px;
  background-color: var(--border);
  opacity: 0.5;
}

// 文件项
.skill-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: all 150ms ease;
  position: relative;
  
  &:hover {
    background-color: var(--accent);
  }
  
  &.active {
    background-color: oklch(0.65 0.22 270 / 0.15);
    
    .file-icon { color: var(--primary); }
    .skill-name { color: var(--primary); font-weight: 500; }
  }
  
  // AI-edited file highlight (Requirement 14.7)
  &.is-highlighted {
    background: linear-gradient(90deg, oklch(0.7 0.2 145 / 0.2) 0%, oklch(0.7 0.2 145 / 0.05) 100%);
    border-left: 2px solid oklch(0.7 0.2 145);
    animation: highlight-pulse 2s ease-in-out infinite;
    
    .file-icon { color: oklch(0.7 0.2 145); }
    .skill-name { color: oklch(0.7 0.2 145); font-weight: 500; }
    
    &:hover {
      background: linear-gradient(90deg, oklch(0.7 0.2 145 / 0.25) 0%, var(--accent) 100%);
    }
    
    &.active {
      background: linear-gradient(90deg, oklch(0.7 0.2 145 / 0.3) 0%, oklch(0.65 0.22 270 / 0.15) 100%);
    }
  }
  
  // SKILL.md 特殊样式
  &.is-skill-md {
    background: linear-gradient(90deg, oklch(0.65 0.22 270 / 0.08) 0%, transparent 100%);
    border-left: 2px solid var(--primary);
    margin-left: 2px;
    
    &:hover {
      background: linear-gradient(90deg, oklch(0.65 0.22 270 / 0.15) 0%, var(--accent) 100%);
    }
    
    &.active {
      background: linear-gradient(90deg, oklch(0.65 0.22 270 / 0.2) 0%, oklch(0.65 0.22 270 / 0.1) 100%);
    }
  }
}

// Highlight pulse animation (Requirement 14.7)
@keyframes highlight-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

// SKILL.md 徽章
.skill-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, var(--primary) 0%, oklch(0.6 0.25 300) 100%);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.skill-badge-icon {
  width: 12px;
  height: 12px;
  color: white;
}

.file-icon {
  width: 14px;
  height: 14px;
  color: var(--muted-foreground);
  flex-shrink: 0;
  
  &.json { color: #f59e0b; }
  &.code { color: #10b981; }
}

.skill-name {
  flex: 1;
  font-size: 13px;
  color: var(--foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  &.skill-md-name {
    font-weight: 600;
    color: var(--primary);
  }
}
</style>
