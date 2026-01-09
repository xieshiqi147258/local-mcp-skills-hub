<template>
  <div class="ai-panel">
    <!-- 头部 -->
    <div class="panel-header">
      <div class="header-content">
        <div class="header-icon">
          <Sparkles class="icon" />
        </div>
        <div class="header-info">
          <h2 class="header-title">{{ t('ai.title') }}</h2>
          <p class="header-subtitle">{{ t('ai.poweredBy') }}</p>
        </div>
      </div>
      <div v-if="currentSkill" class="skill-context">
        <FileCode2 class="context-icon" />
        <span>{{ currentSkill.name }}</span>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div v-if="currentSkill" class="quick-actions">
      <button v-for="action in quickActions" :key="action.action" class="action-btn" @click="handleQuickAction(action.action)">
        <component :is="action.icon" class="action-icon" />
        {{ t(action.labelKey) }}
      </button>
    </div>

    <!-- 消息列表 -->
    <div class="messages-container" ref="messagesRef">
      <div class="messages-list">
        <div v-for="message in messages" :key="message.id" class="message" :class="message.role">
          <div v-if="message.role === 'assistant'" class="avatar assistant-avatar">
            <Bot class="avatar-icon" />
          </div>
          <div class="message-content">
            <div class="message-bubble">
              <p class="message-text">{{ message.content }}</p>
            </div>
            <div v-if="message.skillContext && message.role === 'user'" class="message-context">
              <FileCode2 class="context-icon" />
              Context: {{ message.skillContext.name }}
            </div>
          </div>
          <div v-if="message.role === 'user'" class="avatar user-avatar">
            <User class="avatar-icon" />
          </div>
        </div>
        
        <!-- 加载指示器 -->
        <div v-if="isLoading" class="message assistant">
          <div class="avatar assistant-avatar">
            <Bot class="avatar-icon" />
          </div>
          <div class="message-content">
            <div class="message-bubble loading">
              <Loader2 class="loading-icon" />
              <span>{{ t('ai.thinking') }}</span>
            </div>
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="errorMessage" class="error-toast">
          <AlertCircle class="error-icon" />
          <span>{{ errorMessage }}</span>
          <button class="dismiss-btn" @click="errorMessage = ''">×</button>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <p v-if="!currentSkill" class="input-hint">{{ t('ai.selectSkillHint') }}</p>
      <div class="input-wrapper">
        <input
          v-model="inputText"
          type="text"
          class="message-input"
          :placeholder="inputPlaceholder"
          @keydown.enter="handleSend"
          :disabled="isLoading"
        />
        <button class="send-btn" @click="handleSend" :disabled="!inputText.trim() || isLoading">
          <Send class="send-icon" />
          {{ t('ai.send') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import { Sparkles, FileCode2, Bot, User, Send, Wand2, Eye, Edit, Loader2, AlertCircle } from "lucide-vue-next";
import { useSkillsStore } from "@/stores";
import { useI18n } from "@/i18n";
import { chat, loadAiConfig, getDocsContext, type ChatMessage } from "@/utils/ai";
import type { SkillFile } from "@/utils/api";

const skillsStore = useSkillsStore();
const { t, locale } = useI18n();

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  skillContext?: SkillFile;
}

const currentSkill = computed(() => skillsStore.selectedSkill);
const inputText = ref("");
const messagesRef = ref<HTMLElement | null>(null);
const isLoading = ref(false);
const errorMessage = ref("");

const messages = ref<Message[]>([
  { id: "1", role: "assistant", content: t('ai.welcome') }
]);

// 监听语言变化
watch(locale, () => {
  if (messages.value.length === 1 && messages.value[0].id === "1") {
    messages.value[0].content = t('ai.welcome');
  }
});

const quickActions = [
  { labelKey: "ai.optimize", icon: Wand2, action: "optimize" },
  { labelKey: "ai.addExamples", icon: FileCode2, action: "examples" },
  { labelKey: "ai.review", icon: Eye, action: "review" },
  { labelKey: "ai.refactor", icon: Edit, action: "refactor" },
];

const inputPlaceholder = computed(() => {
  return currentSkill.value ? t('ai.placeholderWithSkill', { name: currentSkill.value.name }) : t('ai.placeholder');
});

watch(currentSkill, (newSkill, oldSkill) => {
  if (newSkill && newSkill.id !== oldSkill?.id) {
    const contextMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `I've loaded "${newSkill.name}". This is a ${newSkill.type} file. How can I help you with it?`,
    };
    messages.value.push(contextMessage);
    nextTick(() => scrollToBottom());
  }
});

