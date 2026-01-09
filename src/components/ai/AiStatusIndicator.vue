<template>
  <div 
    class="status-indicator"
    :class="[
      `status-indicator--${status}`,
      { 'status-indicator--animated': animated }
    ]"
    role="status"
    :aria-live="status === 'error' ? 'assertive' : 'polite'"
  >
    <!-- Status Icon -->
    <div class="status-icon-wrapper">
      <Transition name="status-icon" mode="out-in">
        <div v-if="status === 'success'" key="success" class="status-icon status-icon--success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" class="checkmark-path" />
          </svg>
        </div>
        <div v-else-if="status === 'error'" key="error" class="status-icon status-icon--error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" class="x-path-1" />
            <line x1="6" y1="6" x2="18" y2="18" class="x-path-2" />
          </svg>
        </div>
        <div v-else-if="status === 'loading'" key="loading" class="status-icon status-icon--loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" class="spinner-track" />
            <path d="M12 2a10 10 0 0 1 10 10" class="spinner-path" />
          </svg>
        </div>
      </Transition>
    </div>

    <!-- Status Content -->
    <div v-if="message || $slots.default" class="status-content">
      <span class="status-message">
        <slot>{{ message }}</slot>
      </span>
    </div>

    <!-- Actions Slot -->
    <div v-if="$slots.actions" class="status-actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
export type StatusType = 'success' | 'error' | 'loading' | 'idle';

interface Props {
  status: StatusType;
  message?: string;
  animated?: boolean;
}

withDefaults(defineProps<Props>(), {
  status: 'idle',
  message: '',
  animated: true,
});
</script>

<style lang="scss" scoped>
.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  padding: var(--space-3, 12px) var(--space-4, 16px);
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--border);
  background-color: var(--card);
  transition: all 0.2s ease-out;

  &--success {
    border-color: var(--tool-success);
    background-color: rgba(34, 197, 94, 0.1);

    .status-icon-wrapper {
      background-color: var(--tool-success);
    }
  }

  &--error {
    border-color: var(--tool-error);
    background-color: rgba(239, 68, 68, 0.1);

    .status-icon-wrapper {
      background-color: var(--tool-error);
    }
  }

  &--loading {
    border-color: var(--primary);
    background-color: rgba(59, 130, 246, 0.1);

    .status-icon-wrapper {
      background-color: var(--primary);
    }
  }
}

.status-icon-wrapper {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full, 9999px);
  background-color: var(--muted, #334155);
  transition: background-color 0.2s ease-out;
}

.status-icon {
  width: 16px;
  height: 16px;
  color: white;

  svg {
    width: 100%;
    height: 100%;
  }

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

  &--loading {
    .spinner-track {
      stroke: rgba(255, 255, 255, 0.2);
    }

    .spinner-path {
      stroke-linecap: round;
      animation: spinner-rotate 1s linear infinite;
      transform-origin: center;
    }
  }
}

// Checkmark draw animation
@keyframes checkmark-draw {
  to {
    stroke-dashoffset: 0;
  }
}

// X draw animation
@keyframes x-draw {
  to {
    stroke-dashoffset: 0;
  }
}

// Spinner rotation
@keyframes spinner-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Icon transition
.status-icon-enter-active,
.status-icon-leave-active {
  transition: all 0.2s ease-out;
}

.status-icon-enter-from {
  opacity: 0;
  transform: scale(0.5);
}

.status-icon-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

.status-content {
  flex: 1;
  min-width: 0;
}

.status-message {
  font-size: 13px;
  line-height: 1.4;
  color: var(--foreground);
  word-break: break-word;

  .status-indicator--success & {
    color: var(--tool-success);
  }

  .status-indicator--error & {
    color: var(--tool-error);
  }
}

.status-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  flex-shrink: 0;
}

// Respect reduced motion preference
@media (prefers-reduced-motion: reduce) {
  .status-indicator {
    transition: none;
  }

  .status-icon--success .checkmark-path,
  .status-icon--error .x-path-1,
  .status-icon--error .x-path-2 {
    animation: none;
    stroke-dashoffset: 0;
  }

  .status-icon--loading .spinner-path {
    animation: none;
  }

  .status-icon-enter-active,
  .status-icon-leave-active {
    transition: none;
  }
}

// Light mode adjustments
:root[data-theme="light"] .status-indicator,
.light .status-indicator {
  background-color: var(--card, #FFFFFF);

  &--success {
    background-color: rgba(34, 197, 94, 0.08);
  }

  &--error {
    background-color: rgba(239, 68, 68, 0.08);
  }

  &--loading {
    background-color: rgba(59, 130, 246, 0.08);
  }
}
</style>
