<template>
  <div class="skills-panel">
    <!-- 头部 - 与 McpView 风格一致 -->
    <div class="panel-header">
      <div class="header-content">
        <div>
          <h2 class="header-title">{{ t('skills.title') }}</h2>
          <p class="header-subtitle">{{ t('skills.subtitle') }}</p>
        </div>
        <div class="header-actions">
          <button class="btn-add" @click="showCreateDialog = true" :disabled="!skillsStore.skillsPath">
            <Plus class="btn-icon" />
            {{ t('skills.new') }}
          </button>
          <!-- AI Toggle Button (Requirement 4.2, 4.3, 4.4) -->
          <button 
            class="btn-ai-toggle" 
            :class="{ active: aiStore.isPanelOpen }"
            @click="toggleAiPanel"
            :title="t('titlebar.aiAssistant')"
          >
            <Bot class="btn-icon" />
            <span class="btn-text">{{ t('nav.ai') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 内容区域 (Requirement 1.4, 1.5) -->
    <div class="skills-content" :class="{ 'ai-panel-open': aiStore.isPanelOpen }">
      <!-- 左侧文件浏览器 -->
      <div class="skills-browser">

        <!-- 加载状态 -->
      <div v-if="skillsStore.loading" class="loading-state">
        <Loader2 class="loading-icon" />
        <span>{{ t('skills.loading') }}</span>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="skillsStore.error" class="error-state">
        <AlertCircle class="error-icon" />
        <span>{{ skillsStore.error }}</span>
        <button class="btn-retry" @click="skillsStore.loadSkills()">{{ t('mcp.retry') }}</button>
      </div>

      <!-- 空状态 - 未设置路径 -->
      <div v-else-if="!skillsStore.skillsPath" class="empty-state">
        <FolderOpen class="empty-icon" />
        <h3 class="empty-title">{{ t('skills.noFolder') }}</h3>
        <p class="empty-description">{{ t('skills.noFolderDesc') }}</p>
        <RouterLink to="/settings" class="btn-primary">
          <Settings class="btn-icon" />
          {{ t('skills.goToSettings') }}
        </RouterLink>
      </div>

      <!-- 空状态 - 无文件 -->
      <div v-else-if="skillsStore.folders.length === 0 && skillsStore.files.length === 0" class="empty-state">
        <FileText class="empty-icon" />
        <h3 class="empty-title">{{ t('skills.noSkills') }}</h3>
        <p class="empty-description">{{ t('skills.noSkillsDesc') }}</p>
      </div>

      <!-- 文件浏览器内容 -->
      <div v-else class="browser-content">
        <div class="path-toolbar">
          <div class="current-path" :title="skillsStore.skillsPath">
            <FolderOpen class="path-icon" />
            <span class="path-text">{{ truncatedPath }}</span>
          </div>
          <button class="path-action" @click="showNewFolderDialog(null)" :title="t('skills.newFolder')">
            <FolderPlus class="action-icon" />
          </button>
        </div>
        
        <div class="folder-list">
          <!-- 根目录文件 -->
          <div v-if="filteredRootFiles.length > 0" class="root-files">
            <button 
              v-for="skill in filteredRootFiles" 
              :key="skill.id" 
              class="skill-item" 
              :class="{ 
                active: skillsStore.selectedSkill?.id === skill.id,
                'is-skill-md': skill.name.toLowerCase() === 'skill.md',
                'is-highlighted': isFileHighlighted(skill.path)
              }" 
              @click="handleSelectSkill(skill)"
              @contextmenu.prevent="showFileContextMenu($event, skill)"
            >
              <span v-if="skill.name.toLowerCase() === 'skill.md'" class="skill-badge">
                <Sparkles class="skill-badge-icon" />
              </span>
              <FileText v-else-if="skill.type === 'markdown'" class="file-icon" />
              <FileJson v-else-if="skill.type === 'json'" class="file-icon json" />
              <FileCode v-else class="file-icon code" />
              <span class="skill-name" :class="{ 'skill-md-name': skill.name.toLowerCase() === 'skill.md' }">{{ skill.name }}</span>
            </button>
          </div>

          <!-- 文件夹 - 递归渲染 -->
          <template v-for="folder in filteredFolders" :key="folder.id">
            <FolderTreeItem
              :folder="folder"
              :expanded-folders="expandedFolders"
              :selected-skill="skillsStore.selectedSkill"
              :highlighted-file-path="skillsStore.highlightedFilePath"
              :get-skills-in-folder="getSkillsInFolder"
              :get-sub-folders="getSubFolders"
              :depth="0"
              @toggle-folder="toggleFolder"
              @select-skill="handleSelectSkill"
              @folder-context-menu="showFolderContextMenu"
              @file-context-menu="showFileContextMenu"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- 右侧编辑器 -->
    <div class="skills-editor">
      <template v-if="skillsStore.selectedSkill">
        <div class="editor-header">
          <div class="header-left">
            <h2 class="editor-title">{{ skillsStore.selectedSkill.name }}</h2>
            <div class="tabs-list">
              <button class="tabs-trigger" :class="{ active: activeTab === 'edit' }" @click="activeTab = 'edit'">{{ t('skills.edit') }}</button>
              <button class="tabs-trigger" :class="{ active: activeTab === 'preview' }" @click="activeTab = 'preview'">
                <Eye class="tab-icon" />
                {{ t('skills.preview') }}
              </button>
            </div>
          </div>
          <div class="header-actions">
            <!-- AI File Actions -->
            <div class="ai-file-actions" v-if="aiStore.isPanelOpen">
              <button 
                class="ai-action-btn" 
                @click="handleAiFileAction('explain')"
                :title="t('aiContext.actions.explain')"
              >
                <MessageSquare class="action-icon" />
                {{ t('aiContext.actions.explain') }}
              </button>
              <button 
                class="ai-action-btn" 
                @click="handleAiFileAction('optimize')"
                :title="t('aiContext.actions.optimize')"
              >
                <Zap class="action-icon" />
                {{ t('aiContext.actions.optimize') }}
              </button>
              <button 
                class="ai-action-btn" 
                @click="handleAiFileAction('addComments')"
                :title="t('aiContext.actions.addComments')"
              >
                <MessageCircle class="action-icon" />
                {{ t('aiContext.actions.addComments') }}
              </button>
            </div>
            <button class="action-btn" @click="handleDelete" :title="t('skills.delete')">
              <Trash2 class="action-icon" />
            </button>
            <button class="action-btn primary" @click="handleSave" :disabled="!hasChanges">
              <Save class="action-icon" />
              {{ t('skills.save') }}
            </button>
          </div>
        </div>

        <div class="editor-content">
          <textarea 
            v-if="activeTab === 'edit'" 
            ref="editorRef"
            v-model="editorContent" 
            class="code-editor" 
            placeholder="Start writing your skill..." 
            @input="hasChanges = true"
            @mouseup="handleEditorMouseUp"
            @select="handleTextSelect"
          ></textarea>
          <div v-else class="preview-content">
            <div class="markdown-preview" v-html="renderedContent"></div>
          </div>
        </div>

        <!-- Text Selection Menu (Requirement 6.1, 6.2) -->
        <TextSelectionMenu
          :visible="textSelectionMenu.visible"
          :position="textSelectionMenu.position"
          :selected-text="textSelectionMenu.selectedText"
          @send-to-ai="handleSendSelectedTextToAi"
          @close="hideTextSelectionMenu"
        />
      </template>

      <template v-else>
        <div class="empty-state">
          <FileText class="empty-icon" />
          <h3 class="empty-title">{{ t('skills.noSelected') }}</h3>
          <p class="empty-description">{{ t('skills.noSelectedDesc') }}</p>
        </div>
      </template>
    </div>

    <!-- AI Sidebar Panel - Embedded in content area (Requirement 1.2, 1.4, 1.5) -->
    <AiSidebarPanel
      :is-open="aiStore.isPanelOpen"
      :selected-text="selectedTextForAi"
      :current-skill-name="skillsStore.selectedSkill?.name"
      :initial-message="pendingAiMessage"
      @toggle="toggleAiPanel"
      @close="closeAiPanel"
      @message-sent="clearPendingAiMessage"
    />
    
    <!-- Mobile Overlay Backdrop (Requirement 5.1) - Only for mobile -->
    <Transition name="fade">
      <div 
        v-if="aiStore.isPanelOpen && isMobile" 
        class="ai-panel-backdrop"
        @click="closeAiPanel"
      ></div>
    </Transition>
    </div>

    <!-- 创建对话框 -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click.self="showCreateDialog = false">
      <div class="dialog">
        <h3 class="dialog-title">{{ t('skills.createNew') }}</h3>
        <div class="form-group">
          <label class="form-label">{{ t('skills.fileName') }}</label>
          <input v-model="newFileName" type="text" class="form-input" placeholder="my-skill.md" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('skills.fileType') }}</label>
          <select v-model="newFileType" class="form-select">
            <option value="markdown">Markdown (.md)</option>
            <option value="json">JSON (.json)</option>
            <option value="yaml">YAML (.yaml)</option>
          </select>
        </div>
        <div class="dialog-actions">
          <button class="btn-secondary" @click="showCreateDialog = false">{{ t('skills.cancel') }}</button>
          <button class="btn-primary" @click="handleCreate">{{ t('skills.create') }}</button>
        </div>
      </div>
    </div>

    <!-- 新建文件夹对话框 -->
    <div v-if="showFolderDialog" class="dialog-overlay" @click.self="showFolderDialog = false">
      <div class="dialog">
        <h3 class="dialog-title">{{ t('skills.newFolder') }}</h3>
        <div class="form-group">
          <label class="form-label">{{ t('skills.folderName') }}</label>
          <input v-model="newFolderName" type="text" class="form-input" placeholder="new-folder" @keyup.enter="handleCreateFolder" />
        </div>
        <div class="dialog-actions">
          <button class="btn-secondary" @click="showFolderDialog = false">{{ t('skills.cancel') }}</button>
          <button class="btn-primary" @click="handleCreateFolder">{{ t('skills.create') }}</button>
        </div>
      </div>
    </div>

    <!-- 新建文件对话框（在文件夹中） -->
    <div v-if="showNewFileInFolderDialog" class="dialog-overlay" @click.self="showNewFileInFolderDialog = false">
      <div class="dialog">
        <h3 class="dialog-title">{{ t('skills.newFile') }}</h3>
        <div class="form-group">
          <label class="form-label">{{ t('skills.fileName') }}</label>
          <input v-model="newFileInFolderName" type="text" class="form-input" placeholder="new-file.md" @keyup.enter="handleCreateFileInFolder" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('skills.fileType') }}</label>
          <select v-model="newFileInFolderType" class="form-select">
            <option value="markdown">Markdown (.md)</option>
            <option value="json">JSON (.json)</option>
            <option value="yaml">YAML (.yaml)</option>
          </select>
        </div>
        <div class="dialog-actions">
          <button class="btn-secondary" @click="showNewFileInFolderDialog = false">{{ t('skills.cancel') }}</button>
          <button class="btn-primary" @click="handleCreateFileInFolder">{{ t('skills.create') }}</button>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteDialog" class="dialog-overlay" @click.self="showDeleteDialog = false">
      <div class="dialog delete-dialog">
        <div class="delete-dialog-icon">
          <AlertTriangle class="warning-icon" />
        </div>
        <h3 class="dialog-title">{{ t('skills.confirmDeleteTitle') }}</h3>
        <p class="delete-dialog-message">{{ t('skills.confirmDelete', { name: deleteTargetName }) }}</p>
        <div class="dialog-actions">
          <button class="btn-secondary" @click="showDeleteDialog = false">{{ t('skills.cancel') }}</button>
          <button class="btn-danger" @click="confirmDelete">{{ t('skills.delete') }}</button>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div v-if="contextMenu.show" class="context-menu" :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }">
        <template v-if="contextMenu.type === 'file'">
          <button class="context-menu-item" @click="handleCopyContent">
            <Copy class="context-menu-icon" />
            <span>{{ t('skills.copyContent') }}</span>
          </button>
          <div class="context-menu-divider"></div>
          <button class="context-menu-item" @click="handleCopy">
            <Copy class="context-menu-icon" />
            <span>{{ t('skills.copy') }}</span>
          </button>
          <button class="context-menu-item" @click="handleCut">
            <Scissors class="context-menu-icon" />
            <span>{{ t('skills.cut') }}</span>
          </button>
          <div class="context-menu-divider"></div>
          <button class="context-menu-item danger" @click="handleDeleteItem">
            <Trash2 class="context-menu-icon" />
            <span>{{ t('skills.delete') }}</span>
          </button>
        </template>
        <template v-else>
          <button class="context-menu-item" @click="showNewFileDialog((contextMenu.target as any)?.path)">
            <FilePlus class="context-menu-icon" />
            <span>{{ t('skills.newFile') }}</span>
          </button>
          <button class="context-menu-item" @click="showNewFolderDialog((contextMenu.target as any)?.path)">
            <FolderPlus class="context-menu-icon" />
            <span>{{ t('skills.newSubfolder') }}</span>
          </button>
          <div class="context-menu-divider"></div>
          <button class="context-menu-item" @click="handleCopy">
            <Copy class="context-menu-icon" />
            <span>{{ t('skills.copy') }}</span>
          </button>
          <button class="context-menu-item" @click="handleCut">
            <Scissors class="context-menu-icon" />
            <span>{{ t('skills.cut') }}</span>
          </button>
          <button v-if="clipboard" class="context-menu-item" @click="handlePaste">
            <ClipboardPaste class="context-menu-icon" />
            <span>{{ t('skills.paste') }}</span>
          </button>
          <div class="context-menu-divider"></div>
          <button class="context-menu-item danger" @click="handleDeleteItem">
            <Trash2 class="context-menu-icon" />
            <span>{{ t('skills.delete') }}</span>
          </button>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { Plus, FolderOpen, FileText, FileJson, FileCode, Eye, Save, Trash2, Loader2, AlertCircle, AlertTriangle, Settings, Sparkles, FolderPlus, FilePlus, Copy, Scissors, ClipboardPaste, Bot, MessageSquare, Zap, MessageCircle } from "lucide-vue-next";
