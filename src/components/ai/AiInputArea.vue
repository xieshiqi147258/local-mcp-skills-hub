<template>
  <div class="ai-input-area">
    <div class="input-wrapper">
      <div class="input-container" :class="{ focused: isFocused }">
        <textarea
          ref="textareaRef"
          v-model="inputText"
          :placeholder="placeholder"
          :disabled="disabled"
          class="input-textarea"
          rows="1"
          @input="handleInput"
          @keydown="handleKeyDown"
          @focus="isFocused = true"
          @blur="isFocused = false"
        ></textarea>
      </div>
      
      <button 
        class="send-btn" 
        @click="handleSend" 
        :disabled="!canSend"
        :title="t('ai.send')"
      >
        <svg v-if="!isLoading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        <svg v-else class="loading-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useI18n } from '@/i18n';

// Props
interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  maxChars?: number;
  sendOnEnter?: boolean; // true = Enter sends, false = Ctrl+Enter sends
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  disabled: false,
  isLoading: false,
  maxChars: 4000,
  sendOnEnter: false, // Default: Ctrl+Enter to send
});

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'send', message: string): void;
  (e: 'edit-last'): void;
  (e: 'clear'): void;
}>();

// i18n
const { t } = useI18n();

// Refs
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const isFocused = ref(false);

// Local state
const inputText = ref(props.modelValue);

// Computed
const canSend = computed(() => {
  return inputText.value.trim().length > 0 && !props.disabled && !props.isLoading;
});

// Watch for external model changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== inputText.value) {
    inputText.value = newValue;
  }
});

// Watch for internal changes
watch(inputText, (newValue) => {
  emit('update:modelValue', newValue);
  adjustTextareaHeight();
});

// Methods
function handleInput() {
  adjustTextareaHeight();
}

function handleKeyDown(event: KeyboardEvent) {
  // Ctrl+Enter or Enter to send (based on config)
  if (event.key === 'Enter') {
    if (props.sendOnEnter && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      // Enter sends (Shift+Enter for new line)
      event.preventDefault();
      handleSend();
    } else if (!props.sendOnEnter && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
      // Ctrl+Enter sends
      event.preventDefault();
      handleSend();
    }
    // Shift+Enter always creates new line (default behavior)
  }
  
  // Up arrow to edit last message (when input is empty)
  if (event.key === 'ArrowUp' && inputText.value === '') {
    event.preventDefault();
    emit('edit-last');
  }
  
  // Escape to clear input
  if (event.key === 'Escape') {
    event.preventDefault();
    inputText.value = '';
    emit('clear');
  }
}

function handleSend() {
  if (!canSend.value) return;
  
  const message = inputText.value.trim();
  emit('send', message);
  inputText.value = '';
  
  nextTick(() => {
    adjustTextareaHeight();
    textareaRef.value?.focus();
  });
}

function adjustTextareaHeight() {
  const textarea = textareaRef.value;
  if (!textarea) return;
  
  // Reset height to auto to get the correct scrollHeight
  textarea.style.height = 'auto';
  
  // Calculate new height (max 4 rows)
  const lineHeight = 20; // Approximate line height
  const maxRows = 4;
  const maxHeight = lineHeight * maxRows + 16; // 16px for padding
  const newHeight = Math.min(textarea.scrollHeight, maxHeight);
  
  textarea.style.height = `${newHeight}px`;
}

// Focus the input
function focus() {
  textareaRef.value?.focus();
}

// Lifecycle
onMounted(() => {
  adjustTextareaHeight();
});

// Expose methods
defineExpose({
  focus,
});
</script>

<style lang="scss" scoped>
.ai-input-area {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border);
  background-color: var(--background);
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  gap: var(--space-2);
  align-items: flex-end;
}

.input-container {
  flex: 1;
  background-color: var(--input);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  transition: border-color var(--duration-fast) var(--ease-default),
              box-shadow var(--duration-fast) var(--ease-default);

  &.focused {
    border-color: var(--ring);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
}

.input-textarea {
  width: 100%;
  min-height: 36px;
  max-height: 96px; // ~4 rows
  padding: var(--space-2) var(--space-3);
  font-size: 13px;
  font-family: inherit;
  line-height: 1.5;
  color: var(--foreground);
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  overflow-y: auto;

  &::placeholder {
    color: var(--muted-foreground);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  // Custom scrollbar
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--border);
    border-radius: 2px;
  }
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background-color: var(--primary);
  color: var(--primary-foreground);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--duration-fast) var(--ease-default);

  &:hover:not(:disabled) {
    opacity: 0.9;
    box-shadow: var(--shadow-md);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  svg {
    width: 18px;
    height: 18px;
  }

  .loading-spinner {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Reduced motion
@media (prefers-reduced-motion: reduce) {
  .send-btn {
    transition: none;
  }

  .loading-spinner {
    animation: none;
  }
}
</style>
