<template>
  <div 
    class="tool-result-card"
    :class="[
      `tool-result-card--${status}`,
      { 'tool-result-card--expanded': isExpanded }
    ]"
    role="article"
    :aria-label="ariaLabel"
  >
    <!-- Header (always visible) -->
    <div class="tool-result-card__header" @click="toggleExpand">
      <!-- Status Icon -->
      <div class="tool-result-card__icon">
        <Transition name="icon-fade" mode="out-in">
          <svg 
            v-if="status === 'success'" 
            key="success"
            class="status-icon status-icon--success" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2.5" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" class="checkmark-path" />
          </svg>
          <svg 
            v-else 
            key="error"
            class="status-icon status-icon--error" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2.5" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" class="x-path-1" />
            <line x1="6" y1="6" x2="18" y2="18" class="x-path-2" />
          </svg>
        </Transition>
      </div>

      <!-- Tool Info -->
      <div class="tool-result-card__info">
        <span class="tool-result-card__tool-icon" aria-hidden="true">{{ toolIcon }}</span>
        <span class="tool-result-card__tool-name">{{ toolName }}</span>
        <span v-if="path" class="tool-result-card__path" :title="path">{{ truncatedPath }}</span>
      </div>

      <!-- Status Text -->
      <span class="tool-result-card__status-text">
        {{ statusText }}
      </span>

      <!-- Expand Button -->
      <button 
        v-if="hasDetails"
        class="tool-result-card__expand-btn"
        :aria-expanded="isExpanded"
        :aria-label="isExpanded ? t('aiToolResult.collapse') : t('aiToolResult.expand')"
        @click.stop="toggleExpand"
      >
        <svg 
          class="expand-icon" 
          :class="{ 'expand-icon--rotated': isExpanded }"
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>

    <!-- Expandable Details -->
    <Transition name="details-slide">
      <div v-if="isExpanded && hasDetails" class="tool-result-card__details">
        <!-- Message -->
        <div v-if="message" class="tool-result-card__message">
          {{ message }}
        </div>

        <!-- Data/Content Preview -->
        <div v-if="data" class="tool-result-card__data">
          <pre class="data-content">{{ formattedData }}</pre>
        </div>

        <!-- Error Details -->
        <div v-if="error" class="tool-result-card__error">
          <span class="error-label">{{ t('aiToolResult.errorDetails') }}:</span>
          <code class="error-code">{{ error }}</code>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from '@/i18n';

export type ToolResultStatus = 'success' | 'error';

interface Props {
  status: ToolResultStatus;
  toolName: string;
  path?: string;
  message?: string;
  data?: unknown;
  error?: string;
  defaultExpanded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  status: 'success',
  path: '',
  message: '',
  data: undefined,
  error: '',
  defaultExpanded: false,
});

const { t } = useI18n();

// Local state
const isExpanded = ref(props.defaultExpanded);

// Computed
const toolIcon = computed(() => {
  const icons: Record<string, string> = {
    'create_folder': '📁',
    'create_file': '📄',
    'edit_file': '✏️',
    'delete_file': '🗑️',
    'read_file': '📖',
    'list_files': '📋',
  };
  return icons[props.toolName] || '🔧';
});

const statusText = computed(() => {
  return props.status === 'success' 
    ? t('aiToolResult.success') 
    : t('aiToolResult.error');
});

const ariaLabel = computed(() => {
  const statusLabel = props.status === 'success' 
    ? t('aiToolResult.successAria') 
    : t('aiToolResult.errorAria');
  return `${props.toolName} ${statusLabel}`;
});

const truncatedPath = computed(() => {
  if (!props.path) return '';
  const maxLength = 30;
  if (props.path.length <= maxLength) return props.path;
  
  // Show last part of path with ellipsis
  const parts = props.path.split(/[/\\]/);
  const fileName = parts[parts.length - 1];
  if (fileName.length >= maxLength - 3) {
    return '...' + fileName.slice(-(maxLength - 3));
  }
  return '...' + props.path.slice(-(maxLength - 3));
});

const hasDetails = computed(() => {
  return !!(props.message || props.data || props.error);
});

const formattedData = computed(() => {
  if (!props.data) return '';
  if (typeof props.data === 'string') return props.data;
  try {
    return JSON.stringify(props.data, null, 2);
  } catch {
    return String(props.data);
  }
});

// Methods
function toggleExpand() {
  if (hasDetails.value) {
    isExpanded.value = !isExpanded.value;
  }
}
</script>