import { RouterLink } from "vue-router";
import { useSkillsStore } from "@/stores";
import { useAiStore } from "@/stores/ai";
import { useI18n } from "@/i18n";
import type { SkillFile } from "@/utils/api";
import FolderTreeItem from "@/components/FolderTreeItem.vue";
import AiSidebarPanel from "@/components/ai/AiSidebarPanel.vue";
import TextSelectionMenu from "@/components/ai/TextSelectionMenu.vue";

const skillsStore = useSkillsStore();
const aiStore = useAiStore();
const { t } = useI18n();

const activeTab = ref<"edit" | "preview">("edit");
const editorContent = ref("");
const expandedFolders = ref<Set<string>>(new Set());
const hasChanges = ref(false);
const selectedTextForAi = ref("");
const pendingAiMessage = ref<string | null>(null);

// Mobile detection for overlay mode
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value < 768);

// Text selection menu state (Requirement 6.1, 6.6)
const textSelectionMenu = ref({
  visible: false,
  position: { x: 0, y: 0 },
  selectedText: '',
});
const editorRef = ref<HTMLTextAreaElement | null>(null);

const showCreateDialog = ref(false);
const newFileName = ref("");
const newFileType = ref<"markdown" | "json" | "yaml">("markdown");

const filteredFolders = computed(() => {
  return skillsStore.rootFolders;
});

