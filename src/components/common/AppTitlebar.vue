<template>
  <header class="titlebar" data-tauri-drag-region>
    <!-- 左侧: Logo -->
    <div class="titlebar-left">
      <div class="app-logo">
        <span class="logo-icon">⚡</span>
        <span class="logo-text">MCP Skills Hub</span>
      </div>
    </div>

    <!-- 中间: 一级导航菜单 -->
    <nav class="titlebar-nav">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-link"
        :class="{ active: isActive(item.path) }"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ t(item.labelKey) }}</span>
      </router-link>
    </nav>

    <!-- 右侧: 工具按钮 + 窗口控制 -->
    <div class="titlebar-right">
      <!-- 主题切换 -->
      <a-tooltip :content="themeTooltip">
        <button class="titlebar-btn" @click="settingsStore.toggleTheme">
          <span v-if="settingsStore.effectiveTheme === 'dark'">🌙</span>
          <span v-else>☀️</span>
        </button>
      </a-tooltip>

      <!-- AI 面板切换 -->
      <a-tooltip :content="t('titlebar.aiAssistant')">
        <button
          class="titlebar-btn"
          :class="{ active: settingsStore.aiPanelVisible }"
          @click="settingsStore.toggleAiPanel"
        >
          🤖
        </button>
      </a-tooltip>

      <!-- 窗口控制按钮 -->
      <div class="window-controls">
        <button class="window-btn minimize" @click="minimizeWindow">
          <span>─</span>
        </button>
        <button class="window-btn maximize" @click="toggleMaximize">
          <span>□</span>
        </button>
        <button class="window-btn close" @click="closeWindow">
          <span>✕</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useSettingsStore } from "@/stores";
import { useI18n } from "@/i18n";

const route = useRoute();
const settingsStore = useSettingsStore();
const { t } = useI18n();

// 导航菜单项
const navItems = [
  { path: "/skills", labelKey: "nav.skills", icon: "📝" },
  { path: "/mcp", labelKey: "nav.mcp", icon: "🔌" },
  { path: "/settings", labelKey: "nav.settings", icon: "⚙️" },
];

// 判断当前路由是否激活
const isActive = (path: string) => route.path.startsWith(path);

const themeTooltip = computed(() => {
  const labels: Record<string, string> = {
    light: t('titlebar.themeLight'),
    dark: t('titlebar.themeDark'),
    system: t('titlebar.themeSystem'),
  };
  return labels[settingsStore.theme];
});

// 窗口控制函数（Tauri API）
const minimizeWindow = async () => {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  getCurrentWindow().minimize();
};

const toggleMaximize = async () => {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  getCurrentWindow().toggleMaximize();
};

const closeWindow = async () => {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  getCurrentWindow().close();
};
</script>

<style lang="scss" scoped>
.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--titlebar-height);
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  padding: 0 var(--space-4);
  user-select: none;
  -webkit-app-region: drag;
}

.titlebar-left,
.titlebar-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  -webkit-app-region: no-drag;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-2);

  .logo-icon {
    font-size: 18px;
  }

  .logo-text {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.3px;
  }
}

// 导航菜单样式 - PulseMCP 风格
.titlebar-nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  -webkit-app-region: no-drag;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: var(--nav-item-hover-bg);
    color: var(--text-primary);
  }

  &.active {
    background-color: var(--nav-item-active-bg);
    color: var(--text-primary);
  }

  .nav-icon {
    font-size: 16px;
  }

  .nav-label {
    white-space: nowrap;
  }
}

.titlebar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 16px;
  transition: all var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: var(--nav-item-hover-bg);
  }

  &.active {
    background-color: var(--nav-item-active-bg);
  }
}

.window-controls {
  display: flex;
  margin-left: var(--space-3);
}

.window-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: var(--titlebar-height);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  transition: all var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }

  &.close:hover {
    background-color: var(--error);
    color: white;
  }
}
</style>