<style lang="scss" scoped>
.tool-result-card {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg, 8px);
  border: 1px solid var(--border, #334155);
  background-color: var(--card, #1E293B);
  overflow: hidden;
  transition: border-color 0.2s ease-out, background-color 0.2s ease-out;

  // Success state - green left border
  &--success {
    border-left: 3px solid var(--tool-success);

    .tool-result-card__icon {
      background-color: rgba(34, 197, 94, 0.15);
    }

    .status-icon--success {
      color: var(--tool-success);
    }

    .tool-result-card__status-text {
      color: var(--tool-success);
    }
  }

  // Error state - red left border
  &--error {
    border-left: 3px solid var(--tool-error);

    .tool-result-card__icon {
      background-color: rgba(239, 68, 68, 0.15);
    }

    .status-icon--error {
      color: var(--tool-error);
    }

    .tool-result-card__status-text {
      color: var(--tool-error);
    }
  }

  // Expanded state
  &--expanded {
    .tool-result-card__header {
      border-bottom: 1px solid var(--border, #334155);
    }
  }
}

.tool-result-card__header {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  padding: var(--space-3, 12px);
  cursor: pointer;
  transition: background-color 0.15s ease-out;

  &:hover {
    background-color: var(--accent, rgba(255, 255, 255, 0.05));
  }
}

.tool-result-card__icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full, 9999px);
  transition: background-color 0.2s ease-out;
}

.status-icon {
  width: 16px;
  height: 16px;

  &--success {
    .checkmark-path {
      stroke-dasharray: 24;
      stroke-dashoffset: 24;
      animation: checkmark-draw 0.4s ease-out forwards;
    }
  }

  &--error {
    .x-path-1,
    .x-path-2 {
      stroke-dasharray: 20;
      stroke-dashoffset: 20;
    }

    .x-path-1 {
      animation: x-draw 0.3s ease-out forwards;
    }

    .x-path-2 {
      animation: x-draw 0.3s ease-out 0.1s forwards;
    }
  }
}

@keyframes checkmark-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes x-draw {
  to {
    stroke-dashoffset: 0;
  }
}

.tool-result-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
}

.tool-result-card__tool-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.tool-result-card__tool-name {
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: 13px;
  font-weight: 500;
  color: var(--foreground, #F1F5F9);
  flex-shrink: 0;
}

.tool-result-card__path {
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: 12px;
  color: var(--muted-foreground, #94A3B8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-result-card__status-text {
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

.tool-result-card__expand-btn {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--muted-foreground, #94A3B8);
  border-radius: var(--radius-md, 6px);
  cursor: pointer;
  transition: color 0.15s ease-out, background-color 0.15s ease-out;

  &:hover {
    color: var(--foreground, #F1F5F9);
    background-color: var(--accent, rgba(255, 255, 255, 0.1));
  }

  &:focus-visible {
    outline: 2px solid var(--primary, #3B82F6);
    outline-offset: 2px;
  }
}

.expand-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease-out;

  &--rotated {
    transform: rotate(180deg);
  }
}

.tool-result-card__details {
  padding: var(--space-3, 12px);
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
  background-color: rgba(0, 0, 0, 0.1);
}

.tool-result-card__message {
  font-size: 13px;
  line-height: 1.5;
  color: var(--foreground, #F1F5F9);
}

.tool-result-card__data {
  .data-content {
    margin: 0;
    padding: var(--space-2, 8px);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 12px;
    line-height: 1.4;
    color: var(--muted-foreground, #94A3B8);
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: var(--radius-md, 6px);
    overflow-x: auto;
    max-height: 150px;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.tool-result-card__error {
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 4px);

  .error-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--tool-error);
  }

  .error-code {
    padding: var(--space-2, 8px);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 12px;
    line-height: 1.4;
    color: var(--tool-error);
    background-color: rgba(239, 68, 68, 0.1);
    border-radius: var(--radius-md, 6px);
    border: 1px solid rgba(239, 68, 68, 0.2);
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

// Icon fade transition
.icon-fade-enter-active,
.icon-fade-leave-active {
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}

.icon-fade-enter-from {
  opacity: 0;
  transform: scale(0.5);
}

.icon-fade-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

// Details slide transition
.details-slide-enter-active {
  animation: details-enter 0.2s ease-out;
}

.details-slide-leave-active {
  animation: details-leave 0.15s ease-in;
}

@keyframes details-enter {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 300px;
  }
}

@keyframes details-leave {
  from {
    opacity: 1;
    max-height: 300px;
  }
  to {
    opacity: 0;
    max-height: 0;
  }
}

// Respect reduced motion preference
@media (prefers-reduced-motion: reduce) {
  .status-icon--success .checkmark-path,
  .status-icon--error .x-path-1,
  .status-icon--error .x-path-2 {
    animation: none;
    stroke-dashoffset: 0;
  }

  .expand-icon {
    transition: none;
  }

  .icon-fade-enter-active,
  .icon-fade-leave-active {
    transition: none;
  }

  .details-slide-enter-active,
  .details-slide-leave-active {
    animation: none;
  }
}

// Light mode adjustments
:root[data-theme="light"] .tool-result-card,
.light .tool-result-card {
  background-color: var(--card, #FFFFFF);

  &--success {
    .tool-result-card__icon {
      background-color: rgba(34, 197, 94, 0.1);
    }
  }

  &--error {
    .tool-result-card__icon {
      background-color: rgba(239, 68, 68, 0.1);
    }
  }

  .tool-result-card__details {
    background-color: rgba(0, 0, 0, 0.03);
  }

  .tool-result-card__data .data-content {
    background-color: rgba(0, 0, 0, 0.05);
  }
}
</style>