const filteredRootFiles = computed(() => {
  return skillsStore.getSkillsInFolder(null);
});

const getSkillsInFolder = (folderId: string | null) => {
  return skillsStore.getSkillsInFolder(folderId);
};

const getSubFolders = (parentId: string | null) => {
  return skillsStore.getSubFolders(parentId);
};

// Check if a file is highlighted (Requirement 14.7)
const isFileHighlighted = (filePath: string): boolean => {
  return skillsStore.isFileHighlighted(filePath);
};

// AI Panel toggle functions (Requirement 4.3)
const toggleAiPanel = () => {
  aiStore.togglePanel();
};

const closeAiPanel = () => {
  aiStore.closePanel();
};

// Text selection handlers (Requirement 6.1, 6.6)
const handleTextSelect = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement;
  const selectedText = textarea.value.substring(
    textarea.selectionStart,
    textarea.selectionEnd
  );
  
  if (selectedText && selectedText.trim().length > 0) {
    // Get selection position for menu placement
    const rect = textarea.getBoundingClientRect();
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
    
    // Calculate approximate position based on selection
    const textBeforeSelection = textarea.value.substring(0, textarea.selectionStart);
    const lines = textBeforeSelection.split('\n');
    const currentLine = lines.length;
    
    // Position menu near the selection
    const x = rect.left + rect.width / 2;
    const y = rect.top + Math.min(currentLine * lineHeight, rect.height / 2);
    
    textSelectionMenu.value = {
      visible: true,
      position: { x, y },
      selectedText: selectedText.trim(),
    };
  } else {
    hideTextSelectionMenu();
  }
};

