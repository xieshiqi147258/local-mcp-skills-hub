<template>
  <div class="settings-panel">
    <!-- 头部 -->
    <div class="panel-header">
      <h2 class="header-title">{{ t('settings.title') }}</h2>
      <p class="header-subtitle">{{ t('settings.subtitle') }}</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <Loader2 class="loading-icon" />
      <span>{{ t('settings.loading') }}</span>
    </div>

    <!-- 设置内容 -->
    <div v-else class="settings-container">
      <div class="settings-content">
        
        <!-- Skills 路径配置 - 卡片式多选 -->
        <div class="settings-card">
          <div class="card-header">
            <h3 class="card-title">
              <FolderOpen class="card-icon" />
              {{ t('settings.skillsDir') }}
            </h3>
            <button class="btn-add-path" @click="addSkillsPath">
              <Plus class="btn-icon" />
              {{ t('settings.addPath') }}
            </button>
          </div>
          <p class="card-description">{{ t('settings.skillsDirHint') }}</p>
          
          <div class="paths-grid">
            <div 
              v-for="(pathItem, index) in skillsPaths" 
              :key="index"
              class="path-card"
              :class="{ active: pathItem.active }"
              @click="toggleSkillsPath(index)"
            >
              <div class="path-card-header">
                <div class="path-check">
                  <Check v-if="pathItem.active" class="check-icon" />
                </div>
                <button class="path-remove" @click.stop="removeSkillsPath(index)" v-if="skillsPaths.length > 1">
                  <X class="remove-icon" />
                </button>
              </div>
              <div class="path-card-body">
                <FolderOpen class="path-folder-icon" />
                <span class="path-text">{{ pathItem.path || t('settings.clickToSelect') }}</span>
              </div>
              <button class="path-browse" @click.stop="browseSkillsPath(index)">
                <FolderSearch class="browse-icon" />
                {{ t('settings.browse') }}
              </button>
            </div>
          </div>
        </div>

        <!-- AI 配置 - 完整参数 -->
        <div class="settings-card">
          <div class="card-header">
            <h3 class="card-title">
              <Sparkles class="card-icon" />
              {{ t('settings.aiConfig') }}
            </h3>
          </div>
          
          <!-- Provider 选择 - 卡片式 -->
          <div class="form-group">
            <label class="form-label">{{ t('settings.defaultProvider') }}</label>
            <div class="provider-grid">
              <button 
                v-for="provider in providers" 
                :key="provider.id"
                class="provider-card"
                :class="{ active: settings.aiProvider === provider.id }"
                @click="selectProvider(provider.id)"
              >
                <component :is="provider.icon" class="provider-icon" />
                <span class="provider-name">{{ provider.name }}</span>
                <span class="provider-desc">{{ provider.desc }}</span>
              </button>
            </div>
          </div>

          <!-- API Key -->
          <div class="form-group" v-if="settings.aiProvider !== 'ollama'">
            <label class="form-label">{{ t('settings.apiKey') }}</label>
            <div class="input-with-action">
              <input
                v-model="apiKey"
                :type="showApiKey ? 'text' : 'password'"
                class="form-input"
                :placeholder="getApiKeyPlaceholder()"
              />
              <button class="input-action" @click="showApiKey = !showApiKey">
                <EyeOff v-if="showApiKey" class="action-icon" />
                <Eye v-else class="action-icon" />
              </button>
            </div>
            <p class="form-hint">{{ t('settings.apiKeyHint') }}</p>
          </div>

          <!-- Base URL (Custom/OpenAI) -->
          <div class="form-group" v-if="settings.aiProvider === 'custom' || settings.aiProvider === 'openai'">
            <label class="form-label">{{ t('settings.baseUrl') }}</label>
            <input
              v-model="settings.aiBaseUrl"
              type="text"
              class="form-input"
              :placeholder="getBaseUrlPlaceholder()"
            />
            <p class="form-hint">{{ t('settings.baseUrlHint') }}</p>
          </div>

          <!-- Model ID - 可输入 -->
          <div class="form-group">
            <label class="form-label">{{ t('settings.model') }}</label>
            <div class="model-input-wrapper">
              <input
                v-model="settings.aiModel"
                type="text"
                class="form-input"
                :placeholder="getModelPlaceholder()"
                list="model-suggestions"
              />
              <datalist id="model-suggestions">
                <option v-for="model in getModelSuggestions()" :key="model" :value="model" />
              </datalist>
            </div>
            <p class="form-hint">{{ t('settings.modelHint') }}</p>
          </div>

          <!-- Ollama 本地地址 -->
          <div class="form-group" v-if="settings.aiProvider === 'ollama'">
            <label class="form-label">{{ t('settings.ollamaUrl') }}</label>
            <input
              v-model="settings.ollamaUrl"
              type="text"
              class="form-input"
              placeholder="http://localhost:11434"
            />
            <p class="form-hint">{{ t('settings.ollamaUrlHint') }}</p>
          </div>
        </div>

        <!-- 系统提示词配置 -->
        <div class="settings-card">
          <div class="card-header">
            <h3 class="card-title">
              <MessageSquare class="card-icon" />
              {{ t('settings.systemPrompts') || '系统提示词' }}
            </h3>
          </div>
          <p class="card-description">{{ t('settings.systemPromptsHint') || '自定义 AI 助手的系统提示词，支持模板变量' }}</p>
          <PromptEditor />
        </div>

        <!-- 外观设置 -->
        <div class="settings-card">
          <div class="card-header">
            <h3 class="card-title">
              <Palette class="card-icon" />
              {{ t('settings.appearance') }}
            </h3>
          </div>
          
          <!-- 主题选择 - 卡片式 -->
          <div class="form-group">
            <label class="form-label">{{ t('settings.theme') }}</label>
            <div class="theme-grid">
              <button 
                class="theme-card" 
                :class="{ active: settings.theme === 'light' }"
                @click="settings.theme = 'light'; onThemeChange()"
              >
                <Sun class="theme-icon" />
                <span>{{ t('settings.themeLight') }}</span>
              </button>
              <button 
                class="theme-card" 
                :class="{ active: settings.theme === 'dark' }"
                @click="settings.theme = 'dark'; onThemeChange()"
              >
                <Moon class="theme-icon" />
                <span>{{ t('settings.themeDark') }}</span>
              </button>
              <button 
                class="theme-card" 
                :class="{ active: settings.theme === 'system' }"
                @click="settings.theme = 'system'; onThemeChange()"
              >
                <Monitor class="theme-icon" />
                <span>{{ t('settings.themeSystem') }}</span>
              </button>
            </div>
          </div>

          <!-- 语言选择 -->
          <div class="form-group">
            <label class="form-label">{{ t('settings.language') }}</label>
            <div class="language-grid">
              <button 
                class="language-card" 
                :class="{ active: settings.language === 'zh-CN' }"
                @click="settings.language = 'zh-CN'; onLanguageChange()"
              >
                <span class="language-flag">🇨🇳</span>
                <span>中文</span>
              </button>
              <button 
                class="language-card" 
                :class="{ active: settings.language === 'en' }"
                @click="settings.language = 'en'; onLanguageChange()"
              >
                <span class="language-flag">🇺🇸</span>
                <span>English</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="settings-actions">
          <button class="btn-secondary" @click="resetSettings">
            <RotateCcw class="btn-icon" />
            {{ t('settings.resetDefaults') }}
          </button>
          <button class="btn-primary" @click="handleSaveSettings" :disabled="saving">
            <Loader2 v-if="saving" class="btn-icon spinning" />
            <Save v-else class="btn-icon" />
            {{ saving ? t('settings.saving') : t('settings.saveChanges') }}
          </button>
        </div>

        <!-- 保存成功提示 -->
        <div v-if="saveSuccess" class="save-success">
          <Check class="success-icon" />
          {{ t('settings.saveSuccess') }}
        </div>
      </div>
    </div>

    <!-- 文件夹浏览器对话框 -->
    <div v-if="showBrowser" class="dialog-overlay" @click.self="showBrowser = false">
      <div class="browser-dialog">
        <div class="browser-header">
          <h3>{{ t('settings.selectFolder') }}</h3>
          <button class="close-btn" @click="showBrowser = false">
            <X class="close-icon" />
          </button>
        </div>
        <div class="browser-path">
          <input v-model="currentBrowsePath" class="path-input" @keydown.enter="browseTo(currentBrowsePath)" />
          <button class="go-btn" @click="browseTo(currentBrowsePath)">{{ t('settings.go') }}</button>
        </div>
        <div class="browser-content">
          <div v-if="browserLoading" class="browser-loading">{{ t('common.loading') }}</div>
          <div v-else class="browser-list">
            <button
              v-for="folder in browserFolders"
              :key="folder.path"
              class="browser-item folder"
              @click="browseTo(folder.path)"
              @dblclick="confirmBrowserSelection(folder.path)"
            >
              <FolderOpen class="item-icon" />
              <span>{{ folder.name }}</span>
            </button>
          </div>
        </div>
        <div class="browser-footer">
          <span class="selected-path">{{ currentBrowsePath }}</span>
          <div class="browser-actions">
            <button class="btn-secondary" @click="showBrowser = false">{{ t('common.cancel') }}</button>
            <button class="btn-primary" @click="confirmBrowserSelection(currentBrowsePath)">{{ t('settings.select') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, markRaw } from "vue";
import { 
  Eye, EyeOff, Save, Loader2, Check, FolderOpen, FolderSearch, X, Plus,
  Sun, Moon, Monitor, Palette, Sparkles, RotateCcw, Bot, Cpu, Cloud, MessageSquare
} from "lucide-vue-next";
import { useSettingsStore } from "@/stores";
import { useI18n, setLocale, type Locale } from "@/i18n";
import PromptEditor from "@/components/settings/PromptEditor.vue";
import { 
  loadSettings, 
  saveSettings as saveSettingsApi, 
  checkApiAvailable,
  isApiAvailable,
  type AppSettings 
} from "@/utils/api";

const settingsStore = useSettingsStore();
const { t } = useI18n();

const loading = ref(true);
const saving = ref(false);
const saveSuccess = ref(false);
const showApiKey = ref(false);
const apiKey = ref("");

// Skills 多路径
const skillsPaths = ref<Array<{ path: string; active: boolean }>>([
  { path: '', active: true }
]);
const browsingPathIndex = ref(0);

// 文件浏览器状态
const showBrowser = ref(false);
const currentBrowsePath = ref('');
const browserFolders = ref<Array<{ name: string; path: string }>>([]);
const browserLoading = ref(false);

// AI Providers
const providers = [
  { id: 'anthropic', name: 'Anthropic', desc: 'Claude 3.5', icon: markRaw(Bot) },
  { id: 'openai', name: 'OpenAI', desc: 'GPT-4', icon: markRaw(Sparkles) },
  { id: 'ollama', name: 'Ollama', desc: 'Local', icon: markRaw(Cpu) },
  { id: 'custom', name: 'Custom', desc: 'API', icon: markRaw(Cloud) },
];

const settings = ref<AppSettings & { aiBaseUrl?: string; ollamaUrl?: string }>({
  skillsPath: "",
  mcpConfigPath: "",
  theme: "dark",
  language: "zh-CN",
  aiProvider: "anthropic",
  aiModel: "claude-3-5-sonnet-20241022",
  aiBaseUrl: "",
  ollamaUrl: "http://localhost:11434",
});

// 加载设置
onMounted(async () => {
  try {
    await checkApiAvailable();
    if (isApiAvailable()) {
      const loaded = await loadSettings();
      settings.value = { ...settings.value, ...loaded };
      
      // 从后端加载的设置中恢复 skills 路径
      if (loaded.skillsPaths && Array.isArray(loaded.skillsPaths)) {
        skillsPaths.value = loaded.skillsPaths;
      } else {
        // 如果后端没有，尝试从 localStorage 加载
        const savedPaths = localStorage.getItem("skills_paths");
        if (savedPaths) {
          skillsPaths.value = JSON.parse(savedPaths);
        }
      }
      
      // 同步到 settingsStore
      settingsStore.setSkillsPaths(skillsPaths.value);
      
      // 从后端加载的设置中恢复 API Key
      if (loaded.apiKey) {
        apiKey.value = loaded.apiKey;
      } else {
        // 如果后端没有，从 localStorage 加载
        apiKey.value = localStorage.getItem("ai_api_key") || "";
      }
      
      if (loaded.theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        settingsStore.setTheme(prefersDark ? 'dark' : 'light');
      } else {
        settingsStore.setTheme(loaded.theme as 'light' | 'dark');
      }
      setLocale(loaded.language as Locale);
    } else {
      // API 不可用时，从 localStorage 加载所有设置
      settings.value.theme = settingsStore.theme;
      settings.value.language = localStorage.getItem('locale') || 'zh-CN';
      
      apiKey.value = localStorage.getItem("ai_api_key") || "";
      settings.value.aiBaseUrl = localStorage.getItem("ai_base_url") || "";
      settings.value.ollamaUrl = localStorage.getItem("ollama_url") || "http://localhost:11434";
      settings.value.aiModel = localStorage.getItem("ai_model") || "claude-3-5-sonnet-20241022";
      settings.value.aiProvider = localStorage.getItem("ai_provider") || "anthropic";
      
      const savedPaths = localStorage.getItem("skills_paths");
      if (savedPaths) {
        skillsPaths.value = JSON.parse(savedPaths);
      }
      
      // 同步到 settingsStore
      settingsStore.setSkillsPaths(skillsPaths.value);
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  } finally {
    loading.value = false;
  }
});

const selectProvider = (providerId: string) => {
  settings.value.aiProvider = providerId;
  // 设置默认模型
  if (providerId === 'anthropic') settings.value.aiModel = 'claude-3-5-sonnet-20241022';
  else if (providerId === 'openai') settings.value.aiModel = 'gpt-4-turbo';
  else if (providerId === 'ollama') settings.value.aiModel = 'llama3.2';
  else settings.value.aiModel = '';
};

const getApiKeyPlaceholder = () => {
  if (settings.value.aiProvider === 'anthropic') return 'sk-ant-api03-...';
  if (settings.value.aiProvider === 'openai') return 'sk-...';
  return 'Enter your API key';
};

const getBaseUrlPlaceholder = () => {
  if (settings.value.aiProvider === 'openai') return 'https://api.openai.com/v1';
  return 'https://your-api-endpoint.com/v1';
};

const getModelPlaceholder = () => {
  if (settings.value.aiProvider === 'anthropic') return 'claude-3-5-sonnet-20241022';
  if (settings.value.aiProvider === 'openai') return 'gpt-4-turbo';
  if (settings.value.aiProvider === 'ollama') return 'llama3.2';
  return 'model-id';
};

const getModelSuggestions = () => {
  if (settings.value.aiProvider === 'anthropic') {
    return ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'];
  }
  if (settings.value.aiProvider === 'openai') {
    return ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
  }
  if (settings.value.aiProvider === 'ollama') {
    return ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'qwen2.5'];
  }
  return [];
};

// Skills 路径管理
const addSkillsPath = () => {
  skillsPaths.value.push({ path: '', active: false });
};

const removeSkillsPath = (index: number) => {
  skillsPaths.value.splice(index, 1);
};

const toggleSkillsPath = (index: number) => {
  skillsPaths.value[index].active = !skillsPaths.value[index].active;
};

const browseSkillsPath = (index: number) => {
  browsingPathIndex.value = index;
  showBrowser.value = true;
  browseTo(skillsPaths.value[index].path || '');
};

const onThemeChange = () => {
  if (settings.value.theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    settingsStore.setTheme(prefersDark ? 'dark' : 'light');
  } else {
    settingsStore.setTheme(settings.value.theme as 'light' | 'dark');
  }
};

const onLanguageChange = () => {
  setLocale(settings.value.language as Locale);
};

const API_BASE = 'http://localhost:3002/api';

const browseTo = async (dir: string) => {
  browserLoading.value = true;
  try {
    const res = await fetch(`${API_BASE}/browse/files?dir=${encodeURIComponent(dir)}`);
    const data = await res.json();
    browserFolders.value = data.folders || [];
    currentBrowsePath.value = data.currentPath || dir;
  } catch (e) {
    console.error('Failed to browse:', e);
  } finally {
    browserLoading.value = false;
  }
};

const confirmBrowserSelection = (path: string) => {
  skillsPaths.value[browsingPathIndex.value].path = path;
  showBrowser.value = false;
};

const resetSettings = () => {
  settings.value = {
    skillsPath: "",
    mcpConfigPath: "",
    theme: "dark",
    language: "zh-CN",
    aiProvider: "anthropic",
    aiModel: "claude-3-5-sonnet-20241022",
    aiBaseUrl: "",
    ollamaUrl: "http://localhost:11434",
  };
  apiKey.value = "";
  skillsPaths.value = [{ path: '', active: true }];
  settingsStore.setTheme("dark");
  setLocale("zh-CN");
};

const handleSaveSettings = async () => {
  saving.value = true;
  saveSuccess.value = false;
  
  try {
    // 准备完整的设置对象，包含所有需要持久化的数据
    const fullSettings = {
      ...settings.value,
      // 确保 skills 路径被保存
      skillsPaths: skillsPaths.value,
      // 确保 AI 配置被保存
      apiKey: apiKey.value,
    };
    
    if (isApiAvailable()) {
      await saveSettingsApi(fullSettings);
    }
    
    // 同时保存到 localStorage 作为备份
    if (apiKey.value) localStorage.setItem("ai_api_key", apiKey.value);
    else localStorage.removeItem("ai_api_key");
    
    localStorage.setItem("ai_provider", settings.value.aiProvider);
    localStorage.setItem("ai_model", settings.value.aiModel);
    localStorage.setItem("ai_base_url", settings.value.aiBaseUrl || "");
    localStorage.setItem("ollama_url", settings.value.ollamaUrl || "http://localhost:11434");
    localStorage.setItem("theme", settings.value.theme);
    localStorage.setItem("skills_paths", JSON.stringify(skillsPaths.value));
    
    // 同步到 settingsStore，以便其他组件可以访问
    settingsStore.setSkillsPaths(skillsPaths.value);
    
    // 设置当前激活的路径
    const activePath = skillsPaths.value.find(p => p.active && p.path);
    if (activePath) {
      settingsStore.setSkillsPath(activePath.path);
    }
    
    saveSuccess.value = true;
    setTimeout(() => { saveSuccess.value = false; }, 3000);
  } catch (e) {
    console.error("Failed to save settings:", e);
    alert("Failed to save settings: " + e);
  } finally {
    saving.value = false;
  }
};
</script>

<style lang="scss" scoped>
.settings-panel { display: flex; flex-direction: column; height: 100%; background-color: var(--background); }
.panel-header { padding: var(--space-6); border-bottom: 1px solid var(--border); background-color: var(--card); }
.header-title { font-size: 18px; font-weight: 600; color: var(--foreground); margin: 0; }
.header-subtitle { font-size: 14px; color: var(--muted-foreground); margin: var(--space-1) 0 0; }

.loading-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-3); color: var(--muted-foreground); }
.loading-icon { width: 24px; height: 24px; animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.settings-container { flex: 1; overflow-y: auto; padding: var(--space-6); }
.settings-content { max-width: 800px; display: flex; flex-direction: column; gap: var(--space-6); }

.settings-card { background-color: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-6); }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); }
.card-title { display: flex; align-items: center; gap: var(--space-2); font-size: 16px; font-weight: 600; color: var(--foreground); margin: 0; }
.card-icon { width: 20px; height: 20px; color: var(--primary); }
.card-description { font-size: 14px; color: var(--muted-foreground); margin: 0 0 var(--space-4); }

