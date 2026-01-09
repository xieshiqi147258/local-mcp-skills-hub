<template>
  <div class="ai-panel-header">
    <!-- Left: Title and workspace path -->
    <div class="header-left">
      <h3 class="panel-title">
        <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
          <circle cx="7.5" cy="14.5" r="1.5"/>
          <circle cx="16.5" cy="14.5" r="1.5"/>
        </svg>
        {{ t('aiPanel.title') }}
      </h3>
      
      <!-- Workspace path indicator (Requirement 1.4) -->
      <div v-if="workspacePath" class="workspace-indicator" :title="workspacePath">
        <svg class="workspace-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <span class="workspace-path">{{ truncatedPath }}</span>
      </div>
      
      <!-- No workspace warning (Requirement 1.2) -->
      <div v-else class="workspace-warning" @click="handleGoToSettings">
        <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span class="warning-text">{{ t('aiPanelHeader.noWorkspace') }}</span>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="header-right">
      <!-- Conversation dropdown toggle -->
      <button 
        class="header-btn conversation-btn"
        @click="toggleConversationList"
        :title="t('aiPanelHeader.conversations')"
        :class="{ active: showConversationList }"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span v-if="conversationCount > 0" class="conversation-count">{{ conversationCount }}</span>
      </button>
      
      <!-- New conversation button -->
      <button 
        class="header-btn new-chat-btn"
        @click="handleNewConversation"
        :title="t('aiConversation.newChat')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      
      <!-- Close button -->
      <button 
        class="header-btn close-btn"
        @click="handleClose"
        :title="t('common.close')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@/i18n';
import { useSettingsStore } from '@/stores/settings';
import { useAiStore } from '@/stores/ai';

// Props - used in template via showConversationList
interface Props {
  showConversationList?: boolean;
}

withDefaults(defineProps<Props>(), {
  showConversationList: false,
});

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'new-conversation'): void;
  (e: 'toggle-conversation-list'): void;
  (e: 'go-to-settings'): void;
}>();

// Stores and i18n
const settingsStore = useSettingsStore();
const aiStore = useAiStore();
const { t } = useI18n();

// Computed
const workspacePath = computed(() => settingsStore.skillsPath);

const truncatedPath = computed(() => {
  const path = workspacePath.value;
  if (!path) return '';
  
  const maxLength = 30;
  if (path.length <= maxLength) return path;
  
  // Show last part of path
  const parts = path.split(/[/\\]/);
  if (parts.length <= 2) {
    return '...' + path.slice(-maxLength + 3);
  }
  
  // Show first and last folder
  const lastPart = parts[parts.length - 1] || parts[parts.length - 2];
  return '.../' + lastPart;
});

const conversationCount = computed(() => aiStore.getConversationCount());

// Methods
function handleClose() {
  emit('close');
}

function handleNewConversation() {
  emit('new-conversation');
}

function toggleConversationList() {
  emit('toggle-conversation-list');
}

function handleGoToSettings() {
  emit('go-to-settings');
}
</script>

<style lang="scss" scoped>
.ai-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
  background-color: var(--card);
  flex-shrink: 0;
  gap: var(--space-3);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  flex: 1;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 14px;
  font-weight: 600;
  color: var(--foreground);
  margin: 0;
}

.title-icon {
  width: 18px;
  height: 18px;
  color: var(--primary);
  flex-shrink: 0;
}

// Workspace indicator (Requirement 1.4)
.workspace-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 11px;
  color: var(--muted-foreground);
  padding: var(--space-1) 0;
}

.workspace-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.workspace-path {
  font-family: var(--font-mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// No workspace warning (Requirement 1.2)
.workspace-warning {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 11px;
  color: var(--warning, #F59E0B);
  padding: var(--space-1) var(--space-2);
  background-color: rgba(245, 158, 11, 0.1);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: rgba(245, 158, 11, 0.15);
  }
}

.warning-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.warning-text {
  white-space: nowrap;
}

// Header right actions
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}

.header-btn {
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
  position: relative;

  &:hover {
    background-color: var(--accent);
    color: var(--foreground);
  }

  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  svg {
    width: 16px;
    height: 16px;
  }
}

.conversation-btn {
  &.active {
    background-color: var(--accent);
    color: var(--primary);
  }
}

.conversation-count {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 14px;
  height: 14px;
  padding: 0 4px;
  font-size: 9px;
  font-weight: 600;
  color: var(--primary-foreground);
  background-color: var(--primary);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}

.new-chat-btn {
  background-color: var(--primary);
  color: var(--primary-foreground);

  &:hover {
    opacity: 0.9;
    background-color: var(--primary);
    color: var(--primary-foreground);
  }
}

.close-btn {
  &:hover {
    background-color: var(--destructive);
    color: var(--destructive-foreground);
  }
}

// Responsive
@media (max-width: 400px) {
  .workspace-indicator,
  .workspace-warning {
    display: none;
  }
}

// Reduced motion
@media (prefers-reduced-motion: reduce) {
  .header-btn,
  .workspace-warning {
    transition: none;
  }
}
</style>
