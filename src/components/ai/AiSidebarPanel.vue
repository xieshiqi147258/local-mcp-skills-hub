<template>
  <Transition name="slide">
    <aside v-if="isOpen" class="ai-sidebar-panel">
      <AiPanelHeader :show-conversation-list="showConversationList" @close="handleClose" @new-conversation="handleNewConversation" @toggle-conversation-list="toggleConversationList" @go-to-settings="handleGoToSettings" />
      <Transition name="slide-down">
        <div v-if="showConversationList" class="conversation-list-container">
          <AiConversationList @select="handleSelectConversation" @new="handleNewConversation" @delete="handleDeleteConversation" @rename="handleRenameConversation" />
        </div>
      </Transition>
      <div class="panel-body">
        <AiEmptyState v-if="aiStore.messages.length === 0 && !isLoading" @create-skill="handleCreateSkill" @browse-files="handleBrowseFiles" />
        <AiMessageList v-else ref="messageListRef" :messages="aiStore.messages" :is-loading="isLoading" @copy-text="handleCopyText" @copy-code="handleCopyCode" @regenerate="handleRegenerate" @edit="handleEditMessage" @delete="handleDeleteMessage" @stop-generation="handleStopGeneration" @approve-diff="handleApproveDiff" @reject-diff="handleRejectDiff" />
      </div>
      <AiInputArea ref="inputAreaRef" v-model="inputText" :placeholder="inputPlaceholder" :is-loading="isLoading" :disabled="!hasWorkspacePath" @send="handleSendMessage" @edit-last="handleEditLastMessage" @clear="handleClearInput" />
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAiStore, useSettingsStore, useSkillsStore } from '@/stores';
import type { Message, ToolCall, ToolCallStatus } from '@/stores/ai';
import { useI18n } from '@/i18n';
import { useToast } from '@/composables/useToast';
import { 
  chatStreamWithCallbacks, 
  loadAiConfig, 
  getDocsContext, 
  type ChatMessage, 
  type StreamController 
} from '@/utils/ai';

// Child components
import AiPanelHeader from './AiPanelHeader.vue';
import AiConversationList from './AiConversationList.vue';
import AiEmptyState from './AiEmptyState.vue';
import AiMessageList from './AiMessageList.vue';
import AiInputArea from './AiInputArea.vue';

// Props
interface Props {
  isOpen: boolean;
  selectedText?: string | null;
  currentSkillName?: string;
  initialMessage?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  selectedText: null,
  currentSkillName: undefined,
  initialMessage: null
});

// Emits
const emit = defineEmits<{
  (e: 'toggle'): void;
  (e: 'close'): void;
  (e: 'message-sent'): void;
}>();

// Stores and composables
const aiStore = useAiStore();
const settingsStore = useSettingsStore();
const skillsStore = useSkillsStore();
const router = useRouter();
const { t } = useI18n();
const { showToast } = useToast();

// Refs
const messageListRef = ref<InstanceType<typeof AiMessageList> | null>(null);
const inputAreaRef = ref<InstanceType<typeof AiInputArea> | null>(null);
const inputText = ref('');
const isLoading = ref(false);
const showConversationList = ref(false);
const streamController = ref<StreamController | null>(null);
const currentStreamingMessageId = ref<string | null>(null);

// Computed
const hasWorkspacePath = computed(() => !!settingsStore.skillsPath || skillsStore.skillsPath);

const workspacePath = computed(() => skillsStore.skillsPath || settingsStore.skillsPath || '');

const inputPlaceholder = computed(() => {
  if (!hasWorkspacePath.value) {
    return t('ai.configureWorkspacePath');
  }
  return t('ai.inputPlaceholder');
});

// Methods

// Panel controls
function handleClose() {
  emit('close');
}

function toggleConversationList() {
  showConversationList.value = !showConversationList.value;
}

function handleGoToSettings() {
  router.push('/settings');
  emit('close');
}

// Conversation management
function handleNewConversation() {
  aiStore.createConversation();
  showConversationList.value = false;
}

function handleSelectConversation(conversationId: string) {
  aiStore.switchConversation(conversationId);
  showConversationList.value = false;
}

function handleDeleteConversation(conversationId: string) {
  aiStore.deleteConversation(conversationId);
}

function handleRenameConversation(conversationId: string, newTitle: string) {
  aiStore.renameConversation(conversationId, newTitle);
}

// Empty state actions
function handleCreateSkill() {
  inputText.value = 'Help me create a new skill';
  handleSendMessage();
}

function handleBrowseFiles() {
  inputText.value = `List all files in the workspace: ${workspacePath.value}`;
  handleSendMessage();
}

