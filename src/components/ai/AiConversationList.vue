<template>
  <div class="conversation-list">
    <!-- Header with title and new chat button -->
    <div class="conversation-header">
      <h4 class="conversation-title">
        <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {{ t('aiConversation.title') }}
      </h4>
      <button 
        class="new-chat-btn" 
        @click="handleNewChat"
        :title="t('aiConversation.newChat')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>

    <!-- Conversation list -->
    <div class="conversation-items" v-if="aiStore.conversations.length > 0">
      <div
        v-for="conversation in aiStore.conversations"
        :key="conversation.id"
        class="conversation-item"
        :class="{ active: conversation.id === aiStore.currentConversationId }"
        @click="handleSelectConversation(conversation.id)"
      >
        <!-- Conversation info -->
        <div class="conversation-info">
          <div class="conversation-name" v-if="!isEditing(conversation.id)">
            {{ conversation.title }}
          </div>
          <input
            v-else
            ref="renameInputRef"
            v-model="editingTitle"
            class="rename-input"
            @blur="handleRenameBlur(conversation.id)"
            @keydown.enter="handleRenameConfirm(conversation.id)"
            @keydown.escape="handleRenameCancel"
            @click.stop
          />
          <div class="conversation-meta">
            <span class="conversation-date">{{ formatDate(conversation.updatedAt) }}</span>
            <span class="conversation-count">
              {{ t('aiConversation.messages', { count: String(conversation.messages.length) }) }}
            </span>
          </div>
        </div>

        <!-- Actions (visible on hover) -->
        <div class="conversation-actions" @click.stop>
          <button 
            class="action-btn" 
            @click="handleStartRename(conversation)"
            :title="t('aiConversation.rename')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button 
            class="action-btn action-btn-danger" 
            @click="handleDelete(conversation.id)"
            :title="t('aiConversation.delete')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div class="conversation-empty" v-else>
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <p class="empty-text">{{ t('aiConversation.empty') }}</p>
      <p class="empty-desc">{{ t('aiConversation.emptyDesc') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useAiStore, type Conversation } from '@/stores/ai';
import { useI18n } from '@/i18n';

// Emits
const emit = defineEmits<{
  (e: 'select', conversationId: string): void;
  (e: 'new'): void;
  (e: 'delete', conversationId: string): void;
  (e: 'rename', conversationId: string, newTitle: string): void;
}>();

// Store and i18n
const aiStore = useAiStore();
const { t } = useI18n();

// Rename state
const editingConversationId = ref<string | null>(null);
const editingTitle = ref('');
const renameInputRef = ref<HTMLInputElement[]>([]);

/**
 * Check if a conversation is being edited
 */
function isEditing(conversationId: string): boolean {
  return editingConversationId.value === conversationId;
}

/**
 * Format date to relative time (Requirement 12.3)
 */
function formatDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return t('aiConversation.today');
  } else if (days === 1) {
    return t('aiConversation.yesterday');
  } else {
    return t('aiConversation.daysAgo', { days: String(days) });
  }
}

/**
 * Handle new chat button click (Requirement 12.4)
 */
function handleNewChat(): void {
  aiStore.createConversation();
  emit('new');
}

/**
 * Handle conversation selection (Requirement 12.4)
 */
function handleSelectConversation(conversationId: string): void {
  if (editingConversationId.value) return; // Don't switch while editing
  
  aiStore.switchConversation(conversationId);
  emit('select', conversationId);
}

/**
 * Start renaming a conversation (Requirement 12.4)
 */
async function handleStartRename(conversation: Conversation): Promise<void> {
  editingConversationId.value = conversation.id;
  editingTitle.value = conversation.title;
  
  await nextTick();
  // Focus the input
  const inputs = document.querySelectorAll('.rename-input');
  const input = inputs[0] as HTMLInputElement;
  if (input) {
    input.focus();
    input.select();
  }
}

