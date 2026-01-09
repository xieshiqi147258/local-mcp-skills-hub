<template>
  <div 
    class="ai-diff-view"
    :class="{ 'ai-diff-view--expanded': isExpanded }"
    role="region"
    :aria-label="t('aiDiff.ariaLabel')"
  >
    <!-- Header -->
    <div class="ai-diff-view__header">
      <div class="ai-diff-view__title">
        <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        <span class="title-text">{{ t('aiDiff.editFile') }}: {{ fileName }}</span>
      </div>
      <div class="ai-diff-view__stats">
        <span class="stat stat--added" v-if="stats.added > 0">
          +{{ stats.added }}
        </span>
        <span class="stat stat--removed" v-if="stats.removed > 0">
          -{{ stats.removed }}
        </span>
      </div>
      <button 
        class="ai-diff-view__toggle"
        @click="isExpanded = !isExpanded"
        :aria-expanded="isExpanded"
        :aria-label="isExpanded ? t('aiDiff.collapse') : t('aiDiff.expand')"
      >
        <svg 
          class="toggle-icon" 
          :class="{ 'toggle-icon--expanded': isExpanded }"
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
    </div>

    <!-- Diff Content -->
    <Transition name="slide">
      <div v-show="isExpanded" class="ai-diff-view__content">
        <!-- View Mode Toggle -->
        <div class="ai-diff-view__toolbar">
          <div class="view-mode-toggle" role="tablist">
            <button
              class="view-mode-btn"
              :class="{ 'view-mode-btn--active': viewMode === 'inline' }"
              @click="viewMode = 'inline'"
              role="tab"
              :aria-selected="viewMode === 'inline'"
            >
              {{ t('aiDiff.inlineView') }}
            </button>
            <button
              class="view-mode-btn"
              :class="{ 'view-mode-btn--active': viewMode === 'side-by-side' }"
              @click="viewMode = 'side-by-side'"
              role="tab"
              :aria-selected="viewMode === 'side-by-side'"
            >
              {{ t('aiDiff.sideBySide') }}
            </button>
          </div>
        </div>

        <!-- Inline Diff View -->
        <div v-if="viewMode === 'inline'" class="diff-inline" role="table" :aria-label="t('aiDiff.inlineView')">
          <div 
            v-for="(line, index) in diffLines" 
            :key="index"
            class="diff-line"
            :class="getDiffLineClass(line)"
            role="row"
          >
            <span class="diff-line__number" role="cell" aria-label="Line number">
              {{ line.lineNumber || '' }}
            </span>
            <span class="diff-line__indicator" role="cell" aria-label="Change type">
              {{ line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ' }}
            </span>
            <span class="diff-line__content" role="cell">
              <code>{{ line.content }}</code>
            </span>
          </div>
        </div>

        <!-- Side-by-Side Diff View -->
        <div v-else class="diff-side-by-side" role="table" :aria-label="t('aiDiff.sideBySide')">
          <div class="diff-side diff-side--old">
            <div class="diff-side__header">{{ t('aiDiff.original') }}</div>
            <div 
              v-for="(line, index) in sideBySideLines.old" 
              :key="'old-' + index"
              class="diff-line"
              :class="getDiffLineClass(line)"
              role="row"
            >
              <span class="diff-line__number" role="cell">{{ line.lineNumber || '' }}</span>
              <span class="diff-line__content" role="cell">
                <code>{{ line.content }}</code>
              </span>
            </div>
          </div>
          <div class="diff-side diff-side--new">
            <div class="diff-side__header">{{ t('aiDiff.modified') }}</div>
            <div 
              v-for="(line, index) in sideBySideLines.new" 
              :key="'new-' + index"
              class="diff-line"
              :class="getDiffLineClass(line)"
              role="row"
            >
              <span class="diff-line__number" role="cell">{{ line.lineNumber || '' }}</span>
              <span class="diff-line__content" role="cell">
                <code>{{ line.content }}</code>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Action Buttons -->
    <div class="ai-diff-view__actions">
      <button 
        class="action-btn action-btn--reject"
        @click="handleReject"
        :disabled="isProcessing"
        :aria-label="t('aiDiff.rejectChanges')"
      >
        <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        <span>{{ t('aiDiff.reject') }}</span>
      </button>
      <button 
        class="action-btn action-btn--approve"
        @click="handleApprove"
        :disabled="isProcessing"
        :aria-label="t('aiDiff.applyChanges')"
      >
        <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>{{ t('aiDiff.apply') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { diffLines as computeDiffLines, type Change } from 'diff';
import { useI18n } from '@/i18n';

// Types
interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

interface SideBySideLines {
  old: DiffLine[];
  new: DiffLine[];
}

interface DiffStats {
  added: number;
  removed: number;
}

// Props
interface Props {
  filePath: string;
  oldContent: string;
  newContent: string;
  isProcessing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isProcessing: false,
});

// Emits
const emit = defineEmits<{
  (e: 'approve'): void;
  (e: 'reject'): void;
}>();

// i18n
const { t } = useI18n();

// Local state
const isExpanded = ref(true);
const viewMode = ref<'inline' | 'side-by-side'>('inline');

// Computed: Extract file name from path
const fileName = computed(() => {
  const parts = props.filePath.split(/[/\\]/);
  return parts[parts.length - 1] || props.filePath;
});

// Computed: Calculate diff using the diff library
const diffResult = computed<Change[]>(() => {
  return computeDiffLines(props.oldContent, props.newContent);
});

// Computed: Transform diff result to line-by-line format for inline view
const diffLines = computed<DiffLine[]>(() => {
  const lines: DiffLine[] = [];
  let lineNumber = 1;

  for (const change of diffResult.value) {
    const changeLines = change.value.split('\n');
    // Remove last empty element if the string ends with newline
    if (changeLines[changeLines.length - 1] === '') {
      changeLines.pop();
    }

    for (const line of changeLines) {
      if (change.added) {
        lines.push({
          type: 'added',
          content: line,
          lineNumber: lineNumber++,
        });
      } else if (change.removed) {
        lines.push({
          type: 'removed',
          content: line,
          // Removed lines don't increment line number
        });
      } else {
        lines.push({
          type: 'unchanged',
          content: line,
          lineNumber: lineNumber++,
        });
      }
    }
  }

  return lines;
});

// Computed: Transform diff result for side-by-side view
const sideBySideLines = computed<SideBySideLines>(() => {
  const oldLines: DiffLine[] = [];
  const newLines: DiffLine[] = [];
  let oldLineNum = 1;
  let newLineNum = 1;

  for (const change of diffResult.value) {
    const changeLines = change.value.split('\n');
    if (changeLines[changeLines.length - 1] === '') {
      changeLines.pop();
    }

    for (const line of changeLines) {
      if (change.added) {
        // Added line: empty on old side, content on new side
        oldLines.push({ type: 'unchanged', content: '', lineNumber: undefined });
        newLines.push({ type: 'added', content: line, lineNumber: newLineNum++ });
      } else if (change.removed) {
        // Removed line: content on old side, empty on new side
        oldLines.push({ type: 'removed', content: line, lineNumber: oldLineNum++ });
        newLines.push({ type: 'unchanged', content: '', lineNumber: undefined });
      } else {
        // Unchanged: same on both sides
        oldLines.push({ type: 'unchanged', content: line, lineNumber: oldLineNum++ });
        newLines.push({ type: 'unchanged', content: line, lineNumber: newLineNum++ });
      }
    }
  }

  return { old: oldLines, new: newLines };
});

// Computed: Statistics
const stats = computed<DiffStats>(() => {
  let added = 0;
  let removed = 0;

  for (const line of diffLines.value) {
    if (line.type === 'added') added++;
    if (line.type === 'removed') removed++;
  }

  return { added, removed };
});

// Methods
function getDiffLineClass(line: DiffLine): Record<string, boolean> {
  return {
    'diff-line--added': line.type === 'added',
    'diff-line--removed': line.type === 'removed',
    'diff-line--unchanged': line.type === 'unchanged',
  };
}

function handleApprove() {
  emit('approve');
}

function handleReject() {
  emit('reject');
}
</script>


<style lang="scss" scoped>
.ai-diff-view {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin: var(--space-2) 0;
}

// Header
.ai-diff-view__header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--muted);
  border-bottom: 1px solid var(--border);
}

.ai-diff-view__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;

  .title-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: var(--primary);
  }

  .title-text {
    font-size: 13px;
    font-weight: 500;
    color: var(--foreground);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: var(--font-mono);
  }
}

