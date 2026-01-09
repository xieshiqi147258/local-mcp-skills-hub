<template>
  <div class="ai-empty-state">
    <!-- Welcome Icon -->
    <div class="empty-icon-wrapper">
      <svg class="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
      </svg>
      <div class="icon-glow"></div>
    </div>

    <!-- Welcome Message (Requirement 14.9) -->
    <h3 class="empty-title">{{ t('aiEmptyState.welcome') }}</h3>
    <p class="empty-description">{{ t('aiEmptyState.description') }}</p>

    <!-- Usage Tips (Requirement 14.9) -->
    <div class="usage-tips">
      <div class="tip-item">
        <span class="tip-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </span>
        <span class="tip-text">{{ t('aiEmptyState.tip1') }}</span>
      </div>
      <div class="tip-item">
        <span class="tip-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </span>
        <span class="tip-text">{{ t('aiEmptyState.tip2') }}</span>
      </div>
      <div class="tip-item">
        <span class="tip-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </span>
        <span class="tip-text">{{ t('aiEmptyState.tip3') }}</span>
      </div>
    </div>

    <!-- Quick Start Buttons (Requirement 14.9) -->
    <div class="quick-start-actions">
      <button class="quick-start-btn primary" @click="handleCreateSkill">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14"/>
          <path d="M5 12h14"/>
        </svg>
        {{ t('aiEmptyState.createSkill') }}
      </button>
      <button class="quick-start-btn secondary" @click="handleBrowseFiles">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        {{ t('aiEmptyState.browseFiles') }}
      </button>
    </div>

    <!-- Keyboard Shortcut Hint -->
    <p class="shortcut-hint">
      <kbd>Ctrl</kbd> + <kbd>Enter</kbd> {{ t('aiEmptyState.sendHint') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/i18n';

// Emits
const emit = defineEmits<{
  (e: 'create-skill'): void;
  (e: 'browse-files'): void;
}>();

// i18n
const { t } = useI18n();

// Handlers
function handleCreateSkill() {
  emit('create-skill');
}

function handleBrowseFiles() {
  emit('browse-files');
}
</script>

<style lang="scss" scoped>
.ai-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-6);
  text-align: center;
  height: 100%;
  min-height: 400px;
}

// Icon with glow effect
.empty-icon-wrapper {
  position: relative;
  margin-bottom: var(--space-6);
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--primary);
  opacity: 0.9;
}

.icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
  opacity: 0.15;
  border-radius: 50%;
  pointer-events: none;
}

// Title and description
.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--foreground);
  margin: 0 0 var(--space-2) 0;
}

.empty-description {
  font-size: 14px;
  color: var(--muted-foreground);
  margin: 0 0 var(--space-6) 0;
  max-width: 320px;
  line-height: 1.6;
}

// Usage tips
.usage-tips {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  padding: var(--space-4);
  background-color: var(--muted);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  max-width: 320px;
  width: 100%;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-align: left;
}

.tip-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  background-color: var(--background);
  border-radius: var(--radius-md);
  color: var(--primary);
}

.tip-text {
  font-size: 13px;
  color: var(--foreground);
  line-height: 1.4;
}

// Quick start buttons
.quick-start-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  max-width: 280px;
  margin-bottom: var(--space-4);
}

.quick-start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  height: 40px;
  padding: 0 var(--space-4);
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
  border: none;

  svg {
    flex-shrink: 0;
  }

  &.primary {
    background-color: var(--primary);
    color: var(--primary-foreground);

    &:hover {
      opacity: 0.9;
    }

    &:active {
      transform: scale(0.98);
    }
  }

  &.secondary {
    background-color: var(--secondary);
    color: var(--secondary-foreground);
    border: 1px solid var(--border);

    &:hover {
      background-color: var(--accent);
      border-color: var(--accent);
    }

    &:active {
      transform: scale(0.98);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
}

// Keyboard shortcut hint
.shortcut-hint {
  font-size: 12px;
  color: var(--muted-foreground);
  margin: 0;

  kbd {
    display: inline-block;
    padding: 2px 6px;
    font-family: var(--font-mono);
    font-size: 11px;
    background-color: var(--muted);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    box-shadow: 0 1px 0 var(--border);
  }
}

// Responsive adjustments
@media (max-width: 400px) {
  .ai-empty-state {
    padding: var(--space-6) var(--space-4);
    min-height: 300px;
  }

  .empty-icon {
    width: 48px;
    height: 48px;
  }

  .icon-glow {
    width: 60px;
    height: 60px;
  }

  .empty-title {
    font-size: 18px;
  }

  .empty-description {
    font-size: 13px;
  }

  .usage-tips {
    padding: var(--space-3);
  }

  .tip-text {
    font-size: 12px;
  }

  .quick-start-btn {
    height: 36px;
    font-size: 13px;
  }
}

// Reduced motion
@media (prefers-reduced-motion: reduce) {
  .quick-start-btn {
    transition: none;
  }
}
</style>
