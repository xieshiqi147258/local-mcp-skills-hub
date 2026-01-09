# Design Document: AI Sidebar Panel

## Overview

This design transforms the AI assistant from a standalone page into a collapsible sidebar panel integrated with the Skills view. The panel provides file operation capabilities with user-controlled permissions, text selection integration, and option-based AI interactions for skill creation.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App Layout                               │
├──────────┬──────────────────────────────────────┬───────────────┤
│          │                                      │               │
│  Sidebar │         Skills View                  │   AI Panel    │
│   Nav    │  ┌────────────────────────────────┐  │  (Collapsible)│
│          │  │ Header + AI Toggle Button      │  │               │
│          │  ├────────────────────────────────┤  │ ┌───────────┐ │
│          │  │ Skills Browser │ Editor        │  │ │Permissions│ │
│          │  │                │               │  │ ├───────────┤ │
│          │  │                │ [Selection    │  │ │  Chat     │ │
│          │  │                │  Menu]        │  │ │  Area     │ │
│          │  │                │               │  │ │           │ │
│          │  └────────────────────────────────┘  │ │ [Options] │ │
│          │                                      │ ├───────────┤ │
│          │                                      │ │  Input    │ │
└──────────┴──────────────────────────────────────┴─┴───────────┴─┘
```

## Components and Interfaces

### 1. AiSidebarPanel Component

```typescript
// src/components/AiSidebarPanel.vue
interface AiSidebarPanelProps {
  isOpen: boolean;
  selectedText?: string;
  currentSkill?: SkillFile;
}

interface AiSidebarPanelEmits {
  (e: 'toggle'): void;
  (e: 'file-operation', operation: FileOperation): void;
}

interface FileOperation {
  type: 'create-folder' | 'create-file' | 'edit-file' | 'delete-file';
  path: string;
  content?: string;
  name?: string;
}
```

### 2. Permission Control Component

```typescript
// src/components/AiPermissionControl.vue
interface AiPermissions {
  createFolder: boolean;
  createFile: boolean;
  editFile: boolean;
  deleteFile: boolean;
}

const PERMISSIONS_STORAGE_KEY = 'ai_permissions';

// Default all permissions to false for safety
const defaultPermissions: AiPermissions = {
  createFolder: false,
  createFile: false,
  editFile: false,
  deleteFile: false,
};
```

### 3. Text Selection Menu Component

```typescript
// src/components/TextSelectionMenu.vue
interface TextSelectionMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  selectedText: string;
}

interface TextSelectionMenuEmits {
  (e: 'send-to-ai', text: string): void;
  (e: 'close'): void;
}
```

### 4. Option Prompt Component

```typescript
// src/components/AiOptionPrompt.vue
interface OptionPromptProps {
  options: OptionItem[];
  allowOther: boolean;
  category: string;
}

interface OptionItem {
  id: string;
  label: string;
  description?: string;
}

interface OptionPromptEmits {
  (e: 'select', option: OptionItem | string): void;
}
```

### 5. AI Store Updates

```typescript
// src/stores/ai.ts
interface AiState {
  isPanelOpen: boolean;
  permissions: AiPermissions;
  messages: Message[];
  pendingOptions: OptionPrompt | null;
  selectedText: string | null;
}

interface OptionPrompt {
  id: string;
  category: string;
  question: string;
  options: OptionItem[];
  allowOther: boolean;
}
```

## Data Models

### Message with Options

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  skillContext?: SkillFile;
  options?: OptionPrompt;  // For option-based responses
  fileOperation?: FileOperationResult;  // For file operation feedback
}

interface FileOperationResult {
  type: FileOperation['type'];
  success: boolean;
  path: string;
  error?: string;
}
```

### Permission Persistence

```typescript
// localStorage key: 'ai_permissions'
// Format: JSON string of AiPermissions object
{
  "createFolder": false,
  "createFile": false,
  "editFile": false,
  "deleteFile": false
}

// localStorage key: 'ai_panel_open'
// Format: "true" | "false"
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Panel Toggle Round-Trip

*For any* initial panel state (open or closed), clicking the toggle button twice SHALL return the panel to its original state.

**Validates: Requirements 1.1, 1.3, 4.3**

### Property 2: Panel State Persistence Round-Trip

*For any* panel open/closed state, saving to localStorage and then loading SHALL restore the exact same state.

**Validates: Requirements 1.6**

### Property 3: Permission Persistence Round-Trip

*For any* combination of permission settings, saving to localStorage and then loading SHALL restore the exact same permission configuration.

**Validates: Requirements 2.4, 2.5**

### Property 4: Permission-Gated Operations

*For any* file operation type, IF the corresponding permission is disabled, THEN the operation SHALL be blocked and not executed.

**Validates: Requirements 2.3, 3.1, 3.2, 3.3, 3.4**

### Property 5: Toggle Button Visual State Consistency

*For any* panel state, the toggle button's visual indicator SHALL accurately reflect whether the panel is open or closed.

**Validates: Requirements 4.4**

### Property 6: Text Selection Menu Visibility

*For any* text selection in the editor, the selection menu SHALL appear when text is selected and disappear when text is deselected or user clicks elsewhere.

**Validates: Requirements 6.1, 6.6**

### Property 7: Send to AI Opens Panel

*For any* "Send to AI" action, IF the panel is closed, THEN it SHALL be opened, AND the selected text SHALL be received by the panel.

**Validates: Requirements 6.3, 6.4**

### Property 8: Option Selection Flow

*For any* option prompt, selecting an option (including "Other" with custom text) SHALL continue the conversation with that selection.

**Validates: Requirements 7.4, 7.5**

### Property 9: File Operation Triggers Refresh

*For any* successful file operation (create/edit/delete), the Skills view SHALL refresh to reflect the changes.

**Validates: Requirements 3.7**

## Error Handling

1. **Permission Denied**: When AI attempts an operation without permission, display a clear message explaining which permission is needed.

2. **File Operation Failure**: Display error toast with specific error message (e.g., "File already exists", "Path not found").

3. **AI API Failure**: Show error in chat with retry option, don't lose user's input.

4. **localStorage Unavailable**: Fall back to in-memory state, warn user that preferences won't persist.

## Testing Strategy

### Unit Tests

- Test permission toggle state changes
- Test localStorage save/load functions
- Test option selection handlers
- Test text selection detection

### Property-Based Tests

Using Vitest with fast-check for property-based testing:

1. **Panel Toggle Round-Trip**: Generate random sequences of toggle actions, verify final state matches expected.

2. **Permission Persistence**: Generate random permission configurations, verify round-trip through localStorage.

3. **Permission-Gated Operations**: Generate random operations with random permission states, verify blocking behavior.

4. **Option Selection**: Generate random option selections, verify conversation continues correctly.

### Integration Tests

- Test AI panel integration with Skills view
- Test file operations through AI commands
- Test text selection menu positioning and behavior
