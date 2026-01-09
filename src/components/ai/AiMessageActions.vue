<template>
  <div 
    class="message-actions" 
    :class="{ 'is-visible': isVisible }"
    role="toolbar"
    :aria-label="t('aiMessageActions.toolbar')"
  >
    <!-- Copy full text button -->
    <button
      class="action-btn"
      @click="handleCopyText"
      :title="t('aiMessageActions.copyText')"
      :aria-label="t('aiMessageActions.copyText')"
    >
      <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    </button>

    <!-- Copy code blocks only button (only show if message has code) -->
    <button
      v-if="hasCodeBlocks"
      class="action-btn"
      @click="handleCopyCode"
      :title="t('aiMessageActions.copyCode')"
      :aria-label="t('aiMessageActions.copyCode')"
    >
      <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    </button>

    <!-- Regenerate button (AI messages only) -->
    <button
      v-if="role === 'assistant'"
      class="action-btn"
      @click="handleRegenerate"
      :title="t('aiMessageActions.regenerate')"
      :aria-label="t('aiMessageActions.regenerate')"
    >
      <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M21 2v6h-6"/>
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
        <path d="M3 22v-6h6"/>
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
      </svg>
    </button>

    <!-- Edit & resend button (user messages only) -->
    <button
      v-if="role === 'user'"
      class="action-btn"
      @click="handleEdit"
      :title="t('aiMessageActions.edit')"
      :aria-label="t('aiMessageActions.edit')"
    >
      <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </button>

    <!-- Delete button -->
    <button
      class="action-btn action-btn--danger"
      @click="handleDelete"
      :title="t('aiMessageActions.delete')"
      :aria-label="t('aiMessageActions.delete')"
    >
      <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@/i18n';
import { useToast } from '@/composables/useToast';

// Props
interface Props {
  messageId: string;
  content: string;
  role: 'user' | 'assistant';
  isVisible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isVisible: false,
});

// Emits
const emit = defineEmits<{
  (e: 'copy-text'): void;
  (e: 'copy-code'): void;
  (e: 'regenerate'): void;
  (e: 'edit'): void;
  (e: 'delete'): void;
}>();

// i18n and toast
const { t } = useI18n();
const toast = useToast();

// Computed
const hasCodeBlocks = computed(() => {
  // Check for markdown code blocks (``` or `)
  return /```[\s\S]*?```|`[^`]+`/.test(props.content);
});

// Extract code blocks from content
function extractCodeBlocks(content: string): string[] {
  const codeBlocks: string[] = [];
  
  // Match fenced code blocks (```...```)
  const fencedRegex = /```(?:\w+)?\n?([\s\S]*?)```/g;
  let match;
  while ((match = fencedRegex.exec(content)) !== null) {
    codeBlocks.push(match[1].trim());
  }
  
  // If no fenced blocks, try inline code (`...`)
  if (codeBlocks.length === 0) {
    const inlineRegex = /`([^`]+)`/g;
    while ((match = inlineRegex.exec(content)) !== null) {
      codeBlocks.push(match[1]);
    }
  }
  
  return codeBlocks;
}

// Methods
async function handleCopyText() {
  try {
    await navigator.clipboard.writeText(props.content);
    emit('copy-text');
    toast.success(t('aiMessageActions.copied'));
  } catch (err) {
    console.error('Failed to copy text:', err);
    toast.error(t('aiMessageActions.copyFailed'));
  }
}

async function handleCopyCode() {
  try {
    const codeBlocks = extractCodeBlocks(props.content);
    const codeText = codeBlocks.join('\n\n');
    
    if (codeText) {
      await navigator.clipboard.writeText(codeText);
      emit('copy-code');
      toast.success(t('aiMessageActions.copied'));
    } else {
      toast.info(t('aiMessageActions.noCode'));
    }
  } catch (err) {
    console.error('Failed to copy code:', err);
    toast.error(t('aiMessageActions.copyFailed'));
  }
}

function handleRegenerate() {
  emit('regenerate');
}

function handleEdit() {
  emit('edit');
}

function handleDelete() {
  emit('delete');
}
</script>

<style lang="scss" scoped>
.message-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1, 4px);
  padding: var(--space-1, 4px);
  background-color: var(--card, #1E293B);
  border: 1px solid var(--border, #334155);
  border-radius: var(--radius-md, 6px);
  opacity: 0;
  visibility: hidden;
  transform: translateY(4px);
  transition: 
    opacity 0.15s ease-out,
    visibility 0.15s ease-out,
    transform 0.15s ease-out;
  
  &.is-visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--muted-foreground, #94A3B8);
  border-radius: var(--radius-sm, 4px);
  cursor: pointer;
  transition: 
    background-color 0.15s ease-out,
    color 0.15s ease-out;
  
  &:hover {
    background-color: var(--accent, rgba(59, 130, 246, 0.1));
    color: var(--foreground, #F1F5F9);
  }
  
  &:focus-visible {
    outline: 2px solid var(--ring, #3B82F6);
    outline-offset: 1px;
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &--danger {
    &:hover {
      background-color: rgba(239, 68, 68, 0.1);
      color: var(--tool-error);
    }
  }
}

.action-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

// Respect reduced motion preference
@media (prefers-reduced-motion: reduce) {
  .message-actions {
    transition: none;
    transform: none;
  }
  
  .action-btn {
    transition: none;
    
    &:active {
      transform: none;
    }
  }
}

// Light mode adjustments
:root[data-theme="light"] .message-actions,
.light .message-actions {
  background-color: var(--card, #FFFFFF);
  border-color: var(--border, #E2E8F0);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
}
</style>
