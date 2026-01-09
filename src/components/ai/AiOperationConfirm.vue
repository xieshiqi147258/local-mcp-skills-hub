<template>
  <Teleport to="body">
    <Transition name="fade">
      <div 
        v-if="isVisible"
        class="ai-operation-confirm-overlay"
        @click.self="handleOverlayClick"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="dialogTitleId"
        :aria-describedby="dialogDescId"
      >
        <div 
          class="ai-operation-confirm"
          ref="dialogRef"
          @keydown="handleKeydown"
        >
          <!-- Header -->
          <div class="ai-operation-confirm__header">
            <div class="ai-operation-confirm__title" :id="dialogTitleId">
              <span class="operation-icon" :class="operationIconClass">
                <component :is="operationIcon" />
              </span>
              <span class="operation-name">{{ operationLabel }}</span>
            </div>
            <button 
              class="close-btn"
              @click="handleClose"
              :aria-label="t('common.close')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="ai-operation-confirm__content" :id="dialogDescId">
            <!-- File Path -->
            <div class="file-path-section">
              <span class="section-label">{{ t('aiOperationConfirm.path') }}</span>
              <div class="file-path">
                <span class="file-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </span>
                <code class="path-text">{{ operation?.params?.path || '' }}</code>
              </div>
            </div>

            <!-- Content Preview (for create/edit operations) -->
            <div v-if="hasContentPreview" class="content-preview-section">
              <span class="section-label">{{ t('aiOperationConfirm.contentPreview') }}</span>
              <div class="content-preview">
                <pre><code>{{ truncatedContent }}</code></pre>
                <button 
                  v-if="isContentTruncated"
                  class="show-more-btn"
                  @click="showFullContent = !showFullContent"
                >
                  {{ showFullContent ? t('aiOperationConfirm.showLess') : t('aiOperationConfirm.showMore') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Confirmation Options -->
          <div class="ai-operation-confirm__options">
            <label class="option-item">
              <input 
                type="radio" 
                name="confirmOption" 
                value="approve-once"
                v-model="selectedOption"
              />
              <span class="option-label">{{ t('aiOperationConfirm.approveOnce') }}</span>
            </label>
            <label class="option-item">
              <input 
                type="radio" 
                name="confirmOption" 
                value="approve-session"
                v-model="selectedOption"
              />
              <span class="option-label">{{ t('aiOperationConfirm.approveSession') }}</span>
            </label>
            <label class="option-item">
              <input 
                type="radio" 
                name="confirmOption" 
                value="reject-once"
                v-model="selectedOption"
              />
              <span class="option-label">{{ t('aiOperationConfirm.rejectOnce') }}</span>
            </label>
            <label class="option-item">
              <input 
                type="radio" 
                name="confirmOption" 
                value="reject-stop"
                v-model="selectedOption"
              />
              <span class="option-label">{{ t('aiOperationConfirm.rejectStop') }}</span>
            </label>
          </div>

          <!-- Actions -->
          <div class="ai-operation-confirm__actions">
            <button 
              class="action-btn action-btn--reject"
              @click="handleReject"
              :disabled="isProcessing"
            >
              <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              <span>{{ t('aiOperationConfirm.reject') }}</span>
              <kbd class="shortcut">Esc</kbd>
            </button>
            <button 
              class="action-btn action-btn--approve"
              @click="handleApprove"
              :disabled="isProcessing"
              ref="approveButtonRef"
            >
              <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>{{ t('aiOperationConfirm.approve') }}</span>
              <kbd class="shortcut">Enter</kbd>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted, h } from 'vue';
import { useI18n } from '@/i18n';
import type { ToolCall } from '@/stores/ai';

// Types
export type ConfirmOption = 'approve-once' | 'approve-session' | 'reject-once' | 'reject-stop';

export interface OperationLogEntry {
  id: string;
  timestamp: number;
  operationType: string;
  path: string;
  action: 'approved' | 'rejected';
  option: ConfirmOption;
}

// Props
interface Props {
  isVisible: boolean;
  operation: ToolCall | null;
  isProcessing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isProcessing: false,
});

// Emits
const emit = defineEmits<{
  (e: 'approve', option: ConfirmOption): void;
  (e: 'reject', option: ConfirmOption): void;
  (e: 'close'): void;
  (e: 'log', entry: OperationLogEntry): void;
}>();

// i18n
const { t } = useI18n();

// Refs
const dialogRef = ref<HTMLElement | null>(null);
const approveButtonRef = ref<HTMLButtonElement | null>(null);
const selectedOption = ref<ConfirmOption>('approve-once');
const showFullContent = ref(false);

