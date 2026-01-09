<template>
  <div class="ai-file-card" :class="{ 'is-expanded': isExpanded }">
    <!-- File Header (Requirement 14.6, 14.7) -->
    <div class="file-card-header">
      <div class="file-info">
        <!-- File Icon -->
        <span class="file-icon" :title="fileType">
          <svg v-if="isFolder" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </span>
        
        <!-- File Name -->
        <span class="file-name" :title="filePath">{{ fileName }}</span>
        
        <!-- Badge: New/Edit (Requirement 14.6, 14.7) -->
        <span v-if="badge" class="file-badge" :class="`badge-${badge}`">
          {{ badgeText }}
        </span>
      </div>
      
      <div class="file-actions">
        <!-- Expand/Collapse Button -->
        <button 
          v-if="hasContent"
          class="action-btn expand-btn"
          @click="toggleExpand"
          :title="isExpanded ? t('aiFileCard.collapse') : t('aiFileCard.expand')"
          :aria-expanded="isExpanded"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline :points="isExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"/>
          </svg>
        </button>
        
        <!-- Open File Button (Requirement 14.6) -->
        <button 
          class="action-btn open-btn"
          @click="handleOpenFile"
          :title="t('aiFileCard.openFile')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Content Preview (Requirement 14.8) -->
    <div v-if="hasContent" class="file-card-content" :class="{ 'is-visible': isExpanded }">
      <div class="content-preview" :class="{ 'has-syntax': isCodeFile }">
        <!-- Syntax Highlighted Code Preview -->
        <pre v-if="isCodeFile" class="preview-code hljs"><code v-html="highlightedPreview"></code></pre>
        <!-- Plain Text Preview -->
        <pre v-else class="preview-text">{{ previewContent }}</pre>
      </div>
      
      <!-- Show More Button -->
      <button 
        v-if="hasMoreContent"
        class="show-more-btn"
        @click="handleShowMore"
      >
        {{ t('aiFileCard.showMore') }}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from '@/i18n';
import hljs from 'highlight.js';

// Props
interface Props {
  filePath: string;
  content?: string;
  badge?: 'new' | 'edit' | null;
  defaultExpanded?: boolean;
  maxPreviewLines?: number;
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  badge: null,
  defaultExpanded: false,
  maxPreviewLines: 5,
});

// Emits
const emit = defineEmits<{
  (e: 'open', path: string): void;
  (e: 'show-more', path: string): void;
}>();

// i18n
const { t } = useI18n();

// State
const isExpanded = ref(props.defaultExpanded);

// Computed: File name from path
const fileName = computed(() => {
  const parts = props.filePath.split('/');
  return parts[parts.length - 1] || props.filePath;
});

// Computed: Check if it's a folder
const isFolder = computed(() => {
  return !fileName.value.includes('.') || props.filePath.endsWith('/');
});

// Computed: File type/extension
const fileType = computed(() => {
  if (isFolder.value) return 'folder';
  const ext = fileName.value.split('.').pop()?.toLowerCase() || '';
  return ext;
});

// Computed: Badge text
const badgeText = computed(() => {
  if (props.badge === 'new') return t('aiFileCard.badgeNew');
  if (props.badge === 'edit') return t('aiFileCard.badgeEdit');
  return '';
});

// Computed: Check if file has content
const hasContent = computed(() => {
  return !!props.content && props.content.trim().length > 0;
});

// Computed: Check if it's a code file for syntax highlighting
const isCodeFile = computed(() => {
  const codeExtensions = [
    'js', 'ts', 'jsx', 'tsx', 'vue', 'svelte',
    'py', 'rb', 'go', 'rs', 'java', 'kt', 'swift',
    'c', 'cpp', 'h', 'hpp', 'cs',
    'php', 'sh', 'bash', 'zsh',
    'json', 'yaml', 'yml', 'toml', 'xml',
    'html', 'css', 'scss', 'sass', 'less',
    'sql', 'graphql', 'md', 'markdown'
  ];
  return codeExtensions.includes(fileType.value);
});

