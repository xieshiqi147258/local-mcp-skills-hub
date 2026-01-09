<template>
  <div 
    class="typing-indicator"
    role="status"
    aria-live="polite"
    :aria-label="t('aiTyping.thinking')"
  >
    <!-- Animated Dots -->
    <div class="typing-dots" aria-hidden="true">
      <span class="dot dot--1"></span>
      <span class="dot dot--2"></span>
      <span class="dot dot--3"></span>
    </div>

    <!-- Thinking Text -->
    <span class="typing-text">{{ t('aiTyping.thinking') }}</span>

    <!-- Stop Button (Requirement 13.7) -->
    <button 
      v-if="showStopButton"
      class="stop-btn"
      type="button"
      :aria-label="t('aiTyping.stop')"
      @click="handleStop"
    >
      <svg 
        class="stop-icon" 
        viewBox="0 0 24 24" 
        fill="currentColor"
        aria-hidden="true"
      >
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </svg>
      <span class="stop-text">{{ t('aiTyping.stop') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/i18n';

interface Props {
  showStopButton?: boolean;
}

const emit = defineEmits<{
  (e: 'stop'): void;
}>();

withDefaults(defineProps<Props>(), {
  showStopButton: true,
});

const { t } = useI18n();

function handleStop() {
  emit('stop');
}
</script>

<style lang="scss" scoped>
.typing-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  padding: var(--space-3, 12px) var(--space-4, 16px);
  border-radius: var(--radius-lg, 8px);
  background-color: var(--card, #1E293B);
  border: 1px solid var(--border, #334155);
}

// Three dots animation (Requirement 10.1)
.typing-dots {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 20px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full, 9999px);
  background-color: var(--primary, #3B82F6);
  animation: typing-bounce 1.4s ease-in-out infinite;

  &--1 {
    animation-delay: 0s;
  }

  &--2 {
    animation-delay: 0.2s;
  }

  &--3 {
    animation-delay: 0.4s;
  }
}

@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

// Thinking text
.typing-text {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted-foreground, #94A3B8);
  user-select: none;
}

// Stop button (Requirement 13.7)
.stop-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-md, 6px);
  background-color: rgba(239, 68, 68, 0.15);
  color: var(--tool-error, #EF4444);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease-out, transform 0.1s ease-out;

  &:hover {
    background-color: rgba(239, 68, 68, 0.25);
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px solid var(--primary, #3B82F6);
    outline-offset: 2px;
  }
}

.stop-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.stop-text {
  white-space: nowrap;
}

// Respect reduced motion preference
@media (prefers-reduced-motion: reduce) {
  .dot {
    animation: typing-fade 1.4s ease-in-out infinite;
  }

  @keyframes typing-fade {
    0%, 60%, 100% {
      opacity: 0.4;
    }
    30% {
      opacity: 1;
    }
  }

  .stop-btn {
    transition: none;
  }
}

// Light mode adjustments
:root[data-theme="light"] .typing-indicator,
.light .typing-indicator {
  background-color: var(--card, #FFFFFF);

  .typing-text {
    color: var(--muted-foreground, #64748B);
  }
}
</style>
