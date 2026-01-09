<template>
  <aside class="sidebar">
    <!-- Logo 区域 -->
    <div class="sidebar-header">
      <h1 class="sidebar-title">{{ t('sidebar.title') }}</h1>
      <p class="sidebar-subtitle">{{ t('sidebar.subtitle') }}</p>
    </div>

    <!-- 导航菜单 -->
    <nav class="sidebar-nav">
      <div class="nav-list">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <component :is="item.icon" class="nav-icon" />
          <span class="nav-label">{{ t(item.labelKey) }}</span>
        </router-link>
      </div>
    </nav>

    <!-- 底部区域 -->
    <div class="sidebar-footer">
      <button class="theme-toggle" @click="toggleTheme">
        <Sun v-if="settingsStore.effectiveTheme === 'dark'" class="toggle-icon" />
        <Moon v-else class="toggle-icon" />
        <span class="toggle-label">
          {{ settingsStore.effectiveTheme === 'dark' ? t('sidebar.lightMode') : t('sidebar.darkMode') }}
        </span>
      </button>
      <div class="version-info">
        <div>{{ t('sidebar.version') }} 1.0.0</div>
        <div class="tech-stack">Vue + Tauri</div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { useSettingsStore } from "@/stores";
import { FileCode2, Server, Settings, Sun, Moon } from "lucide-vue-next";
import { useI18n } from "@/i18n";

const route = useRoute();
const settingsStore = useSettingsStore();
const { t } = useI18n();

const navItems = [
  { path: "/skills", labelKey: "nav.skills", icon: FileCode2 },
  { path: "/mcp", labelKey: "nav.mcp", icon: Server },
  { path: "/settings", labelKey: "nav.settings", icon: Settings },
];

const isActive = (path: string) => {
  return route.path.startsWith(path);
};

const toggleTheme = () => {
  settingsStore.setTheme(settingsStore.effectiveTheme === 'dark' ? 'light' : 'dark');
};
</script>

<style lang="scss" scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  background-color: var(--sidebar);
  border-right: 1px solid var(--border);
  height: 100%;
}

.sidebar-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--sidebar-border);
}

.sidebar-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--sidebar-foreground);
  margin: 0;
}

.sidebar-subtitle {
  font-size: 12px;
  color: var(--muted-foreground);
  margin: var(--space-1) 0 0;
  opacity: 0.6;
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-4);
  overflow-y: auto;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  color: var(--sidebar-foreground);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all var(--duration-fast) var(--ease-default);
  cursor: pointer;

  &:hover {
    background-color: var(--sidebar-accent);
    color: var(--sidebar-accent-foreground);
  }

  &.active {
    background-color: var(--sidebar-primary);
    color: var(--sidebar-primary-foreground);
  }
}

.nav-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.nav-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.theme-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  color: var(--sidebar-foreground);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: var(--sidebar-accent);
  }
}

.toggle-icon {
  width: 16px;
  height: 16px;
}

.toggle-label {
  flex: 1;
  text-align: left;
}

.version-info {
  font-size: 12px;
  color: var(--muted-foreground);
  opacity: 0.6;
}

.tech-stack {
  margin-top: var(--space-1);
}
</style>