const handleEditorMouseUp = (event: MouseEvent) => {
  const textarea = event.target as HTMLTextAreaElement;
  const selectedText = textarea.value.substring(
    textarea.selectionStart,
    textarea.selectionEnd
  );
  
  if (selectedText && selectedText.trim().length > 0) {
    // Use mouse position for more accurate menu placement
    textSelectionMenu.value = {
      visible: true,
      position: { x: event.clientX, y: event.clientY - 10 },
      selectedText: selectedText.trim(),
    };
  }
};

const hideTextSelectionMenu = () => {
  textSelectionMenu.value = {
    ...textSelectionMenu.value,
    visible: false,
  };
};

// Handle click outside to dismiss text selection menu (Requirement 6.6)
const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  // Don't hide if clicking on the menu itself
  if (target.closest('.text-selection-menu')) {
    return;
  }
  // Hide menu when clicking elsewhere
  if (textSelectionMenu.value.visible) {
    hideTextSelectionMenu();
  }
};

// Handle "Send to AI" from text selection menu (Requirement 6.3, 6.4, 6.5)
// This will be fully implemented in task 7.3
const handleSendSelectedTextToAi = (text: string) => {
  // Open AI panel if closed (Requirement 6.3)
  if (!aiStore.isPanelOpen) {
    aiStore.openPanel();
  }
  // Set selected text for AI context (Requirement 6.4)
  selectedTextForAi.value = text;
  aiStore.setSelectedText(text);
  // Hide the selection menu
  hideTextSelectionMenu();
};

// Handle AI file actions (explain, optimize, add comments)
const handleAiFileAction = (action: string) => {
  if (!skillsStore.selectedSkill) return;
  
  const fileName = skillsStore.selectedSkill.name;
  const actionPrompts: Record<string, string> = {
    explain: `请解释这个文件的内容:\n\n文件名: ${fileName}\n\n\`\`\`\n${editorContent.value}\n\`\`\``,
    optimize: `请优化这个文件的代码:\n\n文件名: ${fileName}\n\n\`\`\`\n${editorContent.value}\n\`\`\``,
    addComments: `请为这个文件添加详细的注释:\n\n文件名: ${fileName}\n\n\`\`\`\n${editorContent.value}\n\`\`\``
  };
  
  const prompt = actionPrompts[action] || `${action}: ${fileName}`;
  pendingAiMessage.value = prompt;
};

// Clear pending AI message after it's sent
const clearPendingAiMessage = () => {
  pendingAiMessage.value = null;
};

const toggleFolder = (folderId: string) => {
  const newSet = new Set(expandedFolders.value);
  if (newSet.has(folderId)) {
    newSet.delete(folderId);
  } else {
    newSet.add(folderId);
  }
  expandedFolders.value = newSet;
};

const handleSelectSkill = async (skill: SkillFile) => {
  if (hasChanges.value) {
    const confirm = window.confirm(t('skills.unsavedChanges'));
    if (!confirm) return;
  }
  await skillsStore.selectSkill(skill);
  editorContent.value = skill.content;
  hasChanges.value = false;
};

watch(() => skillsStore.selectedSkill, (skill) => {
  if (skill) {
    editorContent.value = skill.content;
    hasChanges.value = false;
  }
});

// Watch for highlighted file changes to auto-expand folders (Requirement 14.7)
watch(() => skillsStore.highlightedFilePath, (filePath) => {
  if (filePath) {
    // Get all parent folder IDs and expand them
    const parentIds = skillsStore.getParentFolderIds(filePath);
    parentIds.forEach(folderId => {
      expandedFolders.value.add(folderId);
    });
  }
});

const handleSave = async () => {
  if (!skillsStore.selectedSkill) return;
  try {
    await skillsStore.saveSkill(skillsStore.selectedSkill, editorContent.value);
    hasChanges.value = false;
  } catch (e) {
    console.error("Failed to save:", e);
  }
};

const handleDelete = async () => {
  if (!skillsStore.selectedSkill) return;
  const confirm = window.confirm(t('skills.confirmDelete', { name: skillsStore.selectedSkill.name }));
  if (!confirm) return;
  try {
    await skillsStore.deleteItem(skillsStore.selectedSkill.path);
    editorContent.value = "";
    hasChanges.value = false;
  } catch (e) {
    console.error("Failed to delete:", e);
  }
};

const handleCreate = async () => {
  if (!newFileName.value.trim()) return;
  let fileName = newFileName.value.trim();
  const extensions: Record<string, string> = { markdown: ".md", json: ".json", yaml: ".yaml" };
  const ext = extensions[newFileType.value];
  if (!fileName.endsWith(ext)) fileName += ext;
  try {
    await skillsStore.createNewFile(skillsStore.skillsPath, fileName, getDefaultContent(newFileType.value));
    showCreateDialog.value = false;
    newFileName.value = "";
  } catch (e) {
    console.error("Failed to create file:", e);
  }
};

