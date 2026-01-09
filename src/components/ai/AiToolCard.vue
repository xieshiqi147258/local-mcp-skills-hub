<template>
  <div 
    class="tool-card"
    :class="[
      `tool-card--${toolCall.status}`,
      { 'tool-card--expanded': isExpanded }
    ]"
  >
    <!-- Header - Always visible -->
    <div class="tool-card__header" @click="toggleExpand">
      <!-- Status indicator -->
      <div class="tool-card__status-icon">
        <!-- Pending/Running spinner -->
        <svg v-if="toolCall.status === 'pending' || toolCall.status === 'running'" class="spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10"/>
        </svg>
        <!-- Success checkmark -->
        <svg v-else-if="toolCall.status === 'success'" class="icon-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <!-- Error X -->
        <svg v-else-if="toolCall.status === 'error'" class="icon-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        <!-- Approved/Other -->
        <svg v-else class="icon-default" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>

      <!-- Tool info -->
      <div class="tool-card__info">
        <span class="tool-card__action">{{ actionText }}</span>
        <span v-if="filePath" class="tool-card__path">{{ displayPath }}</span>
      </div>

      <!-- Expand chevron -->
      <svg 
        v-if="hasDetails"
        class="tool-card__chevron" 
        :class="{ 'tool-card__chevron--rotated': isExpanded }"
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
      >
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>

    <!-- Expandable details -->
    <Transition name="expand">
      <div v-if="isExpanded && hasDetails" class="tool-card__details">
        <!-- Result message -->
        <div v-if="toolCall.result?.message" class="tool-card__message">
          {{ toolCall.result.message }}
        </div>

        <!-- File content preview for read_file -->
        <div v-if="toolCall.name === 'read_file' && toolCall.result?.data?.content" class="tool-card__content-preview">
          <pre>{{ truncatedContent }}</pre>
        </div>

        <!-- List files result -->
        <div v-if="toolCall.name === 'list_files' && toolCall.result?.data" class="tool-card__list">
          <div v-if="toolCall.result.data.folders?.length" class="list-section">
            <span class="list-label">📁 Folders:</span>
            <span class="list-items">{{ toolCall.result.data.folders.join(', ') }}</span>
          </div>
          <div v-if="toolCall.result.data.files?.length" class="list-section">
            <span class="list-label">📄 Files:</span>
            <span class="list-items">{{ toolCall.result.data.files.join(', ') }}</span>
          </div>
        </div>

        <!-- Error details -->
        <div v-if="toolCall.result?.error" class="tool-card__error">
          {{ toolCall.result.error }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ToolCall } from '@/stores/ai';

interface Props {
  toolCall: ToolCall;
}

const props = defineProps<Props>();

const isExpanded = ref(false);

// Action text based on tool name
const actionText = computed(() => {
  const actions: Record<string, string> = {
    'create_folder': 'Created folder',
    'create_file': 'Created file',
    'edit_file': 'Edited file',
    'delete_file': 'Deleted',
    'read_file': 'Read file',
    'list_files': 'Listed files',
  };
  
  // Add status suffix for pending/running
  const base = actions[props.toolCall.name] || props.toolCall.name;
  if (props.toolCall.status === 'pending') return `${base}...`;
  if (props.toolCall.status === 'running') return `${base}...`;
  return base;
});

// Extract file path from params
const filePath = computed(() => {
  const params = props.toolCall.params || {};
  if (params.path && params.name) {
    return `${params.path}/${params.name}`;
  }
  return params.path || params.name || '';
});

// Display path (truncated)
const displayPath = computed(() => {
  const path = filePath.value;
  if (!path) return '';
  
  // Get just the filename or last part
  const parts = path.replace(/\\/g, '/').split('/');
  const fileName = parts[parts.length - 1];
  
  // If it's a create operation, show the name
  if (props.toolCall.name === 'create_folder' || props.toolCall.name === 'create_file') {
    return fileName;
  }
  
  // For other operations, show truncated path
  if (path.length > 40) {
    return '...' + path.slice(-37);
  }
  return path;
});

// Check if there are details to show
const hasDetails = computed(() => {
  const result = props.toolCall.result;
  if (!result) return false;
  
  return !!(
    result.message ||
    result.error ||
    (props.toolCall.name === 'read_file' && result.data?.content) ||
    (props.toolCall.name === 'list_files' && result.data)
  );
});

// Truncated content for read_file
const truncatedContent = computed(() => {
  const content = props.toolCall.result?.data?.content || '';
  if (content.length > 500) {
    return content.slice(0, 500) + '\n... (truncated)';
  }
  return content;
});

function toggleExpand() {
  if (hasDetails.value) {
    isExpanded.value = !isExpanded.value;
  }
}
</script>

<style lang="scss" scoped>
.tool-card {
  background: var(--muted);
  border-radius: 8px;
  border: 1px solid var(--border);
  overflow: hidden;
  transition: border-color 0.2s ease;

  &--success {
    border-left: 3px solid var(--tool-success, #22c55e);
  }

  &--error {
    border-left: 3px solid var(--tool-error, #ef4444);
  }

  &--pending,
  &--running {
    border-left: 3px solid var(--tool-running, #3b82f6);
  }

  &--approved {
    border-left: 3px solid var(--tool-approved, #8b5cf6);
  }
}

.tool-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--accent);
  }
}

.tool-card__status-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 16px;
    height: 16px;
  }

  .spinner {
    color: var(--tool-running, #3b82f6);
    animation: spin 1s linear infinite;
  }

  .icon-success {
    color: var(--tool-success, #22c55e);
  }

  .icon-error {
    color: var(--tool-error, #ef4444);
  }

  .icon-default {
    color: var(--muted-foreground);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.tool-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.tool-card__action {
  color: var(--foreground);
  font-weight: 500;
  white-space: nowrap;
}

.tool-card__path {
  color: var(--muted-foreground);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-card__chevron {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--muted-foreground);
  transition: transform 0.2s ease;

  &--rotated {
    transform: rotate(180deg);
  }
}

.tool-card__details {
  padding: 0 12px 12px;
  font-size: 13px;
}

.tool-card__message {
  color: var(--muted-foreground);
  margin-bottom: 8px;
}

.tool-card__content-preview {
  pre {
    margin: 0;
    padding: 10px;
    background: var(--code-bg, #1e1e2e);
    border-radius: 6px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 1.4;
    color: var(--code-foreground, #cdd6f4);
    overflow-x: auto;
    max-height: 200px;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.tool-card__list {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .list-section {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  .list-label {
    flex-shrink: 0;
    font-weight: 500;
    color: var(--foreground);
  }

  .list-items {
    color: var(--muted-foreground);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    word-break: break-word;
  }
}

.tool-card__error {
  padding: 8px 10px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  color: var(--tool-error, #ef4444);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

// Expand transition
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 300px;
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
  
  .tool-card__chevron {
    transition: none;
  }
  
  .expand-enter-active,
  .expand-leave-active {
    transition: none;
  }
}
</style>