// Message actions
function handleCopyText(message: Message) {
  if (message) {
    navigator.clipboard.writeText(message.content);
    showToast(t('ai.copied'), 'success');
  }
}

function handleCopyCode(message: Message) {
  if (message) {
    // Extract code blocks from content
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeBlocks = message.content.match(codeBlockRegex);
    if (codeBlocks) {
      const code = codeBlocks.map(block => 
        block.replace(/```\w*\n?/g, '').replace(/```$/g, '')
      ).join('\n\n');
      navigator.clipboard.writeText(code);
      showToast(t('ai.codeCopied'), 'success');
    } else {
      showToast(t('ai.noCodeFound'), 'info');
    }
  }
}

function handleRegenerate(message: Message) {
  // Find the user message before this assistant message
  const messageIndex = aiStore.messages.findIndex(m => m.id === message.id);
  if (messageIndex > 0) {
    const userMessage = aiStore.messages[messageIndex - 1];
    if (userMessage.role === 'user') {
      // Remove the assistant message
      aiStore.messages.splice(messageIndex, 1);
      // Resend the user message
      inputText.value = userMessage.content;
      handleSendMessage();
    }
  }
}

function handleEditMessage(message: Message) {
  if (message && message.role === 'user') {
    inputText.value = message.content;
    inputAreaRef.value?.focus();
  }
}

function handleDeleteMessage(message: Message) {
  const index = aiStore.messages.findIndex(m => m.id === message.id);
  if (index !== -1) {
    aiStore.messages.splice(index, 1);
    aiStore.saveCurrentConversationMessages();
  }
}

// Handle diff approval (Requirement 9.4, 9.5)
async function handleApproveDiff(toolCall: ToolCall) {
  if (!toolCall.result?.diff) return;
  
  try {
    // Apply the changes to the file
    const result = await aiStore.executeFileOperation({
      type: 'edit-file',
      path: toolCall.params?.path || '',
      content: toolCall.result.diff.newContent
    });
    
    // Update tool call status
    toolCall.status = result.success ? 'success' : 'error';
    toolCall.result = {
      ...toolCall.result,
      success: result.success,
      message: result.success ? t('aiDiff.changesApplied') : result.error,
      error: result.error
    };
    
    // Notify user
    if (result.success) {
      showToast(t('aiDiff.changesApplied'), 'success');
      // Refresh skills tree
      skillsStore.loadSkills();
      // Highlight the file
      skillsStore.highlightFile(toolCall.params?.path || '');
    } else {
      showToast(result.error || t('common.error'), 'error');
    }
    
    // Save conversation
    aiStore.saveCurrentConversationMessages();
  } catch (error: any) {
    toolCall.status = 'error';
    toolCall.result = {
      ...toolCall.result,
      success: false,
      error: error.message
    };
    showToast(error.message, 'error');
  }
}

// Handle diff rejection (Requirement 9.6)
function handleRejectDiff(toolCall: ToolCall) {
  // Update tool call status to rejected
  toolCall.status = 'rejected';
  toolCall.result = {
    ...toolCall.result,
    success: false,
    message: t('aiDiff.changesRejected')
  };
  
  // Notify user
  showToast(t('aiDiff.changesRejected'), 'info');
  
  // Save conversation
  aiStore.saveCurrentConversationMessages();
}

function handleEditLastMessage() {
  const lastUserMessage = [...aiStore.messages].reverse().find(m => m.role === 'user');
  if (lastUserMessage) {
    inputText.value = lastUserMessage.content;
    inputAreaRef.value?.focus();
  }
}

function handleClearInput() {
  inputText.value = '';
}

// Stop streaming generation (Requirement 8.5)
function handleStopGeneration() {
  if (streamController.value) {
    streamController.value.abort();
    streamController.value = null;
  }
  
  // Mark the current streaming message as complete
  if (currentStreamingMessageId.value) {
    const message = aiStore.messages.find(m => m.id === currentStreamingMessageId.value);
    if (message) {
      message.isStreaming = false;
      if (!message.content) {
        message.content = t('ai.generationStopped');
      }
    }
    currentStreamingMessageId.value = null;
  }
  
  isLoading.value = false;
}