.ai-diff-view__stats {
  display: flex;
  gap: var(--space-2);

  .stat {
    font-size: 12px;
    font-weight: 600;
    font-family: var(--font-mono);
    padding: 2px 6px;
    border-radius: var(--radius-sm);

    &--added {
      color: var(--diff-add-text);
      background-color: var(--diff-add-bg);
    }

    &--removed {
      color: var(--diff-remove-text);
      background-color: var(--diff-remove-bg);
    }
  }
}

.ai-diff-view__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--muted-foreground);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);

  &:hover {
    background-color: var(--accent);
    color: var(--foreground);
  }

  .toggle-icon {
    width: 16px;
    height: 16px;
    transition: transform var(--duration-normal) var(--ease-default);

    &--expanded {
      transform: rotate(180deg);
    }
  }
}

// Content
.ai-diff-view__content {
  max-height: 400px;
  overflow: auto;
}

// Toolbar
.ai-diff-view__toolbar {
  display: flex;
  justify-content: flex-end;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border);
  background-color: var(--card);
}

.view-mode-toggle {
  display: flex;
  background-color: var(--muted);
  border-radius: var(--radius-md);
  padding: 2px;
}

.view-mode-btn {
  padding: var(--space-1) var(--space-3);
  border: none;
  background: transparent;
  color: var(--muted-foreground);
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);

  &:hover:not(.view-mode-btn--active) {
    color: var(--foreground);
  }

  &--active {
    background-color: var(--card);
    color: var(--foreground);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
}

