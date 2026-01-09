import { defineStore } from "pinia";
import { ref, computed } from "vue";

export type Theme = "light" | "dark" | "system";

// SystemPrompts 接口定义
export interface SystemPrompts {
  skills: string;  // Skills 场景提示词
  mcp: string;     // MCP 场景提示词
}

// 默认提示词模板
export const DEFAULT_PROMPTS: SystemPrompts = {
  skills: `You are a file system assistant for managing Skills.

WORKSPACE: {{skills_workspace}}

All file operations MUST be performed within this workspace.
When creating files, use the workspace path as the base directory.

Available tools: create_folder, create_file, edit_file, delete_file, read_file, list_files

IMPORTANT: Always use the tools directly. Never provide bash commands.`,

  mcp: `You are an MCP configuration assistant.

MCP Config Path: {{mcp_config_path}}

Help users manage their MCP server configurations.`
};

// 模板变量上下文接口
export interface TemplateContext {
  skills_workspace?: string;
  mcp_config_path?: string;
  current_file?: string;
  current_folder?: string;
}

// 模板变量替换函数
export function replaceTemplateVariables(
  template: string,
  context: TemplateContext
): string {
  return template
    .replace(/\{\{skills_workspace\}\}/g, context.skills_workspace || '')
    .replace(/\{\{mcp_config_path\}\}/g, context.mcp_config_path || '')
    .replace(/\{\{current_file\}\}/g, context.current_file || '')
    .replace(/\{\{current_folder\}\}/g, context.current_folder || '');
}

// localStorage key
const SYSTEM_PROMPTS_KEY = 'systemPrompts';
const SKILLS_PATH_KEY = 'skillsPath';
const SKILLS_PATHS_KEY = 'skills_paths';
const MCP_CONFIG_PATH_KEY = 'mcpConfigPath';

// Skills path item interface
export interface SkillsPathItem {
  path: string;
  active: boolean;
}