.btn-add-path {
  display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3);
  background: transparent; border: 1px dashed var(--border); border-radius: var(--radius-lg);
  font-size: 13px; color: var(--muted-foreground); cursor: pointer; transition: all 0.2s;
  &:hover { border-color: var(--primary); color: var(--primary); }
  .btn-icon { width: 14px; height: 14px; }
}

// 路径卡片网格
.paths-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-3); }
.path-card {
  position: relative; padding: var(--space-4); background: var(--background); border: 2px solid var(--border);
  border-radius: var(--radius-lg); cursor: pointer; transition: all 0.2s;
  &:hover { border-color: var(--primary); }
  &.active { border-color: var(--primary); background: oklch(0.65 0.22 270 / 0.05); }
}
.path-card-header { display: flex; justify-content: space-between; margin-bottom: var(--space-3); }
.path-check {
  width: 20px; height: 20px; border-radius: var(--radius-full); border: 2px solid var(--border);
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
  .path-card.active & { background: var(--primary); border-color: var(--primary); }
  .check-icon { width: 12px; height: 12px; color: white; }
}
.path-remove {
  width: 20px; height: 20px; background: transparent; border: none; cursor: pointer;
  color: var(--muted-foreground); border-radius: var(--radius-sm); transition: all 0.2s;
  &:hover { background: var(--destructive); color: white; }
  .remove-icon { width: 14px; height: 14px; }
}
.path-card-body { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-3); }
.path-folder-icon { width: 24px; height: 24px; color: var(--warning); flex-shrink: 0; }
.path-text { font-size: 12px; color: var(--foreground); word-break: break-all; line-height: 1.4; }
.path-browse {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: var(--space-2);
  padding: var(--space-2); background: var(--secondary); border: none; border-radius: var(--radius-md);
  font-size: 12px; color: var(--secondary-foreground); cursor: pointer; transition: all 0.2s;
  &:hover { background: var(--accent); }
  .browse-icon { width: 14px; height: 14px; }
}

