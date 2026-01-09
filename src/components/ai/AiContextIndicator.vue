<template>
  <div class="ai-context-indicator">
    <!-- Working Directory Selector -->
    <div class="context-section workspace-context">
      <div class="context-header">
        <div class="context-info workspace-info">
          <span class="context-icon workspace-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span class="context-label">{{ t('aiContext.workingDirectory') }}</span>
        </div>
      </div>
      <div class="workspace-selector">
        <select 
          v-model="selectedWorkspacePath" 
          class="workspace-select"
          @change="handleWorkspaceChange"
        >
          <option v-if="availablePaths.length === 0" value="" disabled>
            {{ t('aiContext.noWorkspace') }}
          </option>
          <option 
            v-for="pathItem in availablePaths" 
            :key="pathItem.path" 
            :value="pathItem.path"
          >
            {{ truncateWorkspacePath(pathItem.path) }}
          </option>
        </select>
        <button 
          class="workspace-browse-btn" 
          @click="goToSettings"
          :title="t('aiContext.manageWorkspaces')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Selected File Context (Requirement 14.1, 14.2) -->
    <div v-if="currentFile" class="context-section file-context">
      <div class="context-header">
        <div class="context-info" @click="handleAskAboutFile" :title="t('aiContext.askAboutFile')">
          <span class="context-icon file-icon">{{ getFileIcon(currentFile.type) }}</span>
          <span class="context-label">{{ t('aiContext.currentFile') }}</span>
          <span class="context-path" :title="currentFile.path">{{ truncatePath(currentFile.path) }}</span>
        </div>
        <button class="context-close" @click="clearFileContext" :title="t('common.close')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Selected Text Context (Requirement 14.4, 14.5) -->
    <div v-if="selectedText" class="context-section text-context">
      <div class="context-header">
        <div class="context-info">
          <span class="context-icon text-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 7V4h16v3M9 20h6M12 4v16" />
            </svg>
          </span>
          <span class="context-label">{{ t('aiContext.selectedText') }}</span>
        </div>
        <button class="context-close" @click="clearTextContext" :title="t('common.close')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <!-- Text Preview (Requirement 14.4, 14.5) -->
      <div class="text-preview">
        <blockquote class="preview-quote">{{ truncatedText }}</blockquote>
      </div>
      <!-- Quick Actions for Text (Requirement 14.3) -->
      <div class="quick-actions">
        <button 
          v-for="action in textActions" 
          :key="action.id"
          class="quick-action-btn"
          @click="handleTextAction(action.id)"
          :title="action.label"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '@/i18n';
import { useAiStore } from '@/stores/ai';
import { useSkillsStore } from '@/stores/skills';
import { useSettingsStore } from '@/stores/settings';

// Emits
const emit = defineEmits<{
  (e: 'ask-about-file', path: string): void;
  (e: 'text-action', action: string, text: string): void;
  (e: 'workspace-change', path: string): void;
}>();

// Stores and i18n
const aiStore = useAiStore();
const skillsStore = useSkillsStore();
const settingsStore = useSettingsStore();
const router = useRouter();
const { t } = useI18n();

// Working directory state
const selectedWorkspacePath = ref('');

// Available workspace paths from settings
const availablePaths = computed(() => {
  const paths = settingsStore.skillsPaths || [];
  // Filter out empty paths
  return paths.filter(p => p.path && p.path.trim() !== '');
});

// Initialize selected workspace path
onMounted(() => {
  // Default to current skills path or first available path
  if (skillsStore.skillsPath) {
    selectedWorkspacePath.value = skillsStore.skillsPath;
  } else if (availablePaths.value.length > 0) {
    selectedWorkspacePath.value = availablePaths.value[0].path;
  }
});

// Watch for skills path changes
watch(() => skillsStore.skillsPath, (newPath) => {
  if (newPath && newPath !== selectedWorkspacePath.value) {
    selectedWorkspacePath.value = newPath;
  }
});

// Handle workspace change
function handleWorkspaceChange() {
  if (selectedWorkspacePath.value) {
    // Update the skills store path
    skillsStore.setSkillsPath(selectedWorkspacePath.value);
    emit('workspace-change', selectedWorkspacePath.value);
  }
}

// Truncate workspace path for display
function truncateWorkspacePath(path: string): string {
  if (!path) return '';
  const maxLength = 35;
  if (path.length <= maxLength) return path;
  
  const parts = path.replace(/\\/g, '/').split('/');
  if (parts.length <= 2) {
    return '...' + path.slice(-maxLength + 3);
  }
  
  // Show last two folders
  const lastTwo = parts.slice(-2).join('/');
  if (lastTwo.length <= maxLength - 4) {
    return '.../' + lastTwo;
  }
  return '...' + path.slice(-maxLength + 3);
}

// Navigate to settings
function goToSettings() {
  router.push('/settings');
}

