<template>
  <div class="app-layout" :data-theme="settingsStore.effectiveTheme">
    <!-- 左侧边栏导航 -->
    <AppSidebar />

    <!-- 主内容区 -->
    <main class="app-main">
      <router-view />
    </main>
    
    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from "@/stores";
import AppSidebar from "@/components/common/AppSidebar.vue";
import ToastContainer from "@/components/common/ToastContainer.vue";

const settingsStore = useSettingsStore();
</script>

<style lang="scss" scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--background);
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--background);
}
</style>