// Computed: Get language for highlight.js
const highlightLanguage = computed(() => {
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'javascript',
    'tsx': 'typescript',
    'vue': 'xml',
    'svelte': 'xml',
    'py': 'python',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'kt': 'kotlin',
    'yml': 'yaml',
    'md': 'markdown',
    'sh': 'bash',
    'zsh': 'bash',
  };
  return langMap[fileType.value] || fileType.value;
});

// Computed: Preview content (first N lines)
const previewContent = computed(() => {
  if (!props.content) return '';
  const lines = props.content.split('\n');
  return lines.slice(0, props.maxPreviewLines).join('\n');
});

// Computed: Check if there's more content beyond preview
const hasMoreContent = computed(() => {
  if (!props.content) return false;
  const lines = props.content.split('\n');
  return lines.length > props.maxPreviewLines;
});

// Computed: Syntax highlighted preview
const highlightedPreview = computed(() => {
  if (!previewContent.value) return '';
  
  const lang = highlightLanguage.value;
  if (hljs.getLanguage(lang)) {
    try {
      return hljs.highlight(previewContent.value, { language: lang }).value;
    } catch (e) {
      console.warn('Highlight.js error:', e);
    }
  }
  
  // Fallback: escape HTML
  return previewContent.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
});

// Methods
function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

function handleOpenFile() {
  emit('open', props.filePath);
}

function handleShowMore() {
  emit('show-more', props.filePath);
}
</script>

<style lang="scss" scoped>
.ai-file-card {
  display: flex;
  flex-direction: column;
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color var(--duration-fast) var(--ease-default);

  &:hover {
    border-color: var(--primary);
  }

  &.is-expanded {
    .file-card-content {
      max-height: 300px;
      opacity: 1;
    }
  }
}

// File Header
.file-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  background-color: var(--muted);
  border-bottom: 1px solid var(--border);
  min-height: 40px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: var(--primary);
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-mono);
  color: var(--foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Badge styles (Requirement 14.6, 14.7)
.file-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: var(--radius-full);
  flex-shrink: 0;

  &.badge-new {
    background-color: oklch(0.65 0.18 150 / 0.15);
    color: var(--success);
  }

  &.badge-edit {
    background-color: oklch(0.65 0.22 270 / 0.15);
    color: var(--primary);
  }
}

// Action buttons
.file-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--muted-foreground);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: var(--accent);
    color: var(--foreground);
  }

  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
}

.open-btn:hover {
  color: var(--primary);
}

// Content Preview (Requirement 14.8)
.file-card-content {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height var(--duration-normal) var(--ease-default),
              opacity var(--duration-fast) var(--ease-default);

  &.is-visible {
    max-height: 300px;
    opacity: 1;
  }
}

.content-preview {
  padding: var(--space-3);
  background-color: oklch(0.12 0 0); // Always dark background for code
  overflow: auto;
  max-height: 200px;

  &.has-syntax {
    background-color: oklch(0.12 0 0);
  }
}

.preview-code,
.preview-text {
  margin: 0;
  padding: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  background: transparent;
}

.preview-code {
  color: oklch(0.88 0 0);

  code {
    font-family: inherit;
    background: transparent;
    padding: 0;
  }
}

.preview-text {
  color: oklch(0.75 0 0);
}

// Show More Button
.show-more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  width: 100%;
  padding: var(--space-2);
  font-size: 12px;
  font-weight: 500;
  color: var(--primary);
  background-color: var(--muted);
  border: none;
  border-top: 1px solid var(--border);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: var(--accent);
  }

  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: -2px;
  }

  svg {
    flex-shrink: 0;
  }
}

// Responsive adjustments
@media (max-width: 400px) {
  .file-card-header {
    padding: var(--space-2);
  }

  .file-name {
    font-size: 12px;
  }

  .file-badge {
    font-size: 9px;
    padding: 1px 6px;
  }

  .action-btn {
    width: 24px;
    height: 24px;
  }
}

// Reduced motion
@media (prefers-reduced-motion: reduce) {
  .ai-file-card,
  .action-btn,
  .show-more-btn,
  .file-card-content {
    transition: none;
  }
}
</style>
