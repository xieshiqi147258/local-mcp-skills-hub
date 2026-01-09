<template>
  <div 
    ref="containerRef"
    class="message-list"
    role="log"
    :aria-label="t('aiMessageList.ariaLabel')"
    aria-live="polite"
    @keydown="handleKeyDown"
  >
    <!-- Date group separators and messages -->
    <template v-for="(group, groupIndex) in groupedMessages" :key="group.date">
      <!-- Date separator -->
      <div class="message-list__date-separator" role="separator">
        <span class="date-label">{{ group.label }}</span>
      </div>
      
      <!-- Messages in this date group -->
      <div
        v-for="(message, messageIndex) in group.messages"
        :key="message.id"
        :ref="el => setMessageRef(el, groupIndex, messageIndex)"
        :tabindex="getFocusIndex(groupIndex, messageIndex) === focusedIndex ? 0 : -1"
        class="message-list__item"
        :class="{ 'message-list__item--focused': getFocusIndex(groupIndex, messageIndex) === focusedIndex }"
        @focus="handleMessageFocus(groupIndex, messageIndex)"
      >
        <AiMessage
          :message="message"
          @copy-text="$emit('copy-text', message)"
          @copy-code="$emit('copy-code', message)"
          @regenerate="$emit('regenerate', message)"
          @edit="$emit('edit', message)"
          @delete="$emit('delete', message)"
          @approve-diff="$emit('approve-diff', $event)"
          @reject-diff="$emit('reject-diff', $event)"
        />
      </div>
    </template>
    
    <!-- Typing indicator -->
    <div v-if="isLoading" class="message-list__typing">
      <AiTypingIndicator 
        :show-stop-button="true"
        @stop="$emit('stop-generation')"
      />
    </div>
    
    <!-- Scroll anchor for auto-scroll -->
    <div ref="scrollAnchorRef" class="message-list__anchor" aria-hidden="true"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useI18n } from '@/i18n';
import AiMessage from './AiMessage.vue';
import AiTypingIndicator from './AiTypingIndicator.vue';
import type { Message, ToolCall } from '@/stores/ai';

// Props
interface Props {
  messages: Message[];
  isLoading?: boolean;
  autoScroll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  autoScroll: true,
});

// Emits - used via $emit in template
defineEmits<{
  (e: 'copy-text', message: Message): void;
  (e: 'copy-code', message: Message): void;
  (e: 'regenerate', message: Message): void;
  (e: 'edit', message: Message): void;
  (e: 'delete', message: Message): void;
  (e: 'stop-generation'): void;
  (e: 'approve-diff', toolCall: ToolCall): void;
  (e: 'reject-diff', toolCall: ToolCall): void;
}>();

// i18n
const { t } = useI18n();

// Refs
const containerRef = ref<HTMLElement | null>(null);
const scrollAnchorRef = ref<HTMLElement | null>(null);
const messageRefs = ref<Map<string, HTMLElement>>(new Map());
const focusedIndex = ref(-1);

// Track if user has scrolled away from bottom
const userScrolledAway = ref(false);
const isAutoScrolling = ref(false);

// Group messages by date (Requirement 15.7)
interface MessageGroup {
  date: string;
  label: string;
  messages: Message[];
}

const groupedMessages = computed<MessageGroup[]>(() => {
  if (props.messages.length === 0) return [];
  
  const groups: MessageGroup[] = [];
  let currentDate = '';
  let currentGroup: MessageGroup | null = null;
  
  for (const message of props.messages) {
    const messageDate = getDateString(message.timestamp);
    
    if (messageDate !== currentDate) {
      currentDate = messageDate;
      currentGroup = {
        date: messageDate,
        label: getDateLabel(message.timestamp),
        messages: [],
      };
      groups.push(currentGroup);
    }
    
    currentGroup?.messages.push(message);
  }
  
  return groups;
});

// Total message count for keyboard navigation
const totalMessageCount = computed(() => {
  return groupedMessages.value.reduce((sum, group) => sum + group.messages.length, 0);
});

