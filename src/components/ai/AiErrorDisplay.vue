<template>
  <div 
    class="error-display"
    role="alert"
    aria-live="assertive"
  >
    <!-- Error Header -->
    <div class="error-header">
      <div class="error-icon-wrapper">
        <svg 
          class="error-icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
          stroke-linecap="round" 
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div class="error-title-section">
        <span class="error-title">{{ title || t('aiError.title') }}</span>
        <span v-if="timestamp" class="error-timestamp">{{ formattedTime }}</span>
      </div>
    </div>

    <!-- Error Message -->
    <div class="error-message-container">
      <p class="error-message">{{ message }}</p>
      
      <!-- Error Details (collapsible) -->
      <div v-if="details" class="error-details-section">
        <button 
          class="details-toggle"
          @click="showDetails = !showDetails"
          :aria-expanded="showDetails"
        >
          <svg 
            class="toggle-icon" 
            :class="{ 'toggle-icon--expanded': showDetails }"
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          {{ showDetails ? t('aiError.hideDetails') : t('aiError.showDetails') }}
        </button>
        
        <Transition name="details">
          <div v-if="showDetails" class="error-details">
            <pre class="details-content">{{ details }}</pre>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="error-actions">
      <button 
        v-if="showRetry"
        class="action-btn action-btn--primary"
        @click="handleRetry"
        :disabled="isRetrying"
      >
        <svg 
          class="btn-icon" 
          :class="{ 'btn-icon--spinning': isRetrying }"
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
          aria-hidden="true"
        >
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        {{ isRetrying ? t('aiError.retrying') : t('aiError.retry') }}
      </button>
      
      <button 
        class="action-btn action-btn--secondary"
        @click="handleCopyError"
        :title="t('aiError.copyTooltip')"
      >
        <svg 
          v-if="!copied"
          class="btn-icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        <svg 
          v-else
          class="btn-icon btn-icon--success" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {{ copied ? t('aiError.copied') : t('aiError.copyError') }}
      </button>

      <button 
        v-if="showDismiss"
        class="action-btn action-btn--ghost"
        @click="handleDismiss"
        :title="t('aiError.dismiss')"
      >
        <svg 
          class="btn-icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from '@/i18n';
import { useToast } from '@/composables/useToast';

interface Props {
  message: string;
  title?: string;
  details?: string;
  timestamp?: number;
  showRetry?: boolean;
  showDismiss?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  details: '',
  timestamp: 0,
  showRetry: true,
  showDismiss: false,
});

const emit = defineEmits<{
  (e: 'retry'): void;
  (e: 'dismiss'): void;
}>();

const { t } = useI18n();
const { showToast } = useToast();

const showDetails = ref(false);
const copied = ref(false);
const isRetrying = ref(false);

const formattedTime = computed(() => {
  if (!props.timestamp) return '';
  const date = new Date(props.timestamp);
  return date.toLocaleTimeString();
});

function handleRetry() {
  isRetrying.value = true;
  emit('retry');
  // Reset retrying state after a short delay (parent should handle actual retry)
  setTimeout(() => {
    isRetrying.value = false;
  }, 1000);
}

async function handleCopyError() {
  const errorText = [
    `Error: ${props.message}`,
    props.details ? `\nDetails:\n${props.details}` : '',
    props.timestamp ? `\nTime: ${new Date(props.timestamp).toISOString()}` : '',
  ].filter(Boolean).join('');

  try {
    await navigator.clipboard.writeText(errorText);
    copied.value = true;
    showToast(t('aiError.copiedToast'), 'success');
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy error:', err);
    showToast(t('aiError.copyFailed'), 'error');
  }
}

function handleDismiss() {
  emit('dismiss');
}
</script>

<style lang="scss" scoped>
.error-display {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
  padding: var(--space-4, 16px);
  background-color: rgba(239, 68, 68, 0.08);
  border: 1px solid var(--tool-error);
  border-radius: var(--radius-lg, 12px);
  animation: error-appear 0.3s ease-out;
}

