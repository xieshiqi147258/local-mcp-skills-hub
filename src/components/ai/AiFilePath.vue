<template>
  <span 
    class="ai-file-path"
    :class="{ 'is-clickable': clickable }"
    :title="fullPath"
    @click="handleClick"
    role="button"
    :tabindex="clickable ? 0 : -1"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- File Type Icon (Requirement 15.4) -->
    <span class="file-path-icon" :class="`icon-${fileType}`">
      <svg v-if="isFolder" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
      </svg>
      <svg v-else-if="fileType === 'js' || fileType === 'javascript'" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h18v18H3V3zm16.525 13.707c-.131-.821-.666-1.511-2.252-2.155-.552-.259-1.165-.438-1.349-.854-.068-.248-.078-.382-.034-.529.113-.484.687-.629 1.137-.495.293.09.563.315.732.676.775-.507.775-.507 1.316-.844-.203-.314-.304-.451-.439-.586-.473-.528-1.103-.798-2.126-.775l-.528.067c-.507.124-.991.395-1.283.754-.855.968-.608 2.655.427 3.354 1.023.765 2.521.933 2.712 1.653.18.878-.652 1.159-1.475 1.058-.607-.136-.945-.439-1.316-1.002l-1.372.788c.157.359.337.517.607.832 1.305 1.316 4.568 1.249 5.153-.754.021-.067.18-.528.056-1.237l.034.049zm-6.737-5.434h-1.686c0 1.453-.007 2.898-.007 4.354 0 .924.047 1.772-.104 2.033-.247.517-.886.451-1.175.359-.297-.146-.448-.349-.623-.641-.047-.078-.082-.146-.095-.146l-1.368.844c.229.473.563.879.994 1.137.641.383 1.502.507 2.404.305.588-.17 1.095-.519 1.358-1.059.384-.697.302-1.553.299-2.509.008-1.541 0-3.083 0-4.635l.003-.042z"/>
      </svg>
      <svg v-else-if="fileType === 'ts' || fileType === 'typescript'" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h18v18H3V3zm10.71 14.86c.5.98 1.51 1.73 3.09 1.73 1.6 0 2.8-.83 2.8-2.36 0-1.41-.81-2.04-2.25-2.66l-.42-.18c-.73-.31-1.04-.52-1.04-1.02 0-.41.31-.73.81-.73.48 0 .8.21 1.09.73l1.31-.87c-.55-.96-1.33-1.33-2.4-1.33-1.51 0-2.48.96-2.48 2.23 0 1.38.81 2.03 2.03 2.55l.42.18c.78.34 1.24.55 1.24 1.13 0 .48-.45.83-1.15.83-.83 0-1.31-.43-1.67-1.03l-1.38.8zm-3.71-4.5v1.36H8.45v6h1.73v-6H11.73v-1.36H6z"/>
      </svg>
      <svg v-else-if="fileType === 'vue'" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 3h3.5L12 15l6.5-12H22L12 21 2 3zm4.5 0h3L12 8.25 14.5 3h3L12 13.5 6.5 3z"/>
      </svg>
      <svg v-else-if="fileType === 'json'" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 3h2v2H5v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5h2v2H5c-1.07-.27-2-.9-2-2v-4a2 2 0 0 0-2-2H0v-2h1a2 2 0 0 0 2-2V5a2 2 0 0 1 2-2m14 0a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1v2h-1a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-2v-2h2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5h-2V3h2m-7 12a1 1 0 0 1 1 1 1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1m-4 0a1 1 0 0 1 1 1 1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1m8 0a1 1 0 0 1 1 1 1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1z"/>
      </svg>
      <svg v-else-if="fileType === 'md' || fileType === 'markdown'" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41M6.81 15.19v-3.66l1.92 2.35 1.92-2.35v3.66h1.93V8.81h-1.93l-1.92 2.35-1.92-2.35H4.89v6.38h1.92M19.69 12h-1.92V8.81h-1.92V12h-1.93l2.89 3.28L19.69 12z"/>
      </svg>
      <svg v-else-if="fileType === 'py' || fileType === 'python'" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.14 7.5A2.86 2.86 0 0 1 22 10.36v3.78A2.86 2.86 0 0 1 19.14 17H12c0 .39.32.96.71.96H17v1.68a2.86 2.86 0 0 1-2.86 2.86H9.86A2.86 2.86 0 0 1 7 19.64v-3.75a2.85 2.85 0 0 1 2.86-2.85h5.25a2.85 2.85 0 0 0 2.85-2.86V7.5h1.18m-5.25 11.61c-.4 0-.72.31-.72.71 0 .4.32.72.72.72.4 0 .71-.32.71-.72 0-.4-.31-.71-.71-.71M4.86 16.5A2.86 2.86 0 0 1 2 13.64V9.86A2.86 2.86 0 0 1 4.86 7H12c0-.39-.32-.96-.71-.96H7V4.36A2.86 2.86 0 0 1 9.86 1.5h4.28A2.86 2.86 0 0 1 17 4.36v3.75a2.85 2.85 0 0 1-2.86 2.85H8.89a2.85 2.85 0 0 0-2.85 2.86v2.68H4.86m5.25-11.61c.4 0 .72-.31.72-.71 0-.4-.32-.72-.72-.72-.4 0-.71.32-.71.72 0 .4.31.71.71.71z"/>
      </svg>
      <svg v-else-if="fileType === 'css' || fileType === 'scss' || fileType === 'sass'" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 3l-.65 3.34h13.59L17.5 8.5H3.92l-.66 3.33h13.59l-.76 3.81-5.48 1.81-4.75-1.81.33-1.64H2.85l-.79 4 7.85 3 9.05-3 1.2-6.03.24-1.21L21.94 3H5z"/>
      </svg>
      <svg v-else-if="fileType === 'html'" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 17.56l4.07-1.13.55-6.1H9.38L9.2 8.3h7.6l.2-1.99H7l.56 6.01h6.89l-.23 2.58-2.22.6-2.22-.6-.14-1.66h-2l.29 3.19L12 17.56M4.07 3h15.86L18.5 19.2 12 21l-6.5-1.8L4.07 3z"/>
      </svg>
      <svg v-else-if="fileType === 'yaml' || fileType === 'yml'" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.89 3l1.96.4L11.11 21l-1.96-.4L12.89 3m6.7 9L16 8.41V5.58L22.42 12 16 18.41v-2.83L19.59 12M7.58 12L4 8.41V5.58L-2.42 12 4 18.41v-2.83L.41 12"/>
      </svg>
      <!-- Default file icon -->
      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    </span>
    
    <!-- File Path Text (Requirement 15.4) -->
    <span class="file-path-text">{{ displayPath }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Props
interface Props {
  path: string;
  clickable?: boolean;
  maxLength?: number;
}

const props = withDefaults(defineProps<Props>(), {
  clickable: true,
  maxLength: 40,
});

// Emits
const emit = defineEmits<{
  (e: 'click', path: string): void;
  (e: 'open', path: string): void;
}>();

// Computed: Full path for tooltip
const fullPath = computed(() => props.path);

// Computed: File name from path
const fileName = computed(() => {
  const parts = props.path.split('/');
  return parts[parts.length - 1] || props.path;
});

// Computed: Check if it's a folder
const isFolder = computed(() => {
  return !fileName.value.includes('.') || props.path.endsWith('/');
});

// Computed: File type/extension
const fileType = computed(() => {
  if (isFolder.value) return 'folder';
  const ext = fileName.value.split('.').pop()?.toLowerCase() || '';
  return ext;
});

// Computed: Truncated display path (Requirement 15.4)
const displayPath = computed(() => {
  const path = props.path;
  
  if (path.length <= props.maxLength) {
    return path;
  }
  
  const parts = path.split('/');
  
  // If only one part (no slashes), truncate with ellipsis
  if (parts.length <= 1) {
    return '...' + path.slice(-(props.maxLength - 3));
  }
  
  // Try to show first folder + ... + filename
  const firstPart = parts[0] || parts[1];
  const lastPart = parts[parts.length - 1];
  
  // If first + last + ellipsis fits, use that format
  const shortPath = `${firstPart}/.../${lastPart}`;
  if (shortPath.length <= props.maxLength) {
    return shortPath;
  }
  
  // Otherwise, just show truncated filename
  if (lastPart.length > props.maxLength - 3) {
    return '...' + lastPart.slice(-(props.maxLength - 3));
  }
  
  return '.../' + lastPart;
});

// Handle click to open in editor (Requirement 15.4)
function handleClick() {
  if (props.clickable) {
    emit('click', props.path);
    emit('open', props.path);
  }
}
</script>

<style lang="scss" scoped>
.ai-file-path {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--foreground);
  background-color: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  max-width: 100%;
  vertical-align: middle;
  transition: all var(--duration-fast) var(--ease-default);

  &.is-clickable {
    cursor: pointer;

    &:hover {
      background-color: var(--accent);
      border-color: var(--primary);
      color: var(--primary);
    }

    &:focus-visible {
      outline: 2px solid var(--ring);
      outline-offset: 2px;
    }

    &:active {
      transform: scale(0.98);
    }
  }
}

.file-path-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  color: var(--muted-foreground);
  transition: color var(--duration-fast) var(--ease-default);

  // File type specific colors
  &.icon-folder {
    color: #f59e0b; // amber
  }

  &.icon-js,
  &.icon-javascript {
    color: #facc15; // yellow
  }

  &.icon-ts,
  &.icon-typescript {
    color: #3b82f6; // blue
  }

  &.icon-vue {
    color: #22c55e; // green
  }

  &.icon-json {
    color: #f97316; // orange
  }

  &.icon-md,
  &.icon-markdown {
    color: #64748b; // slate
  }

  &.icon-py,
  &.icon-python {
    color: #3b82f6; // blue
  }

  &.icon-css,
  &.icon-scss,
  &.icon-sass {
    color: #ec4899; // pink
  }

  &.icon-html {
    color: #f97316; // orange
  }

  &.icon-yaml,
  &.icon-yml {
    color: #a855f7; // purple
  }

  .is-clickable:hover & {
    color: var(--primary);
  }
}

.file-path-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

// Reduced motion
@media (prefers-reduced-motion: reduce) {
  .ai-file-path {
    transition: none;
  }
}
</style>