// Provider 卡片
.provider-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3); }
.provider-card {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
  padding: var(--space-4); background: var(--background); border: 2px solid var(--border);
  border-radius: var(--radius-lg); cursor: pointer; transition: all 0.2s;
  &:hover { border-color: var(--primary); }
  &.active { border-color: var(--primary); background: oklch(0.65 0.22 270 / 0.05); }
}
.provider-icon { width: 24px; height: 24px; color: var(--foreground); .provider-card.active & { color: var(--primary); } }
.provider-name { font-size: 14px; font-weight: 500; color: var(--foreground); }
.provider-desc { font-size: 12px; color: var(--muted-foreground); }

// 主题卡片
.theme-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); }
.theme-card {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
  padding: var(--space-4); background: var(--background); border: 2px solid var(--border);
  border-radius: var(--radius-lg); cursor: pointer; transition: all 0.2s;
  &:hover { border-color: var(--primary); }
  &.active { border-color: var(--primary); background: oklch(0.65 0.22 270 / 0.05); }
}
.theme-icon { width: 24px; height: 24px; color: var(--foreground); .theme-card.active & { color: var(--primary); } }

// 语言卡片
.language-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
.language-card {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4); background: var(--background); border: 2px solid var(--border);
  border-radius: var(--radius-lg); cursor: pointer; transition: all 0.2s;
  &:hover { border-color: var(--primary); }
  &.active { border-color: var(--primary); background: oklch(0.65 0.22 270 / 0.05); }
}
.language-flag { font-size: 20px; }

