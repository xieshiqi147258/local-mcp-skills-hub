<template>
  <Transition name="result-animation" @after-enter="handleAnimationEnd">
    <div 
      v-if="visible"
      class="result-animation"
      :class="[`result-animation--${type}`]"
      role="status"
      :aria-label="type === 'success' ? t('aiStatus.success') : t('aiStatus.error')"
    >
      <div class="result-circle">
        <svg 
          v-if="type === 'success'" 
          class="result-icon result-icon--success" 
          viewBox="0 0 52 52"
        >
          <circle 
            class="result-circle-bg" 
            cx="26" 
            cy="26" 
            r="24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
          />
          <path 
            class="result-checkmark" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="3" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            d="M14 27l7 7 16-16"
          />
        </svg>
        <svg 
          v-else 
          class="result-icon result-icon--error" 
          viewBox="0 0 52 52"
        >
          <circle 
            class="result-circle-bg" 
            cx="26" 
            cy="26" 
            r="24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
          />
          <path 
            class="result-x-1" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="3" 
            stroke-linecap="round"
            d="M16 16l20 20"
          />
          <path 
            class="result-x-2" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="3" 
            stroke-linecap="round"
            d="M36 16l-20 20"
          />
        </svg>
      </div>
      <span v-if="message" class="result-message">{{ message }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from '@/i18n';

export type ResultType = 'success' | 'error';

interface Props {
  type: ResultType;
  message?: string;
  visible?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'success',
  message: '',
  visible: false,
  autoHide: true,
  autoHideDelay: 2000,
});

const emit = defineEmits<{
  (e: 'hide'): void;
  (e: 'animation-end'): void;
}>();

const { t } = useI18n();
const hideTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

function handleAnimationEnd() {
  emit('animation-end');
  
  if (props.autoHide) {
    hideTimeout.value = setTimeout(() => {
      emit('hide');
    }, props.autoHideDelay);
  }
}

// Cleanup timeout on unmount or visibility change
watch(() => props.visible, (newVal) => {
  if (!newVal && hideTimeout.value) {
    clearTimeout(hideTimeout.value);
    hideTimeout.value = null;
  }
});
</script>

<style lang="scss" scoped>
.result-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3, 12px);
  padding: var(--space-4, 16px);
}

.result-circle {
  width: 64px;
  height: 64px;
}

.result-icon {
  width: 100%;
  height: 100%;

  &--success {
    color: var(--tool-success);

    .result-circle-bg {
      stroke-dasharray: 166;
      stroke-dashoffset: 166;
      animation: circle-draw 0.6s ease-out forwards;
    }

    .result-checkmark {
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      animation: checkmark-draw 0.3s ease-out 0.4s forwards;
    }
  }

  &--error {
    color: var(--tool-error);

    .result-circle-bg {
      stroke-dasharray: 166;
      stroke-dashoffset: 166;
      animation: circle-draw 0.6s ease-out forwards;
    }

    .result-x-1 {
      stroke-dasharray: 30;
      stroke-dashoffset: 30;
      animation: x-draw 0.2s ease-out 0.4s forwards;
    }

    .result-x-2 {
      stroke-dasharray: 30;
      stroke-dashoffset: 30;
      animation: x-draw 0.2s ease-out 0.5s forwards;
    }
  }
}

// Circle draw animation
@keyframes circle-draw {
  to {
    stroke-dashoffset: 0;
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

.result-message {
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  color: var(--foreground, #F1F5F9);
  animation: message-fade 0.3s ease-out 0.6s both;
}

@keyframes message-fade {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Entry/exit transitions
.result-animation-enter-active {
  animation: result-enter 0.3s ease-out;
}

.result-animation-leave-active {
  animation: result-leave 0.2s ease-in;
}

@keyframes result-enter {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes result-leave {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.8);
  }
}

// Respect reduced motion preference
@media (prefers-reduced-motion: reduce) {
  .result-icon--success {
    .result-circle-bg,
    .result-checkmark {
      animation: none;
      stroke-dashoffset: 0;
    }
  }

  .result-icon--error {
    .result-circle-bg,
    .result-x-1,
    .result-x-2 {
      animation: none;
      stroke-dashoffset: 0;
    }
  }

  .result-message {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .result-animation-enter-active,
  .result-animation-leave-active {
    animation: none;
  }
}
</style>
