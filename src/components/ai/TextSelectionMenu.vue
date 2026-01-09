<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible && selectedText"
        class="text-selection-menu"
        :style="menuStyle"
        @mousedown.prevent
      >
        <button
          class="menu-btn send-to-ai"
          @click="handleSendToAi"
          :title="t('textSelection.sendToAi')"
        >
          <Bot class="menu-icon" />
          <span class="menu-text">{{ t('textSelection.sendToAi') }}</span>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bot } from 'lucide-vue-next';
import { useI18n } from '@/i18n';

// Props (Requirement 6.1, 6.2)
interface Props {
  visible: boolean;
  position: { x: number; y: number };
  selectedText: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  position: () => ({ x: 0, y: 0 }),
  selectedText: '',
});

// Emits
const emit = defineEmits<{
  (e: 'send-to-ai', text: string): void;
  (e: 'close'): void;
}>();

const { t } = useI18n();

// Calculate menu position based on selection (Requirement 6.1)
const menuStyle = computed(() => {
  const menuWidth = 140;
  const menuHeight = 36;
  const padding = 8;
  
  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Calculate position - show above the selection by default
  let x = props.position.x - menuWidth / 2;
  let y = props.position.y - menuHeight - padding;
  
  // Ensure menu stays within viewport bounds
  // Horizontal bounds
  if (x < padding) {
    x = padding;
  } else if (x + menuWidth > viewportWidth - padding) {
    x = viewportWidth - menuWidth - padding;
  }
  
  // Vertical bounds - if not enough space above, show below
  if (y < padding) {
    y = props.position.y + padding;
  }
  
  // Ensure not below viewport
  if (y + menuHeight > viewportHeight - padding) {
    y = viewportHeight - menuHeight - padding;
  }
  
  return {
    left: `${x}px`,
    top: `${y}px`,
  };
});

// Handle "Send to AI" click (Requirement 6.2)
function handleSendToAi() {
  if (props.selectedText) {
    emit('send-to-ai', props.selectedText);
    emit('close');
  }
}
</script>

<style lang="scss" scoped>
// Fade animation
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.text-selection-menu {
  position: fixed;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1);
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px oklch(0 0 0 / 0.15);
}

.menu-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  color: var(--foreground);
  cursor: pointer;
  transition: all 150ms ease;
  white-space: nowrap;

  &:hover {
    background-color: var(--accent);
  }

  &.send-to-ai {
    background: var(--primary);
    color: var(--primary-foreground);

    &:hover {
      opacity: 0.9;
    }
  }
}

.menu-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.menu-text {
  font-size: 12px;
}
</style>