// IDs for accessibility
const dialogTitleId = `dialog-title-${Date.now()}`;
const dialogDescId = `dialog-desc-${Date.now()}`;

// Operation type icons
const operationIcons: Record<string, any> = {
  create_folder: {
    render() {
      return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' }),
        h('line', { x1: '12', y1: '11', x2: '12', y2: '17' }),
        h('line', { x1: '9', y1: '14', x2: '15', y2: '14' }),
      ]);
    }
  },
  create_file: {
    render() {
      return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
        h('polyline', { points: '14 2 14 8 20 8' }),
        h('line', { x1: '12', y1: '18', x2: '12', y2: '12' }),
        h('line', { x1: '9', y1: '15', x2: '15', y2: '15' }),
      ]);
    }
  },
  edit_file: {
    render() {
      return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' }),
        h('path', { d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' }),
      ]);
    }
  },
  delete_file: {
    render() {
      return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('polyline', { points: '3 6 5 6 21 6' }),
        h('path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }),
        h('line', { x1: '10', y1: '11', x2: '10', y2: '17' }),
        h('line', { x1: '14', y1: '11', x2: '14', y2: '17' }),
      ]);
    }
  },
  read_file: {
    render() {
      return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
        h('polyline', { points: '14 2 14 8 20 8' }),
        h('line', { x1: '16', y1: '13', x2: '8', y2: '13' }),
        h('line', { x1: '16', y1: '17', x2: '8', y2: '17' }),
        h('polyline', { points: '10 9 9 9 8 9' }),
      ]);
    }
  },
  list_files: {
    render() {
      return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' }),
      ]);
    }
  },
};

// Computed
const operationIcon = computed(() => {
  const name = props.operation?.name || '';
  return operationIcons[name] || operationIcons.read_file;
});

const operationIconClass = computed(() => {
  const name = props.operation?.name || '';
  return {
    'icon--create': name.includes('create'),
    'icon--edit': name === 'edit_file',
    'icon--delete': name === 'delete_file',
    'icon--read': name === 'read_file' || name === 'list_files',
  };
});

const operationLabel = computed(() => {
  const name = props.operation?.name || '';
  const labels: Record<string, string> = {
    create_folder: t('aiOperationConfirm.createFolder'),
    create_file: t('aiOperationConfirm.createFile'),
    edit_file: t('aiOperationConfirm.editFile'),
    delete_file: t('aiOperationConfirm.deleteFile'),
    read_file: t('aiOperationConfirm.readFile'),
    list_files: t('aiOperationConfirm.listFiles'),
  };
  return labels[name] || name;
});

const hasContentPreview = computed(() => {
  const name = props.operation?.name || '';
  return ['create_file', 'edit_file'].includes(name) && props.operation?.params?.content;
});

const contentToPreview = computed(() => {
  return props.operation?.params?.content || '';
});

const isContentTruncated = computed(() => {
  return contentToPreview.value.length > 500 || contentToPreview.value.split('\n').length > 10;
});

const truncatedContent = computed(() => {
  if (showFullContent.value) {
    return contentToPreview.value;
  }
  const lines = contentToPreview.value.split('\n');
  if (lines.length > 10) {
    return lines.slice(0, 10).join('\n') + '\n...';
  }
  if (contentToPreview.value.length > 500) {
    return contentToPreview.value.substring(0, 500) + '...';
  }
  return contentToPreview.value;
});

// Methods
function handleApprove() {
  const option = selectedOption.value;
  logOperation('approved', option);
  emit('approve', option);
}

function handleReject() {
  const option = selectedOption.value.startsWith('reject') ? selectedOption.value : 'reject-once';
  logOperation('rejected', option as ConfirmOption);
  emit('reject', option as ConfirmOption);
}

function handleClose() {
  emit('close');
}

function handleOverlayClick() {
  // Don't close on overlay click - require explicit action
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    handleReject();
  } else if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleApprove();
  }
}

function logOperation(action: 'approved' | 'rejected', option: ConfirmOption) {
  if (!props.operation) return;
  
  const entry: OperationLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    operationType: props.operation.name,
    path: props.operation.params?.path || '',
    action,
    option,
  };
  
  emit('log', entry);
  
  // Also save to localStorage for audit
  saveOperationLog(entry);
}

function saveOperationLog(entry: OperationLogEntry) {
  try {
    const key = 'ai_operation_logs';
    const existing = localStorage.getItem(key);
    const logs: OperationLogEntry[] = existing ? JSON.parse(existing) : [];
    logs.unshift(entry);
    // Keep only last 100 entries
    const trimmed = logs.slice(0, 100);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save operation log:', e);
  }
}