/**
 * Confirm rename (Requirement 12.4)
 */
function handleRenameConfirm(conversationId: string): void {
  if (editingTitle.value.trim()) {
    aiStore.renameConversation(conversationId, editingTitle.value.trim());
    emit('rename', conversationId, editingTitle.value.trim());
  }
  editingConversationId.value = null;
  editingTitle.value = '';
}

/**
 * Handle rename input blur
 */
function handleRenameBlur(conversationId: string): void {
  // Small delay to allow click events to fire first
  setTimeout(() => {
    if (editingConversationId.value === conversationId) {
      handleRenameConfirm(conversationId);
    }
  }, 100);
}

/**
 * Cancel rename
 */
function handleRenameCancel(): void {
  editingConversationId.value = null;
  editingTitle.value = '';
}

/**
 * Handle delete conversation (Requirement 12.4)
 */
function handleDelete(conversationId: string): void {
  if (confirm(t('aiConversation.confirmDelete'))) {
    aiStore.deleteConversation(conversationId);
    emit('delete', conversationId);
  }
}
</script>


<style lang="scss" scoped>
.conversation-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  overflow: hidden;
}

.conversation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
  background-color: var(--card);
  flex-shrink: 0;
}

.conversation-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 14px;
  font-weight: 600;
  color: var(--foreground);
  margin: 0;
}

.title-icon {
  width: 16px;
  height: 16px;
  color: var(--muted-foreground);
}

.new-chat-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background-color: var(--primary);
  color: var(--primary-foreground);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: opacity var(--duration-fast) var(--ease-default);

  &:hover {
    opacity: 0.9;
  }

  svg {
    width: 14px;
    height: 14px;
  }
}

.conversation-items {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.conversation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  margin-bottom: var(--space-1);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: var(--accent);

    .conversation-actions {
      opacity: 1;
    }
  }

  &.active {
    background-color: var(--sidebar-accent);
    
    .conversation-name {
      color: var(--primary);
      font-weight: 500;
    }

    // Show indicator for active conversation
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 60%;
      background-color: var(--primary);
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    }
  }

  position: relative;
}

.conversation-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.conversation-name {
  font-size: 13px;
  font-weight: 400;
  color: var(--foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rename-input {
  width: 100%;
  padding: var(--space-1) var(--space-2);
  font-size: 13px;
  font-weight: 400;
  color: var(--foreground);
  background-color: var(--background);
  border: 1px solid var(--ring);
  border-radius: var(--radius-sm);
  outline: none;

  &:focus {
    box-shadow: 0 0 0 2px oklch(0.65 0.22 270 / 0.15);
  }
}

.conversation-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 11px;
  color: var(--muted-foreground);
}

.conversation-date {
  white-space: nowrap;
}

.conversation-count {
  white-space: nowrap;
  
  &::before {
    content: '•';
    margin-right: var(--space-2);
  }
}

.conversation-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-default);
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--muted-foreground);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: var(--muted);
    color: var(--foreground);
  }

  &.action-btn-danger:hover {
    background-color: oklch(0.55 0.22 25 / 0.15);
    color: var(--destructive);
  }

  svg {
    width: 14px;
    height: 14px;
  }
}

.conversation-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  text-align: center;
  flex: 1;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: var(--muted-foreground);
  opacity: 0.5;
  margin-bottom: var(--space-3);
}

.empty-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--foreground);
  margin: 0 0 var(--space-1) 0;
}

.empty-desc {
  font-size: 12px;
  color: var(--muted-foreground);
  margin: 0;
}

// Scrollbar styling
.conversation-items {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: var(--radius-full);

    &:hover {
      background: var(--scrollbar-thumb-hover);
    }
  }
}

// Reduced motion
@media (prefers-reduced-motion: reduce) {
  .conversation-item,
  .conversation-actions,
  .action-btn,
  .new-chat-btn {
    transition: none;
  }
}
</style>