const handleQuickAction = (action: string) => {
  if (!currentSkill.value) return;
  const actionPrompts: Record<string, string> = {
    optimize: `Please optimize the skill "${currentSkill.value.name}" for better performance and clarity.`,
    examples: `Please add more practical examples to the skill "${currentSkill.value.name}".`,
    review: `Please review the quality of the skill "${currentSkill.value.name}" and suggest improvements.`,
    refactor: `Please refactor the skill "${currentSkill.value.name}" to improve its structure.`,
  };
  inputText.value = actionPrompts[action] || `${action} the current skill: ${currentSkill.value.name}`;
};

const handleSend = async () => {
  if (!inputText.value.trim() || isLoading.value) return;

  const userMessage: Message = {
    id: Date.now().toString(),
    role: "user",
    content: inputText.value,
    skillContext: currentSkill.value || undefined,
  };

  messages.value.push(userMessage);
  const userInput = inputText.value;
  inputText.value = "";
  errorMessage.value = "";

  await nextTick();
  scrollToBottom();

  isLoading.value = true;

  try {
    // 构建上下文
    let systemPrompt = 'You are a helpful AI assistant for MCP Skills Hub. Help users create, optimize, and manage their AI skills and MCP server configurations.';
    
    // 自动检测并加载相关文档作为上下文
    const docsContext = await getDocsContext(userInput);
    if (docsContext) {
      systemPrompt += `\n\nRelevant documentation for your reference:${docsContext}`;
    }
    
    if (currentSkill.value) {
      systemPrompt += `\n\nCurrent skill context:\nFile: ${currentSkill.value.name}\nType: ${currentSkill.value.type}\nContent:\n${currentSkill.value.content}`;
    }

    // 构建消息历史
    const chatMessages: ChatMessage[] = messages.value
      .filter(m => m.id !== "1") // 排除欢迎消息
      .slice(-10) // 只保留最近10条
      .map(m => ({ role: m.role, content: m.content }));

    // 加载配置并检查
    const config = loadAiConfig();
    if (!config.apiKey && config.provider !== 'ollama') {
      throw new Error('Please configure your API key in Settings first.');
    }

    // 调用 AI API
    const response = await chat(chatMessages, { systemPrompt });

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.content,
    };
    messages.value.push(assistantMessage);

  } catch (error: any) {
    console.error('AI Error:', error);
    errorMessage.value = error.message || 'Failed to get AI response';
    
    // 添加错误消息到对话
    const errorMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `Sorry, I encountered an error: ${error.message}\n\nPlease check your API key in Settings or try again later.`,
    };
    messages.value.push(errorMsg);
  } finally {
    isLoading.value = false;
    nextTick(() => scrollToBottom());
  }
};

const scrollToBottom = () => {
  if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
};
</script>

<style lang="scss" scoped>
.ai-panel { display: flex; flex-direction: column; height: 100%; background-color: var(--background); }
.panel-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-6); border-bottom: 1px solid var(--border); background-color: var(--card); }
.header-content { display: flex; align-items: center; gap: var(--space-3); }
.header-icon {
  width: 40px; height: 40px; border-radius: var(--radius-lg); background-color: oklch(0.65 0.22 270 / 0.1);
  display: flex; align-items: center; justify-content: center;
  .icon { width: 20px; height: 20px; color: var(--primary); }
}
.header-info {
  .header-title { font-size: 18px; font-weight: 600; color: var(--foreground); margin: 0; }
  .header-subtitle { font-size: 14px; color: var(--muted-foreground); margin: 0; }
}
.skill-context {
  display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-1) var(--space-3);
  background: transparent; border: 1px solid var(--border); border-radius: var(--radius-full); font-size: 14px; color: var(--foreground);
  .context-icon { width: 12px; height: 12px; }
}

