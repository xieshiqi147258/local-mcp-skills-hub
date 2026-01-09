<template>
  <aside class="ai-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <span>🤖</span>
        {{ t('aiPanel.title') }}
      </h3>
      <button class="panel-close" @click="settingsStore.toggleAiPanel">
        ✕
      </button>
    </div>

    <div class="panel-body">
      <!-- 消息列表 -->
      <div class="messages" ref="messagesRef">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="message"
          :class="msg.role"
        >
          <div class="message-avatar">
            {{ msg.role === "user" ? "👤" : "🤖" }}
          </div>
          <div class="message-content">
            {{ msg.content }}
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="messages.length === 0" class="pulse-empty">
          <div class="empty-icon">💬</div>
          <h3 class="empty-title">{{ t('aiPanel.emptyTitle') }}</h3>
          <p class="empty-desc">{{ t('aiPanel.emptyDesc') }}</p>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <div class="input-wrapper">
        <div class="pulse-search input-area">
          <a-textarea
            v-model="inputText"
            :placeholder="t('aiPanel.placeholder')"
            :auto-size="{ minRows: 1, maxRows: 4 }"
            @keydown.enter.exact.prevent="sendMessage"
          />
        </div>
        <button class="send-btn" @click="sendMessage" :disabled="!inputText.trim()">
          ➤
        </button>
      </div>
      <div class="input-footer">
        <a-select v-model="selectedModel" size="mini" style="width: 120px">
          <a-option value="claude">Claude</a-option>
          <a-option value="gpt4">GPT-4</a-option>
          <a-option value="ollama">Ollama</a-option>
        </a-select>
        <span class="context-hint">{{ t('aiPanel.contextHint') }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { useSettingsStore } from "@/stores";
import { useI18n } from "@/i18n";
import { chat, getDocsContext, type ChatMessage, type ChatOptions } from "@/utils/ai";

const settingsStore = useSettingsStore();
const { t } = useI18n();

interface Message {
  role: "user" | "assistant";
  content: string;
}

const messages = ref<Message[]>([]);
const inputText = ref("");
const selectedModel = ref("claude");
const messagesRef = ref<HTMLElement>();
const isLoading = ref(false);

// AI 配置
const aiConfig = ref<ChatOptions>({
  provider: 'anthropic',
  model: 'claude-3-5-sonnet',
  apiKey: '',
});

// 加载配置
onMounted(() => {
  aiConfig.value.apiKey = localStorage.getItem('ai_api_key') || '';
  const savedProvider = localStorage.getItem('ai_provider');
  const savedModel = localStorage.getItem('ai_model');
  if (savedProvider) aiConfig.value.provider = savedProvider as ChatOptions['provider'];
  if (savedModel) aiConfig.value.model = savedModel;
  
  // 同步选择器
  if (savedProvider === 'openai') selectedModel.value = 'gpt4';
  else if (savedProvider === 'ollama') selectedModel.value = 'ollama';
  else selectedModel.value = 'claude';
});

const sendMessage = async () => {
  if (!inputText.value.trim() || isLoading.value) return;

  messages.value.push({ role: "user", content: inputText.value });
  const userInput = inputText.value;
  inputText.value = "";
  
  await nextTick();
  scrollToBottom();

  isLoading.value = true;

  try {
    // 更新配置
    if (selectedModel.value === 'gpt4') {
      aiConfig.value.provider = 'openai';
      aiConfig.value.model = 'gpt-4';
    } else if (selectedModel.value === 'ollama') {
      aiConfig.value.provider = 'ollama';
      aiConfig.value.model = 'llama3.2';
    } else {
      aiConfig.value.provider = 'anthropic';
      aiConfig.value.model = 'claude-3-5-sonnet';
    }

    // 检查 API Key
    if (!aiConfig.value.apiKey && aiConfig.value.provider !== 'ollama') {
      throw new Error('Please configure API key in Settings');
    }

    // 自动检测并加载相关文档作为上下文
    const docsContext = await getDocsContext(userInput);
    let systemPrompt = 'You are a helpful AI assistant for MCP Skills Hub.';
    if (docsContext) {
      systemPrompt += `\n\nRelevant documentation for your reference:${docsContext}`;
    }

    const chatMessages: ChatMessage[] = messages.value.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    const response = await chat(chatMessages, { ...aiConfig.value, systemPrompt });
    messages.value.push({ role: "assistant", content: response.content });

  } catch (error: any) {
    messages.value.push({
      role: "assistant",
      content: `Error: ${error.message}`,
    });
  } finally {
    isLoading.value = false;
    await nextTick();
    scrollToBottom();
  }
};

const scrollToBottom = () => {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
};
</script>

<style lang="scss" scoped>
.ai-panel {
  display: flex;
  flex-direction: column;
  width: var(--ai-panel-width);
  background-color: var(--bg-surface);
  border-left: 1px solid var(--border-subtle);
  position: fixed;
  right: 0;
  top: var(--titlebar-height);
  bottom: var(--statusbar-height);
  z-index: 100;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.panel-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-md);
  font-size: 12px;
  transition: all var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
}

.panel-body {
  flex: 1;
  overflow: hidden;
}

.messages {
  height: 100%;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.message {
  display: flex;
  gap: var(--space-3);

  &.user {
    flex-direction: row-reverse;

    .message-content {
      background: var(--accent-gradient);
      color: white;
      border-radius: var(--radius-xl) var(--radius-md) var(--radius-xl) var(--radius-xl);
    }
  }

  &.assistant {
    .message-content {
      background-color: var(--bg-elevated);
      color: var(--text-primary);
      border-radius: var(--radius-md) var(--radius-xl) var(--radius-xl) var(--radius-xl);
    }
  }
}

.message-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  background-color: var(--bg-elevated);
  border-radius: var(--radius-full);
}

.message-content {
  padding: var(--space-3) var(--space-4);
  font-size: 14px;
  line-height: 1.5;
  max-width: 85%;
}

.pulse-empty {
  height: 100%;
  padding: var(--space-8);
}

.panel-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.input-wrapper {
  display: flex;
  gap: var(--space-2);
  align-items: flex-end;

  .input-area {
    flex: 1;
    padding: var(--space-2) var(--space-3);

    :deep(.arco-textarea-wrapper) {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }

    :deep(.arco-textarea) {
      resize: none;
    }
  }
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: var(--accent-gradient);
  color: white;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 16px;
  flex-shrink: 0;
  transition: all var(--duration-fast) var(--ease-default);

  &:hover:not(:disabled) {
    opacity: 0.9;
    box-shadow: var(--glow-accent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-3);
  font-size: 12px;
  color: var(--text-tertiary);
}

.context-hint {
  font-size: 11px;
}
</style>
