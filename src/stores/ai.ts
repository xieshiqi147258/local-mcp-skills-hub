import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { SkillFile } from "./skills";
import { useSkillsStore } from "./skills";

// localStorage keys
export const PERMISSIONS_STORAGE_KEY = "ai_permissions";
export const PANEL_STATE_STORAGE_KEY = "ai_panel_open";
export const CONVERSATIONS_STORAGE_KEY = "ai_conversations";
export const CURRENT_CONVERSATION_STORAGE_KEY = "ai_current_conversation";

// Maximum number of conversations to store (Requirement 12.5)
export const MAX_CONVERSATIONS = 50;

// Interfaces
export interface AiPermissions {
  createFolder: boolean;
  createFile: boolean;
  editFile: boolean;
  deleteFile: boolean;
}

export interface OptionItem {
  id: string;
  label: string;
  description?: string;
}

export interface OptionPrompt {
  id: string;
  category: string;
  question: string;
  options: OptionItem[];
  allowOther: boolean;
}

export type FileOperationType = "create-folder" | "create-file" | "edit-file" | "delete-file";

export interface FileOperation {
  type: FileOperationType;
  path: string;
  content?: string;
  name?: string;
}

export interface FileOperationResult {
  type: FileOperationType;
  success: boolean;
  path: string;
  error?: string;
}

// Tool call status types (Requirement 7.1)
export type ToolCallStatus = "pending" | "approved" | "rejected" | "running" | "success" | "error";

// Diff result for file edits (Requirement 9.1)
export interface DiffResult {
  oldContent: string;
  newContent: string;
  hunks?: DiffHunk[];
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: "add" | "remove" | "context";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

// Tool result interface (Requirement 7.1, 7.3)
export interface ToolResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
  diff?: DiffResult;
}

// Tool call interface (Requirement 7.1)
export interface ToolCall {
  id: string;
  name: string;
  params: Record<string, any>;
  status: ToolCallStatus;
  result?: ToolResult;
}

// File context for messages (Requirement 14.1, 14.2)
export interface FileContext {
  path: string;
  name: string;
  type: string;
  content?: string;
}

// Content segment for interleaved display (Kiro-style)
export interface ContentSegment {
  type: 'text' | 'tool';
  text?: string;
  toolCallId?: string; // Reference to toolCall by id
}

// Extended Message interface (Requirement 12.1)
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  skillContext?: SkillFile;
  options?: OptionPrompt;
  fileOperation?: FileOperationResult;
  // New fields for conversation history support
  toolCalls?: ToolCall[];
  fileContext?: FileContext;
  isStreaming?: boolean;
  // Ordered segments for Kiro-style interleaved display
  segments?: ContentSegment[];
}

// Conversation interface (Requirement 12.1)
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// Default permissions - all disabled for safety (Requirement 2.6)
export const defaultPermissions: AiPermissions = {
  createFolder: false,
  createFile: false,
  editFile: false,
  deleteFile: false,
};

// Helper functions for localStorage operations (exported for testing)
export function savePermissionsToStorage(permissions: AiPermissions): void {
  try {
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(permissions));
  } catch (e) {
    console.error("Failed to save permissions to localStorage:", e);
  }
}

export function readPermissionsFromStorage(): AiPermissions {
  try {
    const stored = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (!stored) return { ...defaultPermissions };
    
    const parsed = JSON.parse(stored);
    // Validate the parsed object has all required properties
    if (
      typeof parsed === "object" &&
      typeof parsed.createFolder === "boolean" &&
      typeof parsed.createFile === "boolean" &&
      typeof parsed.editFile === "boolean" &&
      typeof parsed.deleteFile === "boolean"
    ) {
      return parsed;
    }
    return { ...defaultPermissions };
  } catch (e) {
    console.error("Failed to parse permissions from localStorage:", e);
    return { ...defaultPermissions };
  }
}

export function savePanelStateToStorage(isOpen: boolean): void {
  try {
    localStorage.setItem(PANEL_STATE_STORAGE_KEY, JSON.stringify(isOpen));
  } catch (e) {
    console.error("Failed to save panel state to localStorage:", e);
  }
}

