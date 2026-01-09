<template>
  <div 
    class="ai-code-block"
    :class="{ 
      'is-collapsed': isCollapsed && shouldCollapse,
      'show-line-numbers': showLineNumbers
    }"
  >
    <!-- Header: Language label + Copy button -->
    <div class="code-block-header">
      <span class="code-block-lang">{{ displayLanguage }}</span>
      <div class="code-block-actions">
        <!-- Toggle line numbers -->
        <button 
          v-if="code.split('\n').length > 1"
          class="action-btn line-numbers-btn"
          :class="{ 'is-active': showLineNumbers }"
          @click="toggleLineNumbers"
          :title="showLineNumbers ? t('aiCodeBlock.hideLineNumbers') : t('aiCodeBlock.showLineNumbers')"
          :aria-pressed="showLineNumbers"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="4" y1="6" x2="4" y2="6" stroke-linecap="round"/>
            <line x1="4" y1="12" x2="4" y2="12" stroke-linecap="round"/>
            <line x1="4" y1="18" x2="4" y2="18" stroke-linecap="round"/>
            <line x1="8" y1="6" x2="20" y2="6"/>
            <line x1="8" y1="12" x2="20" y2="12"/>
            <line x1="8" y1="18" x2="20" y2="18"/>
          </svg>
        </button>
        <!-- Copy button -->
        <button 
          class="action-btn copy-btn"
          :class="{ 'is-copied': isCopied }"
          @click="handleCopy"
          :title="isCopied ? t('aiCodeBlock.copied') : t('aiCodeBlock.copy')"
          :aria-label="t('aiCodeBlock.copy')"
        >
          <svg v-if="!isCopied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Code content -->
    <div 
      ref="contentRef"
      class="code-block-content"
      :style="contentStyle"
    >
      <!-- Line numbers (optional) -->
      <div v-if="showLineNumbers" class="line-numbers" aria-hidden="true">
        <span 
          v-for="lineNum in displayLineCount" 
          :key="lineNum" 
          class="line-number"
        >{{ lineNum }}</span>
      </div>
      <!-- Highlighted code -->
      <pre class="hljs"><code :class="`language-${highlightLanguage}`" v-html="highlightedCode"></code></pre>
    </div>

    <!-- Show more/less toggle (Requirement 13.4, 15.5) -->
    <button 
      v-if="shouldCollapse"
      class="toggle-collapse-btn"
      @click="toggleCollapse"
      :aria-expanded="!isCollapsed"
    >
      <span>{{ isCollapsed ? t('aiCodeBlock.showMore') : t('aiCodeBlock.showLess') }}</span>
      <svg 
        width="12" 
        height="12" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
        :class="{ 'is-rotated': !isCollapsed }"
      >
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from '@/i18n';
import { useToast } from '@/composables/useToast';
import hljs from 'highlight.js';

// Props
interface Props {
  code: string;
  language?: string;
  maxHeight?: number;        // Max height in px before collapsing (default: 300)
  collapsedHeight?: number;  // Height when collapsed (default: 150)
  defaultCollapsed?: boolean; // Start collapsed if code is long
  lineNumbersVisible?: boolean; // Show line numbers by default
}

const props = withDefaults(defineProps<Props>(), {
  language: '',
  maxHeight: 300,
  collapsedHeight: 150,
  defaultCollapsed: true,
  lineNumbersVisible: false,
});

// Emits
const emit = defineEmits<{
  (e: 'copy', code: string): void;
}>();

// i18n and toast
const { t } = useI18n();
const toast = useToast();

// State
const isCopied = ref(false);
const isCollapsed = ref(props.defaultCollapsed);
const showLineNumbers = ref(props.lineNumbersVisible);
const contentRef = ref<HTMLElement | null>(null);
const actualContentHeight = ref(0);

// Language mapping for highlight.js
const languageMap: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'jsx': 'javascript',
  'tsx': 'typescript',
  'vue': 'xml',
  'svelte': 'xml',
  'py': 'python',
  'rb': 'ruby',
  'go': 'go',
  'rs': 'rust',
  'kt': 'kotlin',
  'yml': 'yaml',
  'md': 'markdown',
  'sh': 'bash',
  'zsh': 'bash',
  'shell': 'bash',
  'json5': 'json',
  'jsonc': 'json',
  'htm': 'html',
  'scss': 'css',
  'sass': 'css',
  'less': 'css',
  'styl': 'css',
  'stylus': 'css',
  'dockerfile': 'docker',
  'makefile': 'makefile',
  'mk': 'makefile',
  'tf': 'hcl',
  'terraform': 'hcl',
};

// Computed: Normalize language for highlight.js
const highlightLanguage = computed(() => {
  const lang = props.language?.toLowerCase().trim() || '';
  const mapped = languageMap[lang] || lang;
  
  // Check if language is supported
  if (mapped && hljs.getLanguage(mapped)) {
    return mapped;
  }
  return 'plaintext';
});

// Computed: Display language label
const displayLanguage = computed(() => {
  return props.language?.toLowerCase() || 'text';
});

// Computed: Syntax highlighted code
const highlightedCode = computed(() => {
  if (!props.code) return '';
  
  const lang = highlightLanguage.value;
  try {
    if (lang !== 'plaintext' && hljs.getLanguage(lang)) {
      return hljs.highlight(props.code, { language: lang }).value;
    }
  } catch (e) {
    console.warn('Highlight.js error:', e);
  }
  
  // Fallback: escape HTML
  return props.code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
});

// Computed: Line count
const lineCount = computed(() => {
  return props.code.split('\n').length;
});

