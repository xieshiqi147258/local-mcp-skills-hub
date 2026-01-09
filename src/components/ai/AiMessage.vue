<template>
  <div 
    class="ai-message"
    :class="[`ai-message--${message.role}`]"
    :data-message-id="message.id"
    @contextmenu.prevent="handleContextMenu"
  >
    <!-- User Message -->
    <template v-if="message.role === 'user'">
      <div class="user-message">
        <div class="user-message__content">{{ message.content }}</div>
        <button class="user-message__copy" @click="$emit('copy-text', message)" :title="t('aiMessageActions.copyText')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </div>
    </template>

    <!-- Assistant Message - Kiro style with interleaved content -->
    <template v-else>
      <div class="assistant-message">
        <!-- Render content segments in order -->
        <template v-for="(segment, index) in contentSegments" :key="index">
          <!-- Tool Call Segment -->
          <div v-if="segment.type === 'tool' && segment.toolCall" class="segment segment--tool">
            <AiToolCard :tool-call="segment.toolCall" />
          </div>
          
          <!-- Text Segment -->
          <div 
            v-else-if="segment.type === 'text' && segment.text && segment.text.trim()"
            class="segment segment--text"
            v-html="renderMarkdown(segment.text || '')"
          ></div>
        </template>

        <!-- Streaming cursor -->
        <span v-if="message.isStreaming" class="streaming-cursor">▋</span>
      </div>
    </template>

    <!-- Context menu -->
    <Teleport to="body">
      <div 
        v-if="showContextMenu"
        class="context-menu"
        :style="contextMenuStyle"
        @click.stop
      >
        <button class="context-menu__item" @click="handleCopyFromMenu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          {{ t('aiMessage.copy') }}
        </button>
        <button class="context-menu__item context-menu__item--danger" @click="handleDeleteFromMenu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          {{ t('aiMessage.delete') }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from '@/i18n';
import { useToast } from '@/composables/useToast';
import { renderMarkdown } from '@/utils/markdown';
import AiToolCard from './AiToolCard.vue';
import type { Message, ToolCall } from '@/stores/ai';

interface Props {
  message: Message;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'copy-text', message: Message): void;
  (e: 'copy-code', message: Message): void;
  (e: 'regenerate', message: Message): void;
  (e: 'edit', message: Message): void;
  (e: 'delete', message: Message): void;
  (e: 'approve-diff', toolCall: ToolCall): void;
  (e: 'reject-diff', toolCall: ToolCall): void;
}>();

const { t } = useI18n();
const toast = useToast();

const showContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });

// Content segment type
interface ContentSegment {
  type: 'text' | 'tool';
  text?: string;
  toolCall?: ToolCall;
}

// Parse content into segments - interleave text and tool calls
// This creates a timeline view like Kiro
const contentSegments = computed<ContentSegment[]>(() => {
  const segments: ContentSegment[] = [];
  const toolCalls = props.message.toolCalls || [];
  const content = props.message.content || '';
  const messageSegments = props.message.segments || [];
  
  // If we have ordered segments from streaming, use them
  if (messageSegments.length > 0) {
    for (const seg of messageSegments) {
      if (seg.type === 'text' && seg.text?.trim()) {
        segments.push({ type: 'text', text: seg.text });
      } else if (seg.type === 'tool' && seg.toolCallId) {
        const toolCall = toolCalls.find(tc => tc.id === seg.toolCallId);
        if (toolCall) {
          segments.push({ type: 'tool', toolCall });
        }
      }
    }
    return segments;
  }
  
  // Fallback for messages without segments (legacy or loaded from storage)
  if (toolCalls.length === 0) {
    // No tool calls, just text
    if (content.trim()) {
      segments.push({ type: 'text', text: content });
    }
    return segments;
  }
  
  // Legacy fallback: show tools first, then text
  for (const toolCall of toolCalls) {
    segments.push({ type: 'tool', toolCall });
  }
  
  if (content.trim()) {
    segments.push({ type: 'text', text: content });
  }
  
  return segments;
});

const contextMenuStyle = computed(() => ({
  left: `${contextMenuPosition.value.x}px`,
  top: `${contextMenuPosition.value.y}px`,
}));