// Main send message handler with streaming support (Requirement 8.1, 8.2, 8.3, 8.4)
async function handleSendMessage() {
  const text = inputText.value.trim();
  if (!text || isLoading.value) return;
  
  // Ensure we have a conversation
  if (!aiStore.currentConversationId) {
    aiStore.createConversation();
  }
  
  // Add user message
  aiStore.addMessage({
    role: 'user',
    content: text
  });
  
  inputText.value = '';
  isLoading.value = true;
  
  await nextTick();
  scrollToBottom();
  
  try {
    // Build system prompt with workspace context
    let systemPrompt = buildSystemPrompt();
    
    // Auto-detect and load relevant docs as context
    const docsContext = await getDocsContext(text);
    if (docsContext) {
      systemPrompt += `\n\nRelevant documentation:\n${docsContext}`;
    }
    
    // Build message history for API
    const chatMessages: ChatMessage[] = aiStore.messages
      .slice(-20) // Keep last 20 messages for context
      .map(m => ({
        role: m.role,
        content: m.content
      }));
    
    // Load AI config
    const config = loadAiConfig();
    if (!config.apiKey && config.provider !== 'ollama') {
      throw new Error(t('ai.apiKeyRequired'));
    }
    
    // Create assistant message placeholder for streaming
    const assistantMessage = aiStore.addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true,
      toolCalls: [],
      segments: [] // Track ordered segments for Kiro-style display
    });
    currentStreamingMessageId.value = assistantMessage.id;
    
    // Track current text segment for accumulating text chunks
    let currentTextSegmentIndex = -1;
    
    // Use streaming API (Requirement 8.1, 8.2)
    streamController.value = chatStreamWithCallbacks(
      chatMessages,
      { ...config, systemPrompt },
      {
        // Handle text chunks - typewriter effect (Requirement 8.3)
        onText: (content: string) => {
          const message = aiStore.messages.find(m => m.id === assistantMessage.id);
          if (message) {
            message.content += content;
            
            // Update segments for Kiro-style display
            if (!message.segments) {
              message.segments = [];
            }
            
            // Check if we need a new text segment or can append to existing
            if (currentTextSegmentIndex === -1 || 
                message.segments.length === 0 || 
                message.segments[message.segments.length - 1].type !== 'text') {
              // Create new text segment
              message.segments.push({ type: 'text', text: content });
              currentTextSegmentIndex = message.segments.length - 1;
            } else {
              // Append to existing text segment
              const lastSegment = message.segments[currentTextSegmentIndex];
              if (lastSegment && lastSegment.type === 'text') {
                lastSegment.text = (lastSegment.text || '') + content;
              }
            }
            
            // Scroll to bottom on each chunk for smooth following
            scrollToBottom();
          }
        },
        
        // Handle tool calls - show card immediately (Requirement 8.4)
        onToolCall: (toolCall) => {
          const message = aiStore.messages.find(m => m.id === assistantMessage.id);
          if (message) {
            if (!message.toolCalls) {
              message.toolCalls = [];
            }
            if (!message.segments) {
              message.segments = [];
            }
            
            // Check if this tool call already exists (update status)
            const existingToolCall = message.toolCalls.find(tc => tc.id === toolCall.id);
            if (existingToolCall) {
              // Update existing tool call status and params
              existingToolCall.status = (toolCall.status as ToolCallStatus) || existingToolCall.status;
              if (toolCall.params && Object.keys(toolCall.params).length > 0) {
                existingToolCall.params = toolCall.params;
              }
            } else {
              // Add new tool call
              message.toolCalls.push({
                id: toolCall.id,
                name: toolCall.name,
                params: toolCall.params,
                status: (toolCall.status as ToolCallStatus) || 'pending'
              });
              
              // Add tool segment to maintain order - this creates interleaved display
              message.segments.push({ type: 'tool', toolCallId: toolCall.id });
              
              // Reset text segment index so next text creates a new segment after this tool
              currentTextSegmentIndex = -1;
            }
            scrollToBottom();
          }
        },
        
        // Handle tool results
        onToolResult: (result) => {
          const message = aiStore.messages.find(m => m.id === assistantMessage.id);
          if (message && message.toolCalls) {
            const toolCall = message.toolCalls.find(tc => tc.id === result.id);
            if (toolCall) {
              toolCall.status = result.success ? 'success' : 'error';
              toolCall.result = {
                success: result.success,
                message: result.message,
                error: result.error,
                data: result.data
              };
              
              // Immediately refresh skills tree after successful file operations
              if (result.success && ['create_file', 'create_folder', 'edit_file', 'delete_file'].includes(toolCall.name)) {
                skillsStore.loadSkills();
                
                // Highlight the file in Skills tree (Requirement 14.7)
                const filePath = toolCall.params?.path || result.data?.path;
                if (filePath) {
                  skillsStore.highlightFile(filePath);
                }
              }
            }
            scrollToBottom();
          }
        },
        
        // Handle completion
        onDone: () => {
          const message = aiStore.messages.find(m => m.id === assistantMessage.id);
          if (message) {
            message.isStreaming = false;
          }
          currentStreamingMessageId.value = null;
          streamController.value = null;
          isLoading.value = false;
          
          // Save conversation
          aiStore.saveCurrentConversationMessages();
          
          // Final refresh of skills tree (in case any operations were missed)
          skillsStore.loadSkills();
        },
        
        // Handle errors (Requirement 8.5)
        onError: (error: string) => {
          const message = aiStore.messages.find(m => m.id === assistantMessage.id);
          if (message) {
            message.isStreaming = false;
            if (!message.content) {
              message.content = `Error: ${error}`;
            } else {
              message.content += `\n\nError: ${error}`;
            }
          }
          currentStreamingMessageId.value = null;
          streamController.value = null;
          isLoading.value = false;
          showToast(error, 'error');
        }
      },
      aiStore.permissions,
      workspacePath.value
    );
    
  } catch (error: any) {
    console.error('AI Error:', error);
    
    // Add error message
    aiStore.addMessage({
      role: 'assistant',
      content: `Error: ${error.message || t('ai.unknownError')}`
    });
    
    isLoading.value = false;
    showToast(error.message || t('ai.unknownError'), 'error');
  }
  
  await nextTick();
  scrollToBottom();
}

