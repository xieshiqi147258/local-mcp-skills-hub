<template>
  <footer class="statusbar">
    <div class="statusbar-left">
      <span class="status-item">
        <span class="status-indicator running"></span>
        <span class="status-text">{{ t('statusbar.mcpRunning', { count: '3' }) }}</span>
      </span>
    </div>

    <div class="statusbar-right">
      <span class="status-item clickable" @click="settingsStore.toggleTheme">
        <span v-if="settingsStore.effectiveTheme === 'dark'">🌙</span>
        <span v-else>☀️</span>
        <span class="status-text">{{ themeLabel }}</span>
      </span>
      <span class="status-item">
        <span class="status-text">v0.1.0</span>
      </span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSettingsStore } from "@/stores";
import { useI18n } from "@/i18n";

const settingsStore = useSettingsStore();
const { t } = useI18n();

const themeLabel = computed(() => {
  const labels: Record<string, string> = {
    light: t('statusbar.themeLight'),
    dark: t('statusbar.themeDark'),
    system: t('statusbar.themeSystem'),
  };
  return labels[settingsStore.theme];
});
</script>

<style lang="scss" scoped>
.statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--statusbar-height);
  padding: 0 var(--space-4);
  background-color: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
  font-size: 12px;
  color: var(--text-tertiary);
}

.statusbar-left,
.statusbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.status-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--ease-default);

  &.clickable {
    cursor: pointer;

    &:hover {
      background-color: var(--bg-hover);
      color: var(--text-secondary);
    }
  }
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.running {
    background-color: var(--status-running);
    box-shadow: 0 0 6px var(--status-running);
  }

  &.stopped {
    background-color: var(--status-stopped);
  }

  &.error {
    background-color: var(--status-error);
    box-shadow: 0 0 6px var(--status-error);
  }
}

.status-text {
  font-size: 12px;
  line-height: 1;
}
</style>
