<template>
  <Teleport to="body">
    <div class="toast-container" role="region" aria-live="polite" aria-label="Notifications">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="[`toast--${toast.type}`]"
          role="alert"
        >
          <!-- Icon -->
          <span class="toast-icon" aria-hidden="true">
            <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <svg v-else-if="toast.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </span>
          
          <!-- Message -->
          <span class="toast-message">{{ toast.message }}</span>
          
          <!-- Dismiss button -->
          <button
            class="toast-dismiss"
            @click="dismissToast(toast.id)"
            :aria-label="t('toast.dismiss')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast';
import { useI18n } from '@/i18n';

const { toasts, dismissToast } = useToast();
const { t } = useI18n();
</script>

<style lang="scss" scoped>
.toast-container {
  position: fixed;
  bottom: var(--space-4, 16px);
  right: var(--space-4, 16px);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
  max-width: 360px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  padding: var(--space-3, 12px) var(--space-4, 16px);
  background-color: var(--card, #1E293B);
  border: 1px solid var(--border, #334155);
  border-radius: var(--radius-lg, 8px);
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
  pointer-events: auto;
  
  &--success {
    border-left: 3px solid var(--success, #22C55E);
    
    .toast-icon {
      color: var(--success, #22C55E);
    }
  }
  
  &--error {
    border-left: 3px solid var(--destructive, #EF4444);
    
    .toast-icon {
      color: var(--destructive, #EF4444);
    }
  }
  
  &--warning {
    border-left: 3px solid var(--warning, #F59E0B);
    
    .toast-icon {
      color: var(--warning, #F59E0B);
    }
  }
  
  &--info {
    border-left: 3px solid var(--primary, #3B82F6);
    
    .toast-icon {
      color: var(--primary, #3B82F6);
    }
  }
}

.toast-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  
  svg {
    width: 100%;
    height: 100%;
  }
}

.toast-message {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--foreground, #F1F5F9);
  line-height: 1.4;
}

.toast-dismiss {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--muted-foreground, #94A3B8);
  border-radius: var(--radius-sm, 4px);
  cursor: pointer;
  transition: 
    background-color 0.15s ease-out,
    color 0.15s ease-out;
  
  &:hover {
    background-color: var(--accent, rgba(59, 130, 246, 0.1));
    color: var(--foreground, #F1F5F9);
  }
  
  &:focus-visible {
    outline: 2px solid var(--ring, #3B82F6);
    outline-offset: 1px;
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
}

// Transition animations
.toast-enter-active {
  animation: toast-in 0.3s ease-out;
}

.toast-leave-active {
  animation: toast-out 0.2s ease-in forwards;
}

.toast-move {
  transition: transform 0.3s ease-out;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toast-out {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

// Respect reduced motion preference
@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    animation: none;
  }
  
  .toast-move {
    transition: none;
  }
  
  .toast-enter-from,
  .toast-leave-to {
    opacity: 0;
  }
}

// Light mode adjustments
:root[data-theme="light"] .toast,
.light .toast {
  background-color: var(--card, #FFFFFF);
  border-color: var(--border, #E2E8F0);
}
</style>