// Text actions (Requirement 14.3)
const textActions = computed(() => [
  { id: 'explain', label: t('aiContext.actions.explain') },
  { id: 'optimize', label: t('aiContext.actions.optimize') },
  { id: 'translate', label: t('aiContext.actions.translate') },
  { id: 'fix', label: t('aiContext.actions.fix') },
]);

// Current selected file from skills store
const currentFile = computed(() => skillsStore.selectedSkill);

// Selected text from AI store
const selectedText = computed(() => aiStore.selectedText);

// Truncate text to max 3 lines (Requirement 14.4)
const truncatedText = computed(() => {
  if (!selectedText.value) return '';
  const lines = selectedText.value.split('\n');
  const maxLines = 3;
  const maxCharsPerLine = 60;
  
  const truncatedLines = lines.slice(0, maxLines).map(line => {
    if (line.length > maxCharsPerLine) {
      return line.substring(0, maxCharsPerLine) + '...';
    }
    return line;
  });
  
  let result = truncatedLines.join('\n');
  if (lines.length > maxLines) {
    result += '\n...';
  }
  return result;
});

// Get file icon based on type
function getFileIcon(type: string): string {
  const icons: Record<string, string> = {
    'markdown': '📄',
    'json': '📋',
    'yaml': '⚙️',
    'yml': '⚙️',
    'javascript': '📜',
    'typescript': '📘',
    'python': '🐍',
    'default': '📄',
  };
  return icons[type] || icons.default;
}

// Truncate long file paths
function truncatePath(path: string): string {
  const maxLength = 40;
  if (path.length <= maxLength) return path;
  
  const parts = path.split('/');
  if (parts.length <= 2) {
    return '...' + path.slice(-maxLength + 3);
  }
  
  // Show first folder and filename
  const fileName = parts[parts.length - 1];
  const firstFolder = parts[0] || parts[1];
  return `${firstFolder}/.../${fileName}`;
}

// Handle click on file context to ask AI about it
function handleAskAboutFile() {
  if (currentFile.value) {
    emit('ask-about-file', currentFile.value.path);
  }
}

// Handle text quick actions
function handleTextAction(actionId: string) {
  if (selectedText.value) {
    emit('text-action', actionId, selectedText.value);
  }
}

// Clear file context
function clearFileContext() {
  // We don't clear the selected skill from skills store
  // as that would affect the editor view
  // Instead, we just emit an event or handle it locally
}

// Clear text context
function clearTextContext() {
  aiStore.setSelectedText(null);
}
</script>

<style lang="scss" scoped>
.ai-context-indicator {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border-bottom: 1px solid var(--border);
  background-color: var(--card);
}

.context-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background-color: var(--muted);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}

// Workspace selector styles
.workspace-context {
  background-color: transparent;
  border: none;
  padding: 0;
  gap: var(--space-1);
}

.workspace-info {
  cursor: default;
  
  &:hover {
    background-color: transparent;
  }
}

.workspace-icon {
  color: var(--warning);
}

.workspace-selector {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.workspace-select {
  flex: 1;
  height: 32px;
  padding: 0 var(--space-3);
  padding-right: var(--space-6);
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--foreground);
  background-color: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  
  &:focus {
    outline: none;
    border-color: var(--ring);
  }
  
  &:hover {
    border-color: var(--primary);
  }
}

.workspace-browse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background-color: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--muted-foreground);
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: var(--accent);
    border-color: var(--primary);
    color: var(--primary);
  }
}

.context-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.context-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-md);
  transition: background-color var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: var(--accent);
  }
}

.context-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
  
  &.text-icon {
    color: var(--primary);
  }
}

.context-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted-foreground);
  white-space: nowrap;
}

.context-path {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.context-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--muted-foreground);
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: var(--accent);
    color: var(--foreground);
  }
}

// Text Preview (Requirement 14.4, 14.5)
.text-preview {
  margin: 0;
}

.preview-quote {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  font-size: 12px;
  font-family: var(--font-mono);
  line-height: 1.5;
  color: var(--foreground);
  background-color: var(--background);
  border-left: 3px solid var(--primary);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 72px; // ~3 lines at 12px font + padding
  overflow: hidden;
}

// Quick Actions (Requirement 14.3)
.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.quick-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-1) var(--space-2);
  font-size: 11px;
  font-weight: 500;
  color: var(--primary);
  background-color: transparent;
  border: 1px solid var(--primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: var(--primary);
    color: var(--primary-foreground);
  }

  &:active {
    transform: scale(0.98);
  }
}

// Responsive adjustments
@media (max-width: 400px) {
  .context-label {
    display: none;
  }
  
  .quick-action-btn {
    font-size: 10px;
    padding: 2px var(--space-1);
  }
}

// Reduced motion
@media (prefers-reduced-motion: reduce) {
  .context-info,
  .context-close,
  .quick-action-btn {
    transition: none;
  }
}
</style>