.quick-actions { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--border); background-color: var(--card); flex-wrap: wrap; }
.action-btn {
  display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-1) var(--space-3); height: 32px;
  background: transparent; border: 1px solid var(--border); border-radius: var(--radius-lg); font-size: 13px; color: var(--foreground);
  cursor: pointer; transition: all var(--duration-fast) var(--ease-default);
  &:hover { background-color: var(--accent); border-color: var(--accent); }
  .action-icon { width: 14px; height: 14px; }
}

.messages-container { flex: 1; overflow-y: auto; padding: var(--space-6); }
.messages-list { display: flex; flex-direction: column; gap: var(--space-4); max-width: 768px; margin: 0 auto; }
.message { display: flex; gap: var(--space-4); &.user { justify-content: flex-end; } }
.avatar {
  width: 32px; height: 32px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  &.assistant-avatar { background-color: oklch(0.65 0.22 270 / 0.1); .avatar-icon { color: var(--primary); } }
  &.user-avatar { background-color: var(--secondary); .avatar-icon { color: var(--secondary-foreground); } }
  .avatar-icon { width: 16px; height: 16px; }
}
.message-content { display: flex; flex-direction: column; gap: var(--space-2); max-width: 80%; }
.message-bubble {
  padding: var(--space-4); border-radius: var(--radius-lg); background-color: var(--card); border: 1px solid var(--border);
  .user & { background-color: var(--primary); border-color: var(--primary); .message-text { color: var(--primary-foreground); } }
  &.loading { display: flex; align-items: center; gap: var(--space-2); color: var(--muted-foreground); font-size: 14px; }
}
.loading-icon { width: 16px; height: 16px; animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.message-text { font-size: 14px; line-height: 1.6; color: var(--foreground); margin: 0; white-space: pre-wrap; }
.message-context {
  display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-1) var(--space-2);
  background-color: var(--secondary); border-radius: var(--radius-full); font-size: 12px; color: var(--secondary-foreground); width: fit-content;
  .context-icon { width: 12px; height: 12px; }
}

.error-toast {
  display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4);
  background-color: oklch(0.55 0.22 25 / 0.1); border: 1px solid var(--destructive); border-radius: var(--radius-lg);
  color: var(--destructive); font-size: 14px;
  .error-icon { width: 16px; height: 16px; flex-shrink: 0; }
  .dismiss-btn { margin-left: auto; background: none; border: none; color: var(--destructive); cursor: pointer; font-size: 18px; line-height: 1; }
}

.input-area { padding: var(--space-4) var(--space-6); border-top: 1px solid var(--border); background-color: var(--card); }
.input-hint { font-size: 12px; color: var(--muted-foreground); text-align: center; margin: 0 0 var(--space-3); }
.input-wrapper { display: flex; gap: var(--space-2); max-width: 768px; margin: 0 auto; }
.message-input {
  flex: 1; height: 40px; padding: 0 var(--space-4); background-color: var(--background); border: 1px solid var(--border);
  border-radius: var(--radius-lg); font-size: 14px; color: var(--foreground); transition: border-color var(--duration-fast) var(--ease-default);
  &::placeholder { color: var(--muted-foreground); }
  &:focus { outline: none; border-color: var(--ring); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
.send-btn {
  display: inline-flex; align-items: center; gap: var(--space-2); padding: 0 var(--space-4); height: 40px;
  background-color: var(--primary); color: var(--primary-foreground); border: none; border-radius: var(--radius-lg);
  font-size: 14px; font-weight: 500; cursor: pointer; transition: opacity var(--duration-fast) var(--ease-default);
  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  .send-icon { width: 16px; height: 16px; }
}
</style>
