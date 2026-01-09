import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      redirect: "/skills",
    },
    {
      path: "/skills",
      name: "skills",
      component: () => import("@/views/SkillsView.vue"),
    },
    {
      path: "/mcp",
      name: "mcp",
      component: () => import("@/views/McpView.vue"),
    },
    {
      path: "/settings",
      name: "settings",
      component: () => import("@/views/SettingsView.vue"),
    },
  ],
});

export default router;