// Focus management
watch(() => props.isVisible, async (visible) => {
  if (visible) {
    selectedOption.value = 'approve-once';
    showFullContent.value = false;
    await nextTick();
    approveButtonRef.value?.focus();
  }
});

// Trap focus within dialog
function trapFocus(event: KeyboardEvent) {
  if (!props.isVisible || event.key !== 'Tab') return;
  
  const focusableElements = dialogRef.value?.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (!focusableElements || focusableElements.length === 0) return;
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

onMounted(() => {
  document.addEventListener('keydown', trapFocus);
});

onUnmounted(() => {
  document.removeEventListener('keydown', trapFocus);
});
</script>


<style lang="scss" scoped>
.ai-operation-confirm-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
  backdrop-filter: blur(4px);
}

.ai-operation-confirm {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

// Header
.ai-operation-confirm__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
  background-color: var(--muted);
}

.ai-operation-confirm__title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: 15px;
  font-weight: 600;
  color: var(--foreground);
}

.operation-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  
  svg {
    width: 18px;
    height: 18px;
  }

  &.icon--create {
    background-color: rgba(34, 197, 94, 0.15);
    color: var(--tool-success);
  }

  &.icon--edit {
    background-color: rgba(59, 130, 246, 0.15);
    color: var(--primary);
  }

  &.icon--delete {
    background-color: rgba(239, 68, 68, 0.15);
    color: var(--tool-error);
  }

  &.icon--read {
    background-color: rgba(100, 116, 139, 0.15);
    color: var(--muted-foreground);
  }
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--muted-foreground);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: var(--accent);
    color: var(--foreground);
  }

  svg {
    width: 16px;
    height: 16px;
  }
}

// Content
.ai-operation-confirm__content {
  padding: var(--space-4);
  overflow-y: auto;
  flex: 1;
}

.section-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted-foreground);
  margin-bottom: var(--space-2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.file-path-section {
  margin-bottom: var(--space-4);
}

.file-path {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background-color: var(--muted);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted-foreground);
  flex-shrink: 0;

  svg {
    width: 16px;
    height: 16px;
  }
}

.path-text {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--foreground);
  word-break: break-all;
}

.content-preview-section {
  margin-bottom: var(--space-4);
}

.content-preview {
  position: relative;
  background-color: var(--muted);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  overflow: hidden;

  pre {
    margin: 0;
    padding: var(--space-3);
    max-height: 200px;
    overflow: auto;
    
    code {
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.5;
      color: var(--foreground);
      white-space: pre-wrap;
      word-break: break-word;
    }
  }
}

.show-more-btn {
  display: block;
  width: 100%;
  padding: var(--space-2);
  border: none;
  border-top: 1px solid var(--border);
  background-color: var(--card);
  color: var(--primary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: var(--accent);
  }
}

// Options
.ai-operation-confirm__options {
  padding: 0 var(--space-4) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.option-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: var(--accent);
  }

  input[type="radio"] {
    width: 16px;
    height: 16px;
    accent-color: var(--primary);
    cursor: pointer;
  }

  .option-label {
    font-size: 13px;
    color: var(--foreground);
  }
}

// Actions
.ai-operation-confirm__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4);
  border-top: 1px solid var(--border);
  background-color: var(--muted);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-icon {
    width: 16px;
    height: 16px;
  }

  .shortcut {
    margin-left: var(--space-2);
    padding: 2px 6px;
    font-size: 11px;
    font-family: var(--font-mono);
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: var(--radius-sm);
    opacity: 0.7;
  }

  &--approve {
    background-color: var(--tool-success);
    color: white;

    &:hover:not(:disabled) {
      filter: brightness(0.9);
    }

    .shortcut {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }

  &--reject {
    background-color: var(--card);
    color: var(--foreground);
    border: 1px solid var(--border);

    &:hover:not(:disabled) {
      background-color: var(--accent);
      border-color: var(--tool-error);
      color: var(--tool-error);
    }
  }
}

// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-normal) var(--ease-default);
  
  .ai-operation-confirm {
    transition: transform var(--duration-normal) var(--ease-out);
  }
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  
  .ai-operation-confirm {
    transform: scale(0.95) translateY(-10px);
  }
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  
  .ai-operation-confirm {
    transform: scale(1) translateY(0);
  }
}

// Respect reduced motion preference
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .action-btn,
  .option-item,
  .close-btn,
  .show-more-btn {
    transition: none;
  }
}

// Responsive
@media (max-width: 480px) {
  .ai-operation-confirm {
    max-width: 100%;
    margin: var(--space-2);
  }

  .ai-operation-confirm__actions {
    flex-direction: column-reverse;
    
    .action-btn {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>