@keyframes error-appear {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3, 12px);
}

.error-icon-wrapper {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--tool-error);
  border-radius: var(--radius-full, 9999px);
  animation: icon-pulse 0.5s ease-out;
}

@keyframes icon-pulse {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.error-icon {
  width: 18px;
  height: 18px;
  color: white;
}

.error-title-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.error-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--tool-error);
  line-height: 1.4;
}

.error-timestamp {
  font-size: 11px;
  color: var(--muted-foreground, #94A3B8);
}

.error-message-container {
  padding-left: 44px; // Align with title (32px icon + 12px gap)
}

.error-message {
  font-size: 13px;
  line-height: 1.5;
  color: var(--foreground, #F1F5F9);
  margin: 0;
  word-break: break-word;
}

.error-details-section {
  margin-top: var(--space-2, 8px);
}

.details-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-1, 4px);
  padding: var(--space-1, 4px) 0;
  background: transparent;
  border: none;
  color: var(--muted-foreground, #94A3B8);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: var(--foreground, #F1F5F9);
  }

  &:focus-visible {
    outline: 2px solid var(--ring, #3B82F6);
    outline-offset: 2px;
    border-radius: var(--radius-sm, 4px);
  }
}

.toggle-icon {
  width: 14px;
  height: 14px;
  transition: transform 0.2s ease;

  &--expanded {
    transform: rotate(180deg);
  }
}

.error-details {
  margin-top: var(--space-2, 8px);
  overflow: hidden;
}

.details-content {
  padding: var(--space-3, 12px);
  background-color: var(--card, #1E293B);
  border-radius: var(--radius-md, 8px);
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  line-height: 1.5;
  color: var(--muted-foreground, #94A3B8);
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

// Details transition
.details-enter-active,
.details-leave-active {
  transition: all 0.2s ease;
}

.details-enter-from,
.details-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
}

.error-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  padding-left: 44px; // Align with content
  margin-top: var(--space-1, 4px);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  padding: var(--space-2, 8px) var(--space-3, 12px);
  border: none;
  border-radius: var(--radius-md, 8px);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:focus-visible {
    outline: 2px solid var(--ring, #3B82F6);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--primary {
    background-color: var(--tool-error);
    color: white;

    &:hover:not(:disabled) {
      filter: brightness(0.9);
    }

    &:active:not(:disabled) {
      transform: scale(0.98);
    }
  }

  &--secondary {
    background-color: var(--muted, #334155);
    color: var(--foreground, #F1F5F9);

    &:hover:not(:disabled) {
      background-color: var(--accent, #475569);
    }

    &:active:not(:disabled) {
      transform: scale(0.98);
    }
  }

  &--ghost {
    background-color: transparent;
    color: var(--muted-foreground, #94A3B8);
    padding: var(--space-2, 8px);

    &:hover {
      background-color: var(--muted, #334155);
      color: var(--foreground, #F1F5F9);
    }
  }
}

.btn-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;

  &--spinning {
    animation: spin 1s linear infinite;
  }

  &--success {
    color: var(--success, #22C55E);
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

// Respect reduced motion preference
@media (prefers-reduced-motion: reduce) {
  .error-display {
    animation: none;
  }

  .error-icon-wrapper {
    animation: none;
  }

  .toggle-icon {
    transition: none;
  }

  .details-enter-active,
  .details-leave-active {
    transition: none;
  }

  .action-btn {
    transition: none;

    &:active:not(:disabled) {
      transform: none;
    }
  }

  .btn-icon--spinning {
    animation: none;
  }
}

// Light mode adjustments
:root[data-theme="light"] .error-display,
.light .error-display {
  background-color: rgba(239, 68, 68, 0.06);

  .details-content {
    background-color: var(--card, #F8FAFC);
  }
}
</style>