const getDefaultContent = (type: string): string => {
  switch (type) {
    case "markdown": return `# New Skill\n\n## Description\nDescribe what this skill does.\n\n## Instructions\n1. Step one\n2. Step two\n\n## Examples\nAdd examples here.\n`;
    case "json": return `{\n  "name": "new-skill",\n  "description": "Describe what this skill does"\n}`;
    case "yaml": return `name: new-skill\ndescription: Describe what this skill does\n`;
    default: return "";
  }
};

// 路径截断显示
const truncatedPath = computed(() => {
  const path = skillsStore.skillsPath;
  if (!path) return '';
  const parts = path.replace(/\\/g, '/').split('/');
  if (parts.length <= 2) return path;
  const lastTwo = parts.slice(-2).join('/');
  return `.../${lastTwo}`;
});

// 右键菜单状态
interface ClipboardItem {
  type: 'file' | 'folder';
  path: string;
  name: string;
  action: 'copy' | 'cut';
  content?: string; // 文件内容（仅文件）
}

const contextMenu = ref<{ 
  show: boolean; 
  x: number; 
  y: number; 
  type: 'file' | 'folder'; 
  target: SkillFile | { id: string; path: string; name: string } | null 
}>({
  show: false, x: 0, y: 0, type: 'file', target: null
});

const clipboard = ref<ClipboardItem | null>(null);

// 新建文件夹对话框
const showFolderDialog = ref(false);
const newFolderName = ref("");
const newFolderParentPath = ref<string | null>(null);

// 在文件夹中新建文件对话框
const showNewFileInFolderDialog = ref(false);
const newFileInFolderName = ref("");
const newFileInFolderType = ref<"markdown" | "json" | "yaml">("markdown");
const newFileInFolderPath = ref<string | null>(null);

// 删除确认对话框
const showDeleteDialog = ref(false);
const deleteTargetPath = ref<string>("");
const deleteTargetName = ref<string>("");

const showFileContextMenu = (event: MouseEvent, file: SkillFile) => {
  contextMenu.value = { show: true, x: event.clientX, y: event.clientY, type: 'file', target: file };
};

const showFolderContextMenu = (event: MouseEvent, folder: { id: string; path: string; name: string }) => {
  contextMenu.value = { show: true, x: event.clientX, y: event.clientY, type: 'folder', target: folder };
};

const hideContextMenu = () => {
  contextMenu.value = { ...contextMenu.value, show: false };
};

// 新建文件夹
const showNewFolderDialog = (parentPath: string | null) => {
  newFolderParentPath.value = parentPath || skillsStore.skillsPath;
  newFolderName.value = "";
  showFolderDialog.value = true;
  hideContextMenu();
};

const handleCreateFolder = async () => {
  if (!newFolderName.value.trim() || !newFolderParentPath.value) return;
  try {
    await skillsStore.createNewFolder(newFolderParentPath.value, newFolderName.value.trim());
    showFolderDialog.value = false;
    newFolderName.value = "";
  } catch (e) {
    console.error("Failed to create folder:", e);
  }
};

// 在文件夹中新建文件
const showNewFileDialog = (folderPath: string) => {
  newFileInFolderPath.value = folderPath;
  newFileInFolderName.value = "";
  newFileInFolderType.value = "markdown";
  showNewFileInFolderDialog.value = true;
  hideContextMenu();
};

const handleCreateFileInFolder = async () => {
  if (!newFileInFolderName.value.trim() || !newFileInFolderPath.value) return;
  let fileName = newFileInFolderName.value.trim();
  const extensions: Record<string, string> = { markdown: ".md", json: ".json", yaml: ".yaml" };
  const ext = extensions[newFileInFolderType.value];
  if (!fileName.endsWith(ext)) fileName += ext;
  try {
    await skillsStore.createNewFile(newFileInFolderPath.value, fileName, getDefaultContent(newFileInFolderType.value));
    showNewFileInFolderDialog.value = false;
    newFileInFolderName.value = "";
  } catch (e) {
    console.error("Failed to create file:", e);
  }
};

// 复制文件内容到剪贴板
const handleCopyContent = async () => {
  if (!contextMenu.value.target || contextMenu.value.type !== 'file') return;
  const file = contextMenu.value.target as SkillFile;
  try {
    await navigator.clipboard.writeText(file.content);
    hideContextMenu();
  } catch (e) {
    console.error("Failed to copy content:", e);
  }
};

// 复制文件/文件夹（准备粘贴）
const handleCopy = () => {
  if (!contextMenu.value.target) return;
  const target = contextMenu.value.target;
  clipboard.value = {
    type: contextMenu.value.type,
    path: target.path,
    name: target.name,
    action: 'copy',
    content: contextMenu.value.type === 'file' ? (target as SkillFile).content : undefined
  };
  hideContextMenu();
};

// 剪切文件/文件夹
const handleCut = () => {
  if (!contextMenu.value.target) return;
  const target = contextMenu.value.target;
  clipboard.value = {
    type: contextMenu.value.type,
    path: target.path,
    name: target.name,
    action: 'cut',
    content: contextMenu.value.type === 'file' ? (target as SkillFile).content : undefined
  };
  hideContextMenu();
};

// 粘贴
const handlePaste = async () => {
  if (!clipboard.value || !contextMenu.value.target) return;
  const targetFolder = contextMenu.value.target as { path: string };
  
  try {
    const isFolder = clipboard.value.type === 'folder';
    
    if (clipboard.value.action === 'cut') {
      // 剪切 = 移动
      await skillsStore.moveItemToPath(clipboard.value.path, targetFolder.path, clipboard.value.name);
      clipboard.value = null;
    } else {
      // 复制
      await skillsStore.copyItemToPath(clipboard.value.path, targetFolder.path, clipboard.value.name, isFolder);
    }
    hideContextMenu();
  } catch (e) {
    console.error("Failed to paste:", e);
  }
};