// Get date string for grouping
function getDateString(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// Get human-readable date label
function getDateLabel(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (messageDay.getTime() === today.getTime()) {
    return t('aiMessageList.today');
  } else if (messageDay.getTime() === yesterday.getTime()) {
    return t('aiMessageList.yesterday');
  } else {
    // Format as locale date
    return date.toLocaleDateString();
  }
}

// Set message ref for keyboard navigation
function setMessageRef(el: any, groupIndex: number, messageIndex: number) {
  if (el) {
    const key = `${groupIndex}-${messageIndex}`;
    messageRefs.value.set(key, el as HTMLElement);
  }
}

// Get flat index for a message
function getFocusIndex(groupIndex: number, messageIndex: number): number {
  let index = 0;
  for (let i = 0; i < groupIndex; i++) {
    index += groupedMessages.value[i].messages.length;
  }
  return index + messageIndex;
}

// Get group and message index from flat index
function getIndicesFromFocusIndex(flatIndex: number): { groupIndex: number; messageIndex: number } | null {
  let remaining = flatIndex;
  for (let groupIndex = 0; groupIndex < groupedMessages.value.length; groupIndex++) {
    const groupSize = groupedMessages.value[groupIndex].messages.length;
    if (remaining < groupSize) {
      return { groupIndex, messageIndex: remaining };
    }
    remaining -= groupSize;
  }
  return null;
}

// Handle message focus
function handleMessageFocus(groupIndex: number, messageIndex: number) {
  focusedIndex.value = getFocusIndex(groupIndex, messageIndex);
}

// Keyboard navigation (Requirement 13.9)
function handleKeyDown(event: KeyboardEvent) {
  if (totalMessageCount.value === 0) return;
  
  switch (event.key) {
    case 'Tab':
      event.preventDefault();
      if (event.shiftKey) {
        // Move to previous message
        focusPreviousMessage();
      } else {
        // Move to next message
        focusNextMessage();
      }
      break;
    case 'ArrowUp':
      event.preventDefault();
      focusPreviousMessage();
      break;
    case 'ArrowDown':
      event.preventDefault();
      focusNextMessage();
      break;
    case 'Home':
      event.preventDefault();
      focusFirstMessage();
      break;
    case 'End':
      event.preventDefault();
      focusLastMessage();
      break;
  }
}

function focusNextMessage() {
  const nextIndex = focusedIndex.value < totalMessageCount.value - 1 
    ? focusedIndex.value + 1 
    : 0; // Wrap to first
  focusMessageAtIndex(nextIndex);
}

function focusPreviousMessage() {
  const prevIndex = focusedIndex.value > 0 
    ? focusedIndex.value - 1 
    : totalMessageCount.value - 1; // Wrap to last
  focusMessageAtIndex(prevIndex);
}

function focusFirstMessage() {
  focusMessageAtIndex(0);
}

function focusLastMessage() {
  focusMessageAtIndex(totalMessageCount.value - 1);
}

function focusMessageAtIndex(index: number) {
  const indices = getIndicesFromFocusIndex(index);
  if (indices) {
    focusedIndex.value = index;
    const key = `${indices.groupIndex}-${indices.messageIndex}`;
    const element = messageRefs.value.get(key);
    if (element) {
      element.focus();
      // Scroll into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

// Auto-scroll to bottom
function scrollToBottom(smooth = true) {
  if (!scrollAnchorRef.value || !props.autoScroll) return;
  
  isAutoScrolling.value = true;
  scrollAnchorRef.value.scrollIntoView({ 
    behavior: smooth ? 'smooth' : 'auto',
    block: 'end' 
  });
  
  // Reset flag after scroll completes
  setTimeout(() => {
    isAutoScrolling.value = false;
  }, 300);
}

// Handle scroll events to detect user scrolling away
function handleScroll() {
  if (isAutoScrolling.value || !containerRef.value) return;
  
  const container = containerRef.value;
  const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
  
  // Consider "at bottom" if within 100px of bottom
  userScrolledAway.value = scrollBottom > 100;
}

// Watch for new messages and auto-scroll
watch(
  () => props.messages.length,
  (newLength, oldLength) => {
    if (newLength > oldLength && !userScrolledAway.value) {
      nextTick(() => {
        scrollToBottom();
      });
    }
  }
);

// Watch for loading state changes
watch(
  () => props.isLoading,
  (isLoading) => {
    if (isLoading && !userScrolledAway.value) {
      nextTick(() => {
        scrollToBottom();
      });
    }
  }
);

// Lifecycle
onMounted(() => {
  if (containerRef.value) {
    containerRef.value.addEventListener('scroll', handleScroll, { passive: true });
  }
  
  // Initial scroll to bottom
  if (props.messages.length > 0) {
    nextTick(() => {
      scrollToBottom(false);
    });
  }
});

onUnmounted(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('scroll', handleScroll);
  }
});

// Expose methods for parent component
defineExpose({
  scrollToBottom,
  focusLastMessage,
});
</script>

<style lang="scss" scoped>
.message-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
  padding: var(--space-4, 16px);
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-height: 0;
  scroll-behavior: smooth;
  
  // Custom scrollbar
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--border, #334155);
    border-radius: 3px;
    
    &:hover {
      background-color: var(--muted-foreground, #64748B);
    }
  }
}

.message-list__date-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3, 12px) 0;
  margin: var(--space-2, 8px) 0;
  
  .date-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--muted-foreground, #64748B);
    background-color: var(--background, #0F172A);
    padding: var(--space-1, 4px) var(--space-3, 12px);
    border-radius: var(--radius-full, 9999px);
    border: 1px solid var(--border, #334155);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.message-list__item {
  outline: none;
  border-radius: var(--radius-lg, 12px);
  transition: box-shadow var(--duration-fast, 150ms) var(--ease-default, ease);
  
  &:focus-visible {
    box-shadow: 0 0 0 2px var(--ring, #3B82F6);
  }
  
  &--focused {
    // Visual indicator for keyboard navigation
  }
}

.message-list__typing {
  padding: var(--space-2, 8px) 0;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-list__anchor {
  height: 1px;
  flex-shrink: 0;
}

// Respect reduced motion preference
@media (prefers-reduced-motion: reduce) {
  .message-list {
    scroll-behavior: auto;
  }
  
  .message-list__typing {
    animation: none;
  }
}

// Light mode adjustments
:root[data-theme="light"] .message-list,
.light .message-list {
  .message-list__date-separator .date-label {
    background-color: var(--background, #F8FAFC);
    border-color: var(--border, #E2E8F0);
  }
}
</style>