function handleContextMenu(event: MouseEvent) {
  contextMenuPosition.value = { x: event.clientX, y: event.clientY };
  showContextMenu.value = true;
}

async function handleCopyFromMenu() {
  try {
    await navigator.clipboard.writeText(props.message.content);
    toast.success(t('aiMessageActions.copied'));
  } catch (err) {
    console.error('Failed to copy:', err);
  }
  showContextMenu.value = false;
}

function handleDeleteFromMenu() {
  emit('delete', props.message);
  showContextMenu.value = false;
}

function handleClickOutside() {
  if (showContextMenu.value) {
    showContextMenu.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style lang="scss" scoped>
.ai-message {
  padding: 0 16px;
  
  &--user {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
  }
  
  &--assistant {
    margin-bottom: 8px;
  }
}

// User message - bubble style
.user-message {
  position: relative;
  max-width: 85%;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  
  &__content {
    padding: 12px 16px;
    background: var(--primary);
    color: var(--primary-foreground);
    border-radius: 18px 18px 4px 18px;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }
  
  &__copy {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--muted-foreground);
    border-radius: 6px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s, background 0.15s;
    
    svg {
      width: 14px;
      height: 14px;
    }
    
    &:hover {
      background: var(--muted);
      color: var(--foreground);
    }
  }
  
  &:hover .user-message__copy {
    opacity: 1;
  }
}

// Assistant message - timeline style
.assistant-message {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// Content segments
.segment {
  &--tool {
    // Tool cards have their own styling
  }
  
  &--text {
    font-size: 14px;
    line-height: 1.6;
    color: var(--foreground);
    
    // Markdown styles
    :deep(p) {
      margin: 0 0 8px 0;
      &:last-child { margin-bottom: 0; }
    }
    
    :deep(h1), :deep(h2), :deep(h3), :deep(h4) {
      margin: 16px 0 8px 0;
      font-weight: 600;
      &:first-child { margin-top: 0; }
    }
    
    :deep(h1) { font-size: 1.2em; }
    :deep(h2) { font-size: 1.1em; }
    :deep(h3) { font-size: 1.05em; }
    
    :deep(ul), :deep(ol) {
      margin: 8px 0;
      padding-left: 20px;
    }
    
    :deep(li) {
      margin: 4px 0;
    }
    
    :deep(code) {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9em;
      padding: 2px 6px;
      background: var(--muted);
      border-radius: 4px;
      color: var(--code-color, #e879f9);
    }
    
    :deep(pre) {
      margin: 12px 0;
      padding: 12px 16px;
      background: var(--code-bg, #1e1e2e);
      border-radius: 8px;
      overflow-x: auto;
      
      code {
        padding: 0;
        background: transparent;
        color: var(--code-foreground, #cdd6f4);
        font-size: 13px;
        line-height: 1.5;
      }
    }
    
    :deep(blockquote) {
      margin: 12px 0;
      padding: 8px 16px;
      border-left: 3px solid var(--primary);
      background: var(--muted);
      border-radius: 0 8px 8px 0;
    }
    
    :deep(a) {
      color: var(--primary);
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
    
    :deep(strong) {
      font-weight: 600;
    }
    
    :deep(table) {
      width: 100%;
      margin: 12px 0;
      border-collapse: collapse;
      font-size: 13px;
      
      th, td {
        padding: 8px 12px;
        border: 1px solid var(--border);
        text-align: left;
      }
      
      th {
        background: var(--muted);
        font-weight: 600;
      }
    }
  }
}

// Streaming cursor
.streaming-cursor {
  display: inline-block;
  color: var(--primary);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

// Context menu
.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 160px;
  background: var(--popover);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px;
  
  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: transparent;
    color: var(--foreground);
    font-size: 13px;
    text-align: left;
    border-radius: 6px;
    cursor: pointer;
    
    svg {
      width: 16px;
      height: 16px;
    }
    
    &:hover {
      background: var(--accent);
    }
    
    &--danger {
      color: var(--destructive);
      &:hover { background: rgba(239, 68, 68, 0.1); }
    }
  }
}
</style>