// Build system prompt with workspace context (Requirement 17.2)
function buildSystemPrompt(): string {
  let prompt = `You are a file system assistant for managing Skills.

WORKSPACE: ${workspacePath.value}

All file operations MUST be performed within this workspace.
When creating files, use the workspace path as the base directory.

Available tools: create_folder, create_file, edit_file, delete_file, read_file, list_files

IMPORTANT: Always use the tools directly. Never provide bash commands.`;

  // Add current file context if available
  if (skillsStore.selectedSkill) {
    prompt += `\n\nCurrent file context:
File: ${skillsStore.selectedSkill.name}
Type: ${skillsStore.selectedSkill.type}
Path: ${skillsStore.selectedSkill.path}`;
  }

  // Add selected text context if available
  if (props.selectedText) {
    prompt += `\n\nUser has selected the following text:
\`\`\`
${props.selectedText}
\`\`\``;
  }

  return prompt;
}

// Scroll to bottom of message list
function scrollToBottom() {
  nextTick(() => {
    messageListRef.value?.scrollToBottom();
  });
}

// Lifecycle
onMounted(() => {
  // Load conversations from storage
  aiStore.loadConversationsFromStorage();
  
  // Create initial conversation if none exists
  if (aiStore.conversations.length === 0) {
    aiStore.createConversation();
  }
});

onUnmounted(() => {
  // Cleanup: abort any ongoing stream
  if (streamController.value) {
    streamController.value.abort();
  }
  
  // Save current conversation
  aiStore.saveCurrentConversationMessages();
});

// Watch for panel open to focus input
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      inputAreaRef.value?.focus();
    });
  }
});

// Watch for initial message to auto-send
watch(() => props.initialMessage, (message) => {
  if (message && message.trim() && props.isOpen) {
    inputText.value = message;
    nextTick(() => {
      handleSendMessage();
      emit('message-sent');
    });
  }
});
</script>

<style lang="scss" scoped>
.ai-sidebar-panel {
  display: flex;
  flex-direction: column;
  width: 520px;
  min-width: 450px;
  max-width: 700px;
  height: 100%;
  background-color: var(--ai-panel-bg, var(--sidebar));
  border-left: 1px solid var(--ai-panel-border, var(--border));
  flex-shrink: 0;
  
  @media (max-width: 1200px) {
    width: 480px;
    min-width: 400px;
  }
  
  @media (max-width: 1024px) {
    width: 420px;
    min-width: 360px;
  }
  
  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 100%;
    z-index: 100;
  }
}

.conversation-list-container {
  border-bottom: 1px solid var(--border);
  max-height: 300px;
  overflow-y: auto;
}

.panel-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

// Slide transition
.slide-enter-active,
.slide-leave-active {
  transition: width 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  width: 0;
  opacity: 0;
}

// Mobile: use transform for full-screen overlay
@media (max-width: 768px) {
  .slide-enter-active,
  .slide-leave-active {
    transition: transform 0.3s ease;
  }

  .slide-enter-from,
  .slide-leave-to {
    transform: translateX(100%);
    width: 100%;
    opacity: 1;
  }
}

// Slide down transition for conversation list
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 300px;
  transform: translateY(0);
}

// Reduced motion
@media (prefers-reduced-motion: reduce) {
  .slide-enter-active,
  .slide-leave-active,
  .slide-down-enter-active,
  .slide-down-leave-active {
    transition: none;
  }
}
</style>
