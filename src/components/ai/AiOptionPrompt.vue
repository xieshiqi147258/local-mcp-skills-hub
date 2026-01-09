<template>
  <div class="ai-option-prompt">
    <!-- Category Label -->
    <div v-if="category" class="option-category">
      {{ category }}
    </div>

    <!-- Option Buttons (Requirement 7.2) -->
    <div class="option-buttons">
      <button
        v-for="option in options"
        :key="option.id"
        class="option-btn"
        :class="{ selected: selectedOptionId === option.id }"
        @click="handleOptionSelect(option)"
      >
        <span class="option-label">{{ option.label }}</span>
        <span v-if="option.description" class="option-desc">{{ option.description }}</span>
      </button>

      <!-- "Other" Option (Requirement 7.3) -->
      <button
        v-if="allowOther"
        class="option-btn other-btn"
        :class="{ selected: isOtherSelected }"
        @click="handleOtherClick"
      >
        <span class="option-label">{{ t('textSelection.other') }}</span>
      </button>
    </div>

    <!-- Custom Input for "Other" (Requirement 7.5) -->
    <Transition name="fade">
      <div v-if="isOtherSelected" class="other-input-wrapper">
        <a-textarea
          v-model="customInput"
          :placeholder="t('aiOptionPrompt.customPlaceholder')"
          :auto-size="{ minRows: 1, maxRows: 3 }"
          @keydown.enter.exact.prevent="submitCustomInput"
        />
        <button
          class="submit-btn"
          :disabled="!customInput.trim()"
          @click="submitCustomInput"
        >
          ➤
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '@/i18n';
import type { OptionItem } from '@/stores/ai';

// Props (from design.md interface)
interface Props {
  options: OptionItem[];
  allowOther?: boolean;
  category?: string;
}

withDefaults(defineProps<Props>(), {
  allowOther: true,
  category: '',
});

// Emits
const emit = defineEmits<{
  (e: 'select', option: OptionItem | string): void;
}>();

// i18n
const { t } = useI18n();

// Local state
const selectedOptionId = ref<string | null>(null);
const isOtherSelected = ref(false);
const customInput = ref('');

// Methods

/**
 * Handle option button click (Requirement 7.4)
 */
function handleOptionSelect(option: OptionItem) {
  selectedOptionId.value = option.id;
  isOtherSelected.value = false;
  customInput.value = '';
  emit('select', option);
}

/**
 * Handle "Other" button click
 */
function handleOtherClick() {
  selectedOptionId.value = null;
  isOtherSelected.value = true;
}

/**
 * Submit custom input (Requirement 7.5)
 */
function submitCustomInput() {
  if (!customInput.value.trim()) return;
  emit('select', customInput.value.trim());
  customInput.value = '';
  isOtherSelected.value = false;
}

/**
 * Reset selection state
 */
function reset() {
  selectedOptionId.value = null;
  isOtherSelected.value = false;
  customInput.value = '';
}

// Expose reset method for parent components
defineExpose({ reset });
</script>

<style lang="scss" scoped>
.ai-option-prompt {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3) 0;
}

.option-category {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.option-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.option-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
  text-align: left;
  min-width: 80px;

  &:hover {
    background-color: var(--accent);
    border-color: var(--primary);
  }

  &.selected {
    background-color: var(--primary);
    border-color: var(--primary);
    color: var(--primary-foreground);
  }

  &.other-btn {
    border-style: dashed;
  }
}

.option-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--foreground);
  line-height: 1.3;

  .selected & {
    color: var(--primary-foreground);
  }
}

.option-desc {
  font-size: 11px;
  color: var(--muted-foreground);
  line-height: 1.3;

  .selected & {
    color: var(--primary-foreground);
    opacity: 0.9;
  }
}

.other-input-wrapper {
  display: flex;
  gap: var(--space-2);
  align-items: flex-end;
  margin-top: var(--space-1);

  :deep(.arco-textarea-wrapper) {
    flex: 1;
    background-color: var(--input);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-2) var(--space-3);

    &:focus-within {
      border-color: var(--ring);
    }
  }

  :deep(.arco-textarea) {
    resize: none;
    font-size: 13px;
    line-height: 1.5;
    color: var(--foreground);
    
    &::placeholder {
      color: var(--muted-foreground);
    }
  }
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
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
}

// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-normal) var(--ease-default),
              transform var(--duration-normal) var(--ease-default);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