// 删除 - 显示确认对话框
const handleDeleteItem = () => {
  if (!contextMenu.value.target) return;
  const target = contextMenu.value.target;
  deleteTargetPath.value = target.path;
  deleteTargetName.value = target.name;
  showDeleteDialog.value = true;
  hideContextMenu();
};

// 确认删除
const confirmDelete = async () => {
  if (!deleteTargetPath.value) return;
  try {
    await skillsStore.deleteItem(deleteTargetPath.value);
    if (skillsStore.selectedSkill?.path === deleteTargetPath.value) {
      editorContent.value = "";
      hasChanges.value = false;
    }
    showDeleteDialog.value = false;
    deleteTargetPath.value = "";
    deleteTargetName.value = "";
  } catch (e) {
    console.error("Failed to delete:", e);
  }
};

// Handle window resize for mobile detection
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

// 点击其他地方关闭右键菜单
onMounted(() => {
  skillsStore.loadPathsFromStorage();
  // Load AI panel state from localStorage (Requirement 1.6)
  aiStore.loadPanelStateFromStorage();
  document.addEventListener('click', hideContextMenu);
  // Add listener for text selection menu dismissal (Requirement 6.6)
  document.addEventListener('mousedown', handleDocumentClick);
  // Add resize listener for mobile detection
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu);
  document.removeEventListener('mousedown', handleDocumentClick);
  window.removeEventListener('resize', handleResize);
});

const renderedContent = computed(() => {
  return editorContent.value
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/\n/gim, '<br>');
});
</script>

<style lang="scss" scoped>
// Main Layout
.skills-panel { display: flex; flex-direction: column; height: 100%; background-color: var(--background); }

// Header - Consistent with McpView
.panel-header { padding: var(--space-6); border-bottom: 1px solid var(--border); background-color: var(--card); }
.header-content { display: flex; align-items: flex-start; justify-content: space-between; }
.header-title { font-size: 18px; font-weight: 600; color: var(--foreground); margin: 0; }
.header-subtitle { font-size: 14px; color: var(--muted-foreground); margin: var(--space-1) 0 0; }

// Header Actions Container
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

// Primary Add Button - Consistent with McpView
.btn-add {
  display: inline-flex; align-items: center; gap: var(--space-2); padding: 0 var(--space-4); height: 40px;
  background-color: var(--primary); color: var(--primary-foreground); border: none; border-radius: var(--radius-lg);
  font-size: 14px; font-weight: 500; cursor: pointer; transition: opacity var(--duration-fast) var(--ease-default);
  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-icon { width: 16px; height: 16px; }
}

// AI Toggle Button (Requirement 4.2, 4.3, 4.4)
.btn-ai-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-4);
  height: 40px;
  background-color: transparent;
  color: var(--muted-foreground);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);

  .btn-icon { width: 16px; height: 16px; }
  
  // Hide text on small screens
  @media (max-width: 767px) {
    padding: 0 var(--space-3);
    .btn-text { display: none; }
  }

  &:hover {
    background-color: var(--accent);
    color: var(--foreground);
    border-color: var(--accent);
  }

  // Active state when panel is open (Requirement 4.4)
  &.active {
    background-color: var(--primary);
    color: var(--primary-foreground);
    border-color: var(--primary);

    &:hover {
      opacity: 0.9;
    }
  }
}

// Content Layout - Embedded AI Panel (Requirement 1.4, 1.5)
.skills-content { 
  display: flex; 
  flex: 1; 
  overflow: hidden;
  position: relative;
}

// Responsive AI Panel Layout (Requirements 5.1, 5.2, 5.3, 5.4)
// Mobile: overlay mode
@media (max-width: 767px) {
  // Hide skills browser on very small screens when AI panel is open
  .skills-content.ai-panel-open .skills-browser {
    display: none;
  }
}

// Left Panel - Skills Browser
.skills-browser { 
  width: 280px; min-width: 220px; border-right: 1px solid var(--border); 
  background-color: var(--card); display: flex; flex-direction: column; overflow: hidden;
  flex-shrink: 0;
  
  // Responsive width for smaller screens
  @media (max-width: 1200px) {
    width: 260px;
    min-width: 200px;
  }
  
  @media (max-width: 1024px) {
    width: 240px;
    min-width: 180px;
  }
  
  @media (max-width: 767px) {
    width: 220px;
    min-width: 160px;
  }
}

// Loading & Error States - Consistent with McpView
.loading-state, .error-state {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--space-3); padding: var(--space-8); text-align: center; color: var(--muted-foreground); font-size: 14px;
}
.loading-icon { width: 24px; height: 24px; animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.error-icon { width: 24px; height: 24px; color: var(--destructive); }
.btn-retry { 
  padding: var(--space-2) var(--space-4); background-color: var(--primary); color: var(--primary-foreground); 
  border: none; border-radius: var(--radius-lg); font-size: 14px; cursor: pointer;
  &:hover { opacity: 0.9; }
}

// Empty State - Consistent with McpView
.empty-state { 
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; 
  text-align: center; padding: var(--space-8); 
}
.empty-icon { width: 48px; height: 48px; color: var(--muted-foreground); margin-bottom: var(--space-4); }
.empty-title { font-size: 16px; font-weight: 500; color: var(--foreground); margin: 0 0 var(--space-2); }
.empty-description { font-size: 14px; color: var(--muted-foreground); margin: 0 0 var(--space-4); }

// Buttons - Consistent with McpView
.btn-primary { 
  display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); 
  background-color: var(--primary); color: var(--primary-foreground); border: none; border-radius: var(--radius-lg); 
  font-size: 14px; font-weight: 500; cursor: pointer; 
  &:hover { opacity: 0.9; } 
  .btn-icon { width: 16px; height: 16px; } 
}
.btn-secondary { 
  padding: var(--space-2) var(--space-4); background: transparent; border: 1px solid var(--border); 
  border-radius: var(--radius-lg); font-size: 14px; color: var(--foreground); cursor: pointer; 
  &:hover { background-color: var(--accent); } 
}