// 表单
.form-group { margin-bottom: var(--space-4); &:last-child { margin-bottom: 0; } }
.form-label { display: block; font-size: 14px; font-weight: 500; color: var(--foreground); margin-bottom: var(--space-2); }
.form-hint { font-size: 12px; color: var(--muted-foreground); margin: var(--space-1) 0 0; }
.form-input {
  width: 100%; height: 40px; padding: 0 var(--space-3); background-color: var(--background);
  border: 1px solid var(--border); border-radius: var(--radius-lg); font-size: 14px; color: var(--foreground);
  &::placeholder { color: var(--muted-foreground); }
  &:focus { outline: none; border-color: var(--ring); }
}
.input-with-action { position: relative; .form-input { padding-right: 44px; } }
.input-action {
  position: absolute; right: 0; top: 0; height: 100%; width: 40px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; cursor: pointer; color: var(--muted-foreground);
  &:hover { color: var(--foreground); }
  .action-icon { width: 16px; height: 16px; }
}

// 按钮
.settings-actions { display: flex; justify-content: flex-end; gap: var(--space-3); }
.btn-primary, .btn-secondary {
  display: inline-flex; align-items: center; gap: var(--space-2); padding: 0 var(--space-4); height: 40px;
  border-radius: var(--radius-lg); font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;
  .btn-icon { width: 16px; height: 16px; }
  .spinning { animation: spin 1s linear infinite; }
}
.btn-primary {
  background-color: var(--primary); color: var(--primary-foreground); border: none;
  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
.btn-secondary {
  background: transparent; color: var(--foreground); border: 1px solid var(--border);
  &:hover { background-color: var(--accent); }
}

.save-success {
  display: flex; align-items: center; justify-content: center; gap: var(--space-2);
  padding: var(--space-3); background-color: oklch(0.7 0.15 145 / 0.1);
  border: 1px solid oklch(0.7 0.15 145 / 0.3); border-radius: var(--radius-lg);
  color: oklch(0.7 0.15 145); font-size: 14px;
  .success-icon { width: 16px; height: 16px; }
}

// 浏览器对话框
.dialog-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.browser-dialog { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg); width: 500px; max-width: 90vw; max-height: 70vh; display: flex; flex-direction: column; }
.browser-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4); border-bottom: 1px solid var(--border); h3 { margin: 0; font-size: 16px; font-weight: 600; } }
.close-btn { background: none; border: none; padding: var(--space-2); cursor: pointer; color: var(--muted-foreground); border-radius: var(--radius-md); &:hover { background: var(--accent); } .close-icon { width: 16px; height: 16px; } }
.browser-path { display: flex; gap: var(--space-2); padding: var(--space-3); border-bottom: 1px solid var(--border); }
.path-input { flex: 1; height: 36px; padding: 0 var(--space-3); background: var(--background); border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 13px; font-family: var(--font-mono); color: var(--foreground); &:focus { outline: none; border-color: var(--ring); } }
.go-btn { padding: 0 var(--space-3); background: var(--primary); color: var(--primary-foreground); border: none; border-radius: var(--radius-md); font-size: 13px; cursor: pointer; &:hover { opacity: 0.9; } }
.browser-content { flex: 1; overflow-y: auto; min-height: 200px; max-height: 300px; }
.browser-loading { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--muted-foreground); }
.browser-list { display: flex; flex-direction: column; }
.browser-item { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); background: none; border: none; text-align: left; cursor: pointer; color: var(--foreground); font-size: 14px; &:hover { background: var(--accent); } .item-icon { width: 16px; height: 16px; color: var(--warning); } }
.browser-footer { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); border-top: 1px solid var(--border); gap: var(--space-4); }
.selected-path { flex: 1; font-size: 12px; font-family: var(--font-mono); color: var(--muted-foreground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.browser-actions { display: flex; gap: var(--space-2); }
</style>