export const useSettingsStore = defineStore("settings", () => {
  // 主题设置
  const theme = ref<Theme>(
    (localStorage.getItem("theme") as Theme) || "system"
  );

  // 获取系统主题
  const getSystemTheme = (): "light" | "dark" => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  // 获取实际应用的主题
  const effectiveTheme = ref<"light" | "dark">(
    theme.value === "system" ? getSystemTheme() : theme.value
  );

  // 应用主题
  const applyTheme = (newTheme: Theme) => {
    theme.value = newTheme;
    localStorage.setItem("theme", newTheme);

    const effective = newTheme === "system" ? getSystemTheme() : newTheme;
    effectiveTheme.value = effective;
    document.documentElement.setAttribute("data-theme", effective);

    // 更新 meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        effective === "dark" ? "#09090b" : "#ffffff"
      );
    }
  };

  // 切换主题
  const toggleTheme = () => {
    const themes: Theme[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme.value);
    const nextIndex = (currentIndex + 1) % themes.length;
    applyTheme(themes[nextIndex]);
  };

  // 监听系统主题变化
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", () => {
    if (theme.value === "system") {
      applyTheme("system");
    }
  });

  // 初始化主题
  applyTheme(theme.value);

  // 侧边栏状态
  const sidebarCollapsed = ref(false);
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  };

  // AI 面板状态
  const aiPanelVisible = ref(true);
  const toggleAiPanel = () => {
    aiPanelVisible.value = !aiPanelVisible.value;
  };

  // 设置主题（简化版）
  const setTheme = (newTheme: "light" | "dark") => {
    applyTheme(newTheme);
  };

  // ========== 系统提示词相关 ==========
  
  // 从 localStorage 加载系统提示词
  const loadSystemPrompts = (): SystemPrompts => {
    const stored = localStorage.getItem(SYSTEM_PROMPTS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { ...DEFAULT_PROMPTS };
      }
    }
    return { ...DEFAULT_PROMPTS };
  };

  // 系统提示词
  const systemPrompts = ref<SystemPrompts>(loadSystemPrompts());

  // 保存系统提示词到 localStorage
  const saveSystemPrompts = () => {
    localStorage.setItem(SYSTEM_PROMPTS_KEY, JSON.stringify(systemPrompts.value));
  };

  // 更新 Skills 提示词
  const setSkillsPrompt = (prompt: string) => {
    systemPrompts.value.skills = prompt;
    saveSystemPrompts();
  };

  // 更新 MCP 提示词
  const setMcpPrompt = (prompt: string) => {
    systemPrompts.value.mcp = prompt;
    saveSystemPrompts();
  };

  // 重置为默认提示词
  const resetToDefaultPrompts = () => {
    systemPrompts.value = { ...DEFAULT_PROMPTS };
    saveSystemPrompts();
  };

  // ========== 工作空间路径相关 ==========
  
  // Skills 工作空间路径
  const skillsPath = ref<string>(localStorage.getItem(SKILLS_PATH_KEY) || '');
  
  // Skills 多路径列表
  const loadSkillsPaths = (): SkillsPathItem[] => {
    const stored = localStorage.getItem(SKILLS_PATHS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  };
  
  const skillsPaths = ref<SkillsPathItem[]>(loadSkillsPaths());
  
  // 初始化时，如果没有设置 skillsPath 但有 skillsPaths，则使用第一个激活的路径
  if (!skillsPath.value && skillsPaths.value.length > 0) {
    const activePath = skillsPaths.value.find(p => p.active && p.path);
    if (activePath) {
      skillsPath.value = activePath.path;
    }
  }
  
  // MCP 配置文件路径
  const mcpConfigPath = ref<string>(localStorage.getItem(MCP_CONFIG_PATH_KEY) || '');

  // 设置 Skills 路径
  const setSkillsPath = (path: string) => {
    skillsPath.value = path;
    localStorage.setItem(SKILLS_PATH_KEY, path);
  };
  
  // 设置 Skills 多路径列表
  const setSkillsPaths = (paths: SkillsPathItem[]) => {
    skillsPaths.value = paths;
    localStorage.setItem(SKILLS_PATHS_KEY, JSON.stringify(paths));
    
    // 同时更新当前激活的路径
    const activePath = paths.find(p => p.active);
    if (activePath) {
      setSkillsPath(activePath.path);
    }
  };
  
  // 添加新路径
  const addSkillsPath = (path: string, active: boolean = false) => {
    const newPaths = [...skillsPaths.value, { path, active }];
    setSkillsPaths(newPaths);
  };
  
  // 移除路径
  const removeSkillsPath = (index: number) => {
    const newPaths = skillsPaths.value.filter((_, i) => i !== index);
    setSkillsPaths(newPaths);
  };
  
  // 切换路径激活状态
  const toggleSkillsPathActive = (index: number) => {
    const newPaths = skillsPaths.value.map((p, i) => ({
      ...p,
      active: i === index ? !p.active : p.active
    }));
    setSkillsPaths(newPaths);
  };
  
  // 加载路径配置
  const loadPathsFromStorage = () => {
    skillsPaths.value = loadSkillsPaths();
    const storedPath = localStorage.getItem(SKILLS_PATH_KEY);
    if (storedPath) {
      skillsPath.value = storedPath;
    }
  };

  // 设置 MCP 配置路径
  const setMcpConfigPath = (path: string) => {
    mcpConfigPath.value = path;
    localStorage.setItem(MCP_CONFIG_PATH_KEY, path);
  };

  // ========== 场景化提示词 ==========
  
  // 当前场景: 'skills' | 'mcp'
  const currentScenario = ref<'skills' | 'mcp'>('skills');

  // 设置当前场景
  const setCurrentScenario = (scenario: 'skills' | 'mcp') => {
    currentScenario.value = scenario;
  };

  // 当前文件上下文
  const currentFile = ref<string>('');
  const currentFolder = ref<string>('');

  // 设置当前文件
  const setCurrentFile = (file: string) => {
    currentFile.value = file;
  };

  // 设置当前文件夹
  const setCurrentFolder = (folder: string) => {
    currentFolder.value = folder;
  };

  // 获取当前场景的模板上下文
  const getTemplateContext = (): TemplateContext => {
    return {
      skills_workspace: skillsPath.value,
      mcp_config_path: mcpConfigPath.value,
      current_file: currentFile.value,
      current_folder: currentFolder.value,
    };
  };

  // 获取当前场景的提示词（已替换变量）
  const getCurrentPrompt = computed(() => {
    const template = currentScenario.value === 'skills' 
      ? systemPrompts.value.skills 
      : systemPrompts.value.mcp;
    return replaceTemplateVariables(template, getTemplateContext());
  });

  // 获取指定场景的提示词（已替换变量）
  const getPromptForScenario = (scenario: 'skills' | 'mcp'): string => {
    const template = scenario === 'skills' 
      ? systemPrompts.value.skills 
      : systemPrompts.value.mcp;
    return replaceTemplateVariables(template, getTemplateContext());
  };

  return {
    // 主题相关
    theme,
    effectiveTheme,
    applyTheme,
    setTheme,
    toggleTheme,
    // 侧边栏
    sidebarCollapsed,
    toggleSidebar,
    // AI 面板
    aiPanelVisible,
    toggleAiPanel,
    // 系统提示词
    systemPrompts,
    setSkillsPrompt,
    setMcpPrompt,
    resetToDefaultPrompts,
    // 工作空间路径
    skillsPath,
    skillsPaths,
    mcpConfigPath,
    setSkillsPath,
    setSkillsPaths,
    addSkillsPath,
    removeSkillsPath,
    toggleSkillsPathActive,
    loadPathsFromStorage,
    setMcpConfigPath,
    // 场景化提示词
    currentScenario,
    setCurrentScenario,
    currentFile,
    currentFolder,
    setCurrentFile,
    setCurrentFolder,
    getTemplateContext,
    getCurrentPrompt,
    getPromptForScenario,
  };
});