// Browser Content
.browser-content { display: flex; flex-direction: column; flex: 1; overflow: hidden; }

// Path Toolbar
.path-toolbar {
  display: flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-3); margin: var(--space-3);
  background-color: oklch(0.22 0 0 / 0.5); border-radius: var(--radius-lg);
}
.current-path { 
  display: flex; align-items: center; gap: var(--space-2); flex: 1; min-width: 0;
  .path-icon { width: 14px; height: 14px; color: var(--muted-foreground); flex-shrink: 0; }
  .path-text { 
    font-size: 12px; color: var(--muted-foreground); font-family: var(--font-mono);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: rtl; text-align: left;
  } 
}
.path-action {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; padding: 0;
  background: transparent; border: none; border-radius: var(--radius-md);
  color: var(--muted-foreground); cursor: pointer;
  transition: all 150ms ease;
  flex-shrink: 0;
  &:hover { background-color: var(--accent); color: var(--foreground); }
  .action-icon { width: 16px; height: 16px; }
}

// Folder List
.folder-list { display: flex; flex-direction: column; gap: var(--space-1); padding: 0 var(--space-3); overflow-y: auto; flex: 1; }
.folder-item { margin-bottom: var(--space-1); }
.folder-header { 
  display: flex; align-items: center; gap: var(--space-2); width: 100%; 
  padding: var(--space-2) var(--space-3); background: transparent; border: none; 
  border-radius: var(--radius-lg); cursor: pointer; text-align: left;
  transition: all var(--duration-fast) var(--ease-default); 
  &:hover { background-color: var(--accent); } 
}
.folder-chevron { width: 14px; height: 14px; color: var(--muted-foreground); flex-shrink: 0; }
.folder-icon { width: 16px; height: 16px; color: var(--muted-foreground); flex-shrink: 0; &.active { color: var(--primary); } }
.folder-name { flex: 1; font-size: 14px; font-weight: 500; color: var(--foreground); }
.folder-count { 
  font-size: 12px; color: var(--muted-foreground); background-color: var(--muted); 
  padding: 2px 8px; border-radius: var(--radius-full); 
}
.folder-content { padding-left: var(--space-6); margin-top: var(--space-1); }
.root-files { margin-bottom: var(--space-2); }

// Skill Items - Consistent hover/active states
.skill-item { 
  display: flex; align-items: center; gap: var(--space-2); width: 100%; 
  padding: var(--space-2) var(--space-3); background: transparent; border: none; 
  border-radius: var(--radius-md); cursor: pointer; text-align: left;
  transition: all 150ms ease; 
  &:hover { background-color: var(--accent); } 
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
    &:hover { background: linear-gradient(90deg, oklch(0.7 0.2 145 / 0.25) 0%, var(--accent) 100%); }
    &.active { background: linear-gradient(90deg, oklch(0.7 0.2 145 / 0.3) 0%, oklch(0.65 0.22 270 / 0.15) 100%); }
  }
  // SKILL.md 特殊样式
  &.is-skill-md {
    background: linear-gradient(90deg, oklch(0.65 0.22 270 / 0.08) 0%, transparent 100%);
    border-left: 2px solid var(--primary);
    margin-left: 2px;
    &:hover { background: linear-gradient(90deg, oklch(0.65 0.22 270 / 0.15) 0%, var(--accent) 100%); }
    &.active { background: linear-gradient(90deg, oklch(0.65 0.22 270 / 0.2) 0%, oklch(0.65 0.22 270 / 0.1) 100%); }
  }
}

// Highlight pulse animation (Requirement 14.7)
@keyframes highlight-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.skill-badge {
  display: flex; align-items: center; justify-content: center;
  width: 18px; height: 18px;
  background: linear-gradient(135deg, var(--primary) 0%, oklch(0.6 0.25 300) 100%);
  border-radius: var(--radius-sm); flex-shrink: 0;
}
.skill-badge-icon { width: 12px; height: 12px; color: white; }
.file-icon { width: 14px; height: 14px; color: var(--muted-foreground); flex-shrink: 0; &.json { color: #f59e0b; } &.code { color: #10b981; } }
.skill-icon { width: 14px; height: 14px; color: var(--muted-foreground); flex-shrink: 0; }
.skill-name { flex: 1; font-size: 13px; color: var(--foreground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; &.skill-md-name { font-weight: 600; color: var(--primary); } }

// Right Panel - Editor
.skills-editor { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  background-color: var(--background); 
  min-width: 0; // Allow shrinking below content size
  overflow: hidden;
}
.editor-header { 
  display: flex; align-items: center; justify-content: space-between; 
  padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border); background-color: var(--card); 
}
.header-left { display: flex; align-items: center; gap: var(--space-4); }
.editor-title { font-size: 14px; font-weight: 600; color: var(--foreground); margin: 0; }

// Tabs
.tabs-list { display: inline-flex; align-items: center; background: var(--muted); border-radius: var(--radius-lg); padding: 4px; gap: 4px; }
.tabs-trigger { 
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-1); 
  padding: var(--space-1) var(--space-3); border-radius: var(--radius-md); 
  font-size: 12px; font-weight: 500; color: var(--muted-foreground); 
  background: transparent; border: none; cursor: pointer; 
  transition: all var(--duration-fast) var(--ease-default); 
  &:hover { color: var(--foreground); } 
  &.active { background: var(--background); color: var(--foreground); box-shadow: var(--shadow-sm); } 
  .tab-icon { width: 12px; height: 12px; } 
}

// Editor Actions - Consistent with McpView action buttons
.header-actions { display: flex; align-items: center; gap: var(--space-2); }
.action-btn { 
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); 
  padding: 0 var(--space-3); height: 32px; background: transparent; 
  border: 1px solid var(--border); border-radius: var(--radius-lg); 
  font-size: 13px; color: var(--foreground); cursor: pointer; 
  transition: all var(--duration-fast) var(--ease-default); 
  &:hover:not(:disabled) { background-color: var(--accent); border-color: var(--accent); } 
  &:disabled { opacity: 0.5; cursor: not-allowed; } 
  &.primary { 
    background-color: var(--primary); border-color: var(--primary); color: var(--primary-foreground); 
    &:hover:not(:disabled) { opacity: 0.9; } 
  } 
  .action-icon { width: 14px; height: 14px; } 
}