// Computed: Display line count (for collapsed state)
const displayLineCount = computed(() => {
  if (isCollapsed.value && shouldCollapse.value) {
    // Estimate visible lines based on collapsed height
    const estimatedLines = Math.floor(props.collapsedHeight / 20); // ~20px per line
    return Math.min(lineCount.value, estimatedLines);
  }
  return lineCount.value;
});

// Computed: Should show collapse toggle
const shouldCollapse = computed(() => {
  // Show collapse if content exceeds max height
  return actualContentHeight.value > props.maxHeight || lineCount.value > 15;
});

// Computed: Content style for collapse animation
const contentStyle = computed(() => {
  if (!shouldCollapse.value) {
    return { maxHeight: `${props.maxHeight}px` };
  }
  
  if (isCollapsed.value) {
    return { maxHeight: `${props.collapsedHeight}px` };
  }
  
  return { maxHeight: `${Math.max(actualContentHeight.value, props.maxHeight)}px` };
});

// Methods
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

function toggleLineNumbers() {
  showLineNumbers.value = !showLineNumbers.value;
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(props.code);
    isCopied.value = true;
    emit('copy', props.code);
    toast.success(t('aiCodeBlock.copied'));
    
    // Reset after 2 seconds
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy code:', err);
    toast.error(t('aiCodeBlock.copyFailed'));
  }
}

// Measure actual content height
function measureContentHeight() {
  if (contentRef.value) {
    // Temporarily remove max-height to measure actual height
    const el = contentRef.value;
    const originalMaxHeight = el.style.maxHeight;
    el.style.maxHeight = 'none';
    actualContentHeight.value = el.scrollHeight;
    el.style.maxHeight = originalMaxHeight;
  }
}

// Watch for code changes
watch(() => props.code, () => {
  // Re-measure on code change
  setTimeout(measureContentHeight, 0);
});

// Lifecycle
onMounted(() => {
  measureContentHeight();
});
</script>


<style lang="scss" scoped>
.ai-code-block {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg);
  overflow: hidden;
  // Always use dark background (Requirement 15.3)
  background-color: oklch(0.12 0 0);
  border: 1px solid oklch(0.24 0 0);
  font-family: var(--font-mono);

  &.is-collapsed {
    .code-block-content {
      // Fade out effect at bottom when collapsed
      mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
      -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
    }
  }
}

// Header with language label and actions
.code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  background-color: oklch(0.16 0 0);
  border-bottom: 1px solid oklch(0.24 0 0);
  min-height: 36px;
}

.code-block-lang {
  font-size: 12px;
  font-weight: 500;
  color: oklch(0.55 0 0);
  text-transform: lowercase;
  letter-spacing: 0.3px;
}

.code-block-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: oklch(0.55 0 0);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-default),
              background-color var(--duration-fast) var(--ease-default),
              color var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: oklch(0.26 0 0);
    color: oklch(0.95 0 0);
  }

  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
    opacity: 1;
  }

  &.is-active {
    color: var(--primary);
    opacity: 1;
  }

  &.is-copied {
    color: var(--success);
    opacity: 1;
  }
}

// Show actions on hover
.ai-code-block:hover .action-btn {
  opacity: 1;
}

// Code content area
.code-block-content {
  display: flex;
  overflow: auto;
  transition: max-height var(--duration-normal) var(--ease-out);
}

// Line numbers (Requirement 13.3)
.line-numbers {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: var(--space-3) 0;
  padding-left: var(--space-3);
  padding-right: var(--space-2);
  background-color: oklch(0.14 0 0);
  border-right: 1px solid oklch(0.24 0 0);
  user-select: none;
  text-align: right;
}

.line-number {
  font-size: 12px;
  line-height: 1.5;
  color: oklch(0.4 0 0);
  min-width: 24px;
}

// Code pre/code elements
pre.hljs {
  flex: 1;
  margin: 0;
  padding: var(--space-3);
  background: transparent;
  overflow-x: auto;
  white-space: pre;

  code {
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.5;
    color: oklch(0.88 0 0);
    background: transparent;
    padding: 0;
    white-space: pre;
    word-break: normal;
    word-wrap: normal;
  }
}

// Show more/less toggle button (Requirement 13.4, 15.5)
.toggle-collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  width: 100%;
  padding: var(--space-2);
  font-size: 12px;
  font-weight: 500;
  font-family: var(--font-sans);
  color: var(--primary);
  background-color: oklch(0.16 0 0);
  border: none;
  border-top: 1px solid oklch(0.24 0 0);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: oklch(0.2 0 0);
  }

  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: -2px;
  }

  svg {
    flex-shrink: 0;
    transition: transform var(--duration-fast) var(--ease-default);

    &.is-rotated {
      transform: rotate(180deg);
    }
  }
}

// Hide line numbers by default, show when toggled
.ai-code-block:not(.show-line-numbers) {
  .line-numbers {
    display: none;
  }
}

// Responsive adjustments
@media (max-width: 640px) {
  .code-block-header {
    padding: var(--space-1) var(--space-2);
    min-height: 32px;
  }

  .code-block-lang {
    font-size: 11px;
  }

  .action-btn {
    width: 24px;
    height: 24px;
    opacity: 1; // Always show on mobile
  }

  pre.hljs code {
    font-size: 12px;
  }

  .line-numbers {
    display: none; // Hide line numbers on mobile
  }
}

// Reduced motion preference
@media (prefers-reduced-motion: reduce) {
  .action-btn,
  .toggle-collapse-btn,
  .toggle-collapse-btn svg,
  .code-block-content {
    transition: none;
  }

  .ai-code-block.is-collapsed .code-block-content {
    mask-image: none;
    -webkit-mask-image: none;
  }
}
</style>
