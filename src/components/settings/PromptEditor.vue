<template>
  <div class="prompt-editor">
    <!-- 编辑器头部 -->
    <div class="editor-header">
      <div class="editor-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'skills' }"
          @click="activeTab = 'skills'"
        >
          <Sparkles class="tab-icon" />
          Skills 提示词
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'mcp' }"
          @click="activeTab = 'mcp'"
        >
          <Settings class="tab-icon" />
          MCP 提示词
        </button>
      </div>
      <button class="reset-btn" @click="handleReset">
        <RotateCcw class="btn-icon" />
        重置为默认
      </button>
    </div>

    <!-- 编辑区域 -->
    <div class="editor-content">
      <!-- 左侧：编辑器 -->
      <div class="editor-pane">
        <div class="pane-header">
          <span class="pane-title">编辑</span>
          <div class="variable-hints">
            <span class="hint-label">可用变量:</span>
            <code 
              v-for="variable in availableVariables" 
              :key="variable"
              class="variable-chip"
              @click="insertVariable(variable)"
            >
              {{ variable }}
            </code>
          </div>
        </div>
        <div class="editor-wrapper">
          <div 
            class="highlighted-backdrop"
            v-html="highlightedContent"
          ></div>
          <textarea
            ref="textareaRef"
            class="editor-textarea"
            :value="currentPrompt"
            @input="handleInput"
            @scroll="syncScroll"
            placeholder="输入系统提示词..."
            spellcheck="false"
          ></textarea>
        </div>
      </div>

      <!-- 右侧：预览 -->
      <div class="preview-pane">
        <div class="pane-header">
          <span class="pane-title">预览</span>
          <span class="preview-hint">变量已替换为当前值</span>
        </div>
        <div class="preview-content">
          <pre class="preview-text">{{ previewContent }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { Sparkles, Settings, RotateCcw } from 'lucide-vue-next';
import { useSettingsStore, DEFAULT_PROMPTS, replaceTemplateVariables } from '@/stores/settings';

const settingsStore = useSettingsStore();

// 当前激活的标签页
const activeTab = ref<'skills' | 'mcp'>('skills');

// textarea 引用
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// 可用的模板变量
const availableVariables = [
  '{{skills_workspace}}',
  '{{mcp_config_path}}',
  '{{current_file}}',
  '{{current_folder}}'
];

// 当前编辑的提示词
const currentPrompt = computed(() => {
  return activeTab.value === 'skills' 
    ? settingsStore.systemPrompts.skills 
    : settingsStore.systemPrompts.mcp;
});

// 高亮显示的内容（变量高亮）
const highlightedContent = computed(() => {
  const content = currentPrompt.value;
  // 转义 HTML 特殊字符
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // 高亮模板变量
  return escaped.replace(
    /\{\{(\w+)\}\}/g,
    '<span class="variable-highlight">{{$1}}</span>'
  );
});

// 预览内容（变量已替换）
const previewContent = computed(() => {
  const template = currentPrompt.value;
  const context = settingsStore.getTemplateContext();
  return replaceTemplateVariables(template, context);
});

// 处理输入
const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  const value = target.value;
  
  if (activeTab.value === 'skills') {
    settingsStore.setSkillsPrompt(value);
  } else {
    settingsStore.setMcpPrompt(value);
  }
};

// 同步滚动
const syncScroll = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement;
  const backdrop = textarea.previousElementSibling as HTMLElement;
  if (backdrop) {
    backdrop.scrollTop = textarea.scrollTop;
    backdrop.scrollLeft = textarea.scrollLeft;
  }
};

// 插入变量
const insertVariable = (variable: string) => {
  const textarea = textareaRef.value;
  if (!textarea) return;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = currentPrompt.value;
  const newText = text.substring(0, start) + variable + text.substring(end);
  
  if (activeTab.value === 'skills') {
    settingsStore.setSkillsPrompt(newText);
  } else {
    settingsStore.setMcpPrompt(newText);
  }
  
  // 恢复光标位置
  nextTick(() => {
    textarea.focus();
    textarea.setSelectionRange(start + variable.length, start + variable.length);
  });
};

// 重置为默认
const handleReset = () => {
  if (confirm('确定要重置为默认提示词吗？当前的自定义内容将丢失。')) {
    if (activeTab.value === 'skills') {
      settingsStore.setSkillsPrompt(DEFAULT_PROMPTS.skills);
    } else {
      settingsStore.setMcpPrompt(DEFAULT_PROMPTS.mcp);
    }
  }
};
</script>


<style lang="scss" scoped>
.prompt-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.editor-tabs {
  display: flex;
  gap: var(--space-2);
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: 14px;
  color: var(--muted-foreground);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--primary);
    color: var(--foreground);
  }

  &.active {
    background: var(--primary);
    border-color: var(--primary);
    color: var(--primary-foreground);
  }

  .tab-icon {
    width: 16px;
    height: 16px;
  }
}

.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: 13px;
  color: var(--muted-foreground);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--destructive);
    color: var(--destructive);
  }

  .btn-icon {
    width: 14px;
    height: 14px;
  }
}

.editor-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  flex: 1;
  min-height: 0;
}

.editor-pane,
.preview-pane {
  display: flex;
  flex-direction: column;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--card);
  border-bottom: 1px solid var(--border);
}

.pane-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--foreground);
}

.variable-hints {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.hint-label {
  font-size: 12px;
  color: var(--muted-foreground);
}

.variable-chip {
  padding: 2px 6px;
  background: var(--accent);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--primary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--primary);
    color: var(--primary-foreground);
  }
}

.preview-hint {
  font-size: 11px;
  color: var(--muted-foreground);
}

.editor-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
}

.highlighted-backdrop {
  position: absolute;
  inset: 0;
  padding: var(--space-4);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: transparent;
  pointer-events: none;
  overflow: auto;

  :deep(.variable-highlight) {
    background: oklch(0.65 0.22 270 / 0.2);
    color: var(--primary);
    border-radius: 3px;
    padding: 1px 2px;
  }
}

.editor-textarea {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: var(--space-4);
  background: transparent;
  border: none;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--foreground);
  resize: none;
  caret-color: var(--primary);

  &::placeholder {
    color: var(--muted-foreground);
  }

  &:focus {
    outline: none;
  }
}

.preview-content {
  flex: 1;
  padding: var(--space-4);
  overflow: auto;
}

.preview-text {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--foreground);
  white-space: pre-wrap;
  word-wrap: break-word;
}

// 响应式布局
@media (max-width: 900px) {
  .editor-content {
    grid-template-columns: 1fr;
  }

  .variable-hints {
    display: none;
  }
}
</style>