// AI File Actions
.ai-file-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-right: var(--space-2);
  padding-right: var(--space-2);
  border-right: 1px solid var(--border);
}

.ai-action-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  height: 28px;
  background: transparent;
  border: 1px solid var(--primary);
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 500;
  color: var(--primary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
  white-space: nowrap;

  .action-icon {
    width: 12px;
    height: 12px;
  }

  &:hover {
    background-color: var(--primary);
    color: var(--primary-foreground);
  }

  &:active {
    transform: scale(0.98);
  }
}

// Hide AI action text on smaller screens
@media (max-width: 1200px) {
  .ai-action-btn {
    padding: var(--space-1);
    
    span:not(.action-icon) {
      display: none;
    }
  }
}

// Editor Content
.editor-content { flex: 1; overflow: hidden; }
.code-editor { 
  width: 100%; height: 100%; padding: var(--space-4); background-color: var(--background); 
  border: none; outline: none; font-family: var(--font-mono); font-size: 14px; 
  color: var(--foreground); resize: none; tab-size: 2; 
  &::placeholder { color: var(--muted-foreground); } 
}
.preview-content { height: 100%; overflow-y: auto; padding: var(--space-6); }
.markdown-preview { 
  max-width: 768px; margin: 0 auto; font-size: 14px; line-height: 1.6; color: var(--foreground); 
  :deep(h1) { font-size: 24px; font-weight: 600; margin: 0 0 var(--space-4); } 
  :deep(h2) { font-size: 20px; font-weight: 600; margin: var(--space-6) 0 var(--space-3); } 
  :deep(h3) { font-size: 16px; font-weight: 600; margin: var(--space-4) 0 var(--space-2); } 
  :deep(pre) { background-color: var(--muted); padding: var(--space-4); border-radius: var(--radius-lg); overflow-x: auto; margin: var(--space-4) 0; } 
  :deep(code) { font-family: var(--font-mono); font-size: 13px; } 
}

// Dialog - Consistent with McpView
.dialog-overlay { position: fixed; inset: 0; background-color: oklch(0 0 0 / 0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.dialog { 
  background-color: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg); 
  padding: var(--space-6); width: 400px; max-width: 90vw; 
}
.dialog-title { font-size: 18px; font-weight: 600; color: var(--foreground); margin: 0 0 var(--space-4); }
.form-group { margin-bottom: var(--space-4); }
.form-label { display: block; font-size: 14px; font-weight: 500; color: var(--foreground); margin-bottom: var(--space-2); }
.form-input, .form-select { 
  width: 100%; height: 40px; padding: 0 var(--space-3); background-color: var(--background); 
  border: 1px solid var(--border); border-radius: var(--radius-lg); font-size: 14px; color: var(--foreground); 
  &:focus { outline: none; border-color: var(--ring); } 
}
.dialog-actions { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-6); }

// Context Menu
.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 160px;
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-1);
  box-shadow: 0 4px 12px oklch(0 0 0 / 0.15);
}
.context-menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--foreground);
  cursor: pointer;
  transition: all 150ms ease;
  &:hover { background-color: var(--accent); }
  &.danger { color: var(--destructive); &:hover { background-color: oklch(0.6 0.2 25 / 0.1); } }
}
.context-menu-icon { width: 14px; height: 14px; }
.context-menu-divider { height: 1px; background-color: var(--border); margin: var(--space-1) 0; }

// Delete Dialog
.delete-dialog {
  text-align: center;
  max-width: 360px;
}
.delete-dialog-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin: 0 auto var(--space-4);
  background-color: oklch(0.6 0.2 25 / 0.1);
  border-radius: var(--radius-full);
}
.warning-icon {
  width: 24px;
  height: 24px;
  color: var(--destructive);
}
.delete-dialog-message {
  font-size: 14px;
  color: var(--muted-foreground);
  margin: 0 0 var(--space-6);
  line-height: 1.5;
}
.btn-danger {
  padding: var(--space-2) var(--space-4);
  background-color: var(--destructive);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 150ms ease;
  &:hover { opacity: 0.9; }
}

// AI Panel Backdrop for Mobile Overlay Mode (Requirement 5.1)
.ai-panel-backdrop {
  display: none; // Hidden by default on desktop
  
  @media (max-width: 767px) {
    display: block;
    position: fixed;
    inset: 0;
    background-color: oklch(0 0 0 / 0.5);
    z-index: 99; // Below AI panel (z-index: 100)
  }
}

// Fade transition for backdrop
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