export function readPanelStateFromStorage(): boolean {
  try {
    const stored = localStorage.getItem(PANEL_STATE_STORAGE_KEY);
    if (stored === null) return false;
    return JSON.parse(stored) === true;
  } catch (e) {
    console.error("Failed to parse panel state from localStorage:", e);
    return false;
  }
}

// Conversation localStorage helpers (Requirement 12.1)
export function saveConversationsToStorage(conversations: Conversation[]): void {
  try {
    // Limit to MAX_CONVERSATIONS (Requirement 12.5)
    const limitedConversations = conversations.slice(0, MAX_CONVERSATIONS);
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(limitedConversations));
  } catch (e) {
    console.error("Failed to save conversations to localStorage:", e);
  }
}

export function readConversationsFromStorage(): Conversation[] {
  try {
    const stored = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error("Failed to parse conversations from localStorage:", e);
    return [];
  }
}

export function saveCurrentConversationIdToStorage(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(CURRENT_CONVERSATION_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_CONVERSATION_STORAGE_KEY);
    }
  } catch (e) {
    console.error("Failed to save current conversation ID to localStorage:", e);
  }
}

export function readCurrentConversationIdFromStorage(): string | null {
  try {
    return localStorage.getItem(CURRENT_CONVERSATION_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to read current conversation ID from localStorage:", e);
    return null;
  }
}

// Generate conversation title from first message (Requirement 12.3)
export function generateConversationTitle(firstMessage: string): string {
  // Truncate to first 30 characters and add ellipsis if needed
  const maxLength = 30;
  const cleaned = firstMessage.replace(/\n/g, ' ').trim();
  if (cleaned.length <= maxLength) {
    return cleaned || '新对话';
  }
  return cleaned.substring(0, maxLength) + '...';
}

export const useAiStore = defineStore("ai", () => {
  // State
  const isPanelOpen = ref<boolean>(readPanelStateFromStorage());
  const permissions = ref<AiPermissions>(readPermissionsFromStorage());
  const messages = ref<Message[]>([]);
  const pendingOptions = ref<OptionPrompt | null>(null);
  const selectedText = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Conversation history state (Requirement 12.1)
  const conversations = ref<Conversation[]>(readConversationsFromStorage());
  const currentConversationId = ref<string | null>(readCurrentConversationIdFromStorage());

  // Getters
  const hasAnyPermission = computed(() => {
    return (
      permissions.value.createFolder ||
      permissions.value.createFile ||
      permissions.value.editFile ||
      permissions.value.deleteFile
    );
  });

  const canCreateFolder = computed(() => permissions.value.createFolder);
  const canCreateFile = computed(() => permissions.value.createFile);
  const canEditFile = computed(() => permissions.value.editFile);
  const canDeleteFile = computed(() => permissions.value.deleteFile);
  
  // Current conversation getter (Requirement 12.1)
  const currentConversation = computed(() => {
    if (!currentConversationId.value) return null;
    return conversations.value.find(c => c.id === currentConversationId.value) || null;
  });

  // Actions

  /**
   * Toggle panel open/close state
   * Persists state to localStorage (Requirement 1.6)
   */
  function togglePanel(): void {
    isPanelOpen.value = !isPanelOpen.value;
    savePanelStateToStorage(isPanelOpen.value);
  }

  /**
   * Open the panel
   */
  function openPanel(): void {
    if (!isPanelOpen.value) {
      isPanelOpen.value = true;
      savePanelStateToStorage(true);
    }
  }

  /**
   * Close the panel
   */
  function closePanel(): void {
    if (isPanelOpen.value) {
      isPanelOpen.value = false;
      savePanelStateToStorage(false);
    }
  }

  /**
   * Set panel state directly
   */
  function setPanelOpen(isOpen: boolean): void {
    isPanelOpen.value = isOpen;
    savePanelStateToStorage(isOpen);
  }

  /**
   * Update a single permission
   * Persists to localStorage (Requirement 2.4)
   */
  function setPermission(
    key: keyof AiPermissions,
    value: boolean
  ): void {
    permissions.value[key] = value;
    savePermissionsToStorage(permissions.value);
  }

  /**
   * Update all permissions at once
   * Persists to localStorage (Requirement 2.4)
   */
  function setPermissions(newPermissions: AiPermissions): void {
    permissions.value = { ...newPermissions };
    savePermissionsToStorage(permissions.value);
  }

  /**
   * Reset all permissions to default (all disabled)
   * Persists to localStorage
   */
  function resetPermissions(): void {
    permissions.value = { ...defaultPermissions };
    savePermissionsToStorage(permissions.value);
  }

  /**
   * Load permissions from localStorage (Requirement 2.5)
   */
  function loadPermissionsFromStorage(): void {
    permissions.value = readPermissionsFromStorage();
  }

  /**
   * Load panel state from localStorage (Requirement 1.6)
   */
  function loadPanelStateFromStorage(): void {
    isPanelOpen.value = readPanelStateFromStorage();
  }

  /**
   * Add a new message to the chat
   * Auto-saves to current conversation (Requirement 12.1)
   */
  function addMessage(message: Omit<Message, "id" | "timestamp">): Message {
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    messages.value.push(newMessage);
    
    // Auto-save to current conversation (Requirement 12.1)
    // Use setTimeout to batch multiple rapid message additions
    if (currentConversationId.value) {
      saveCurrentConversationMessages();
    }
    
    return newMessage;
  }

  /**
   * Clear all messages
   * Also clears the current conversation messages (Requirement 12.1)
   */
  function clearMessages(): void {
    messages.value = [];
    
    // Also clear in current conversation
    if (currentConversationId.value) {
      saveCurrentConversationMessages();
    }
  }

  /**
   * Set selected text from editor
   */
  function setSelectedText(text: string | null): void {
    selectedText.value = text;
  }

  /**
   * Set pending options for user selection
   */
  function setPendingOptions(options: OptionPrompt | null): void {
    pendingOptions.value = options;
  }

  /**
   * Check if a specific operation is permitted
   * Returns false if permission is disabled (Requirement 2.3)
   */
  function isOperationPermitted(
    operationType: FileOperationType
  ): boolean {
    switch (operationType) {
      case "create-folder":
        return permissions.value.createFolder;
      case "create-file":
        return permissions.value.createFile;
      case "edit-file":
        return permissions.value.editFile;
      case "delete-file":
        return permissions.value.deleteFile;
      default:
        return false;
    }
  }

  /**
   * Get permission name for display
   */
  function getPermissionName(operationType: FileOperationType): string {
    switch (operationType) {
      case "create-folder":
        return "createFolder";
      case "create-file":
        return "createFile";
      case "edit-file":
        return "editFile";
      case "delete-file":
        return "deleteFile";
      default:
        return operationType;
    }
  }

  /**
   * Execute a file operation with permission check
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.7
   * @param operation The file operation to execute
   * @returns FileOperationResult with success/failure status
   */
  async function executeFileOperation(
    operation: FileOperation
  ): Promise<FileOperationResult> {
    const skillsStore = useSkillsStore();
    
    // Check permission before executing (Requirement 2.3)
    if (!isOperationPermitted(operation.type)) {
      const result: FileOperationResult = {
        type: operation.type,
        success: false,
        path: operation.path,
        error: `Permission denied: ${getPermissionName(operation.type)} is disabled`,
      };
      return result;
    }

    try {
      let resultPath: string = operation.path;

      switch (operation.type) {
        case "create-folder": {
          // Requirement 3.1: Create new folders
          const parentPath = operation.path.substring(0, operation.path.lastIndexOf("/")) || skillsStore.skillsPath;
          const folderName = operation.name || operation.path.split("/").pop() || "new-folder";
          resultPath = await skillsStore.createNewFolder(parentPath, folderName);
          // Note: createNewFolder already calls loadSkills() internally
          break;
        }
        case "create-file": {
          // Requirement 3.2: Create new files with content
          const parentPath = operation.path.substring(0, operation.path.lastIndexOf("/")) || skillsStore.skillsPath;
          const fileName = operation.name || operation.path.split("/").pop() || "new-file.md";
          resultPath = await skillsStore.createNewFile(parentPath, fileName, operation.content || "");
          // Note: createNewFile already calls loadSkills() internally
          break;
        }
        case "edit-file": {
          // Requirement 3.3: Modify existing file content
          const file = skillsStore.files.find((f) => f.path === operation.path);
          if (!file) {
            throw new Error(`File not found: ${operation.path}`);
          }
          await skillsStore.saveSkill(file, operation.content || "");
          // Requirement 3.7: Auto-refresh after file operations
          // saveSkill updates the file in-place, but we reload to ensure consistency
          await skillsStore.loadSkills();
          break;
        }
        case "delete-file": {
          // Requirement 3.4: Delete files and folders
          await skillsStore.deleteItem(operation.path);
          // Note: deleteItem already calls loadSkills() internally
          break;
        }
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      const result: FileOperationResult = {
        type: operation.type,
        success: true,
        path: resultPath,
      };
      return result;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      const result: FileOperationResult = {
        type: operation.type,
        success: false,
        path: operation.path,
        error: errorMessage,
      };
      return result;
    }
  }

  /**
   * Execute file operation and add result message to chat
   * Requirements: 3.5, 3.6
   */
  async function executeFileOperationWithFeedback(
    operation: FileOperation
  ): Promise<FileOperationResult> {
    const result = await executeFileOperation(operation);
    
    // Add message with operation result (Requirements 3.5, 3.6)
    const operationLabels: Record<FileOperationType, string> = {
      "create-folder": "Created folder",
      "create-file": "Created file",
      "edit-file": "Edited file",
      "delete-file": "Deleted",
    };

    const content = result.success
      ? `${operationLabels[result.type]}: ${result.path}`
      : `Failed to ${operation.type.replace("-", " ")}: ${result.error}`;

    addMessage({
      role: "assistant",
      content,
      fileOperation: result,
    });

    return result;
  }

  /**
   * Create a skill type option prompt (Requirement 7.6)
   * Supports multiple option categories for skill creation
   */
  function createSkillTypeOptions(): OptionPrompt {
    return {
      id: `opt_skilltype_${Date.now()}`,
      category: "skillType",
      question: "What type of skill would you like to create?",
      options: [
        { id: "prompt", label: "Prompt Template", description: "A reusable prompt for AI interactions" },
        { id: "workflow", label: "Workflow", description: "A multi-step automation workflow" },
        { id: "tool", label: "Tool Integration", description: "Integration with external tools" },
        { id: "agent", label: "Agent", description: "An autonomous AI agent" },
      ],
      allowOther: true,
    };
  }

  /**
   * Create a target audience option prompt (Requirement 7.6)
   */
  function createTargetAudienceOptions(): OptionPrompt {
    return {
      id: `opt_audience_${Date.now()}`,
      category: "targetAudience",
      question: "Who is the target audience for this skill?",
      options: [
        { id: "developers", label: "Developers", description: "Software engineers and programmers" },
        { id: "designers", label: "Designers", description: "UI/UX and graphic designers" },
        { id: "writers", label: "Writers", description: "Content creators and copywriters" },
        { id: "general", label: "General Users", description: "Anyone who needs AI assistance" },
      ],
      allowOther: true,
    };
  }

  /**
   * Create a complexity level option prompt (Requirement 7.6)
   */
  function createComplexityOptions(): OptionPrompt {
    return {
      id: `opt_complexity_${Date.now()}`,
      category: "complexityLevel",
      question: "What complexity level should this skill have?",
      options: [
        { id: "simple", label: "Simple", description: "Basic functionality, easy to use" },
        { id: "intermediate", label: "Intermediate", description: "Moderate complexity with more features" },
        { id: "advanced", label: "Advanced", description: "Complex functionality for power users" },
      ],
      allowOther: false,
    };
  }

  /**
   * Add a message with option prompt for skill creation (Requirement 7.1)
   */
  function addMessageWithOptions(
    content: string,
    optionPrompt: OptionPrompt
  ): Message {
    return addMessage({
      role: "assistant",
      content,
      options: optionPrompt,
    });
  }

  // ============================================
  // Conversation Management (Requirement 12)
  // ============================================

  /**
   * Create a new conversation (Requirement 12.4)
   */
  function createConversation(): Conversation {
    const now = Date.now();
    const newConversation: Conversation = {
      id: `conv_${now}_${Math.random().toString(36).substr(2, 9)}`,
      title: '新对话',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    
    conversations.value.unshift(newConversation);
    currentConversationId.value = newConversation.id;
    messages.value = [];
    
    // Persist to localStorage
    saveConversationsToStorage(conversations.value);
    saveCurrentConversationIdToStorage(newConversation.id);
    
    return newConversation;
  }

  /**
   * Switch to a different conversation (Requirement 12.4)
   */
  function switchConversation(conversationId: string): void {
    const conversation = conversations.value.find(c => c.id === conversationId);
    if (conversation) {
      // Save current conversation messages first
      saveCurrentConversationMessages();
      
      // Switch to new conversation
      currentConversationId.value = conversationId;
      messages.value = [...conversation.messages];
      
      saveCurrentConversationIdToStorage(conversationId);
    }
  }

  /**
   * Delete a conversation (Requirement 12.4)
   */
  function deleteConversation(conversationId: string): void {
    const index = conversations.value.findIndex(c => c.id === conversationId);
    if (index !== -1) {
      conversations.value.splice(index, 1);
      
      // If deleting current conversation, switch to another or create new
      if (currentConversationId.value === conversationId) {
        if (conversations.value.length > 0) {
          switchConversation(conversations.value[0].id);
        } else {
          currentConversationId.value = null;
          messages.value = [];
          saveCurrentConversationIdToStorage(null);
        }
      }
      
      saveConversationsToStorage(conversations.value);
    }
  }

  /**
   * Rename a conversation (Requirement 12.4)
   */
  function renameConversation(conversationId: string, newTitle: string): void {
    const conversation = conversations.value.find(c => c.id === conversationId);
    if (conversation) {
      conversation.title = newTitle.trim() || '新对话';
      conversation.updatedAt = Date.now();
      saveConversationsToStorage(conversations.value);
    }
  }

  /**
   * Save current conversation messages to the conversations array
   */
  function saveCurrentConversationMessages(): void {
    if (currentConversationId.value) {
      const conversation = conversations.value.find(c => c.id === currentConversationId.value);
      if (conversation) {
        conversation.messages = [...messages.value];
        conversation.updatedAt = Date.now();
        
        // Auto-generate title from first user message if still default (Requirement 12.3)
        if (conversation.title === '新对话' && messages.value.length > 0) {
          const firstUserMessage = messages.value.find(m => m.role === 'user');
          if (firstUserMessage) {
            conversation.title = generateConversationTitle(firstUserMessage.content);
          }
        }
        
        saveConversationsToStorage(conversations.value);
      }
    }
  }

  /**
   * Load conversations from localStorage
   */
  function loadConversationsFromStorage(): void {
    conversations.value = readConversationsFromStorage();
    const savedCurrentId = readCurrentConversationIdFromStorage();
    
    if (savedCurrentId && conversations.value.find(c => c.id === savedCurrentId)) {
      currentConversationId.value = savedCurrentId;
      const currentConv = conversations.value.find(c => c.id === savedCurrentId);
      if (currentConv) {
        messages.value = [...currentConv.messages];
      }
    } else if (conversations.value.length > 0) {
      // Default to first conversation
      currentConversationId.value = conversations.value[0].id;
      messages.value = [...conversations.value[0].messages];
    }
  }

  /**
   * Get conversation count
   */
  function getConversationCount(): number {
    return conversations.value.length;
  }

  return {
    // State
    isPanelOpen,
    permissions,
    messages,
    pendingOptions,
    selectedText,
    loading,
    error,
    // Conversation state
    conversations,
    currentConversationId,
    // Getters
    hasAnyPermission,
    canCreateFolder,
    canCreateFile,
    canEditFile,
    canDeleteFile,
    currentConversation,
    // Actions
    togglePanel,
    openPanel,
    closePanel,
    setPanelOpen,
    setPermission,
    setPermissions,
    resetPermissions,
    loadPermissionsFromStorage,
    loadPanelStateFromStorage,
    addMessage,
    addMessageWithOptions,
    clearMessages,
    setSelectedText,
    setPendingOptions,
    isOperationPermitted,
    getPermissionName,
    executeFileOperation,
    executeFileOperationWithFeedback,
    createSkillTypeOptions,
    createTargetAudienceOptions,
    createComplexityOptions,
    // Conversation actions
    createConversation,
    switchConversation,
    deleteConversation,
    renameConversation,
    saveCurrentConversationMessages,
    loadConversationsFromStorage,
    getConversationCount,
  };
});