// Inline Diff
.diff-inline {
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
}

.diff-line {
  display: flex;
  min-height: 20px;

  &--added {
    background-color: var(--diff-add-bg);
    
    .diff-line__indicator {
      color: var(--diff-add-text);
    }
  }

  &--removed {
    background-color: var(--diff-remove-bg);
    
    .diff-line__indicator {
      color: var(--diff-remove-text);
    }
  }

  &--unchanged {
    background-color: transparent;
    
    .diff-line__indicator {
      color: var(--muted-foreground);
    }
  }
}

.diff-line__number {
  width: 40px;
  padding: 0 var(--space-2);
  text-align: right;
  color: var(--muted-foreground);
  background-color: rgba(0, 0, 0, 0.05);
  user-select: none;
  flex-shrink: 0;
}

.diff-line__indicator {
  width: 20px;
  text-align: center;
  font-weight: 600;
  user-select: none;
  flex-shrink: 0;
}

.diff-line__content {
  flex: 1;
  padding: 0 var(--space-2);
  white-space: pre;
  overflow-x: auto;

  code {
    font-family: inherit;
  }
}

// Side-by-Side Diff
.diff-side-by-side {
  display: flex;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
}

.diff-side {
  flex: 1;
  min-width: 0;
  overflow-x: auto;

  &--old {
    border-right: 1px solid var(--border);
  }
}

.diff-side__header {
  padding: var(--space-2) var(--space-3);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--muted-foreground);
  background-color: var(--muted);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 1;
}

// Actions
.ai-diff-view__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border);
  background-color: var(--muted);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-icon {
    width: 16px;
    height: 16px;
  }

  &--approve {
    background-color: var(--tool-success);
    color: white;

    &:hover:not(:disabled) {
      filter: brightness(0.9);
    }
  }

  &--reject {
    background-color: var(--muted);
    color: var(--foreground);
    border: 1px solid var(--border);

    &:hover:not(:disabled) {
      background-color: var(--accent);
      border-color: var(--tool-error);
      color: var(--tool-error);
    }
  }
}

// Slide transition
.slide-enter-active,
.slide-leave-active {
  transition: all var(--duration-normal) var(--ease-default);
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 400px;
  opacity: 1;
}

// Respect reduced motion preference
@media (prefers-reduced-motion: reduce) {
  .ai-diff-view__toggle .toggle-icon,
  .action-btn,
  .view-mode-btn {
    transition: none;
  }

  .slide-enter-active,
  .slide-leave-active {
    transition: none;
  }
}

// Light mode adjustments
:root[data-theme="light"] .ai-diff-view,
.light .ai-diff-view {
  .diff-line__number {
    background-color: rgba(0, 0, 0, 0.03);
  }
}

// Dark mode specific
:root[data-theme="dark"] .ai-diff-view,
.dark .ai-diff-view {
  .diff-line__number {
    background-color: rgba(255, 255, 255, 0.03);
  }
}
</style>
