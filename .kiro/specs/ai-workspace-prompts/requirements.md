# Requirements Document

## Introduction

AI 助手需要全面升级，包括：
1. 在正确的工作空间中操作文件（使用用户配置的 Skills 路径）
2. 支持可配置的系统提示词
3. 类似 Roo Code 的工具模式 UI（可视化显示 AI 正在执行的操作）
4. 流式响应支持（对话框和编辑器）
5. 文件编辑使用 Diff 对比视图（逐行显示变更）
6. 美化加载状态和操作确认 UI

## Glossary

- **Skills_Workspace**: 用户在设置中配置的 Skills 文件存储路径
- **MCP_Config_Path**: 用户在设置中配置的 MCP 配置文件路径
- **System_Prompt**: 发送给 AI 的系统级指令，定义 AI 的行为和能力
- **AI_Assistant**: 应用中的 AI 对话助手组件
- **Settings_Store**: 存储用户设置的 Pinia store

## Requirements

### Requirement 1: 工作空间路径注入

**User Story:** As a user, I want the AI assistant to operate within my configured Skills workspace, so that files are created in the correct location.

#### Acceptance Criteria

1. WHEN the AI assistant performs file operations, THE System SHALL use the configured Skills workspace path as the base directory
2. WHEN the Skills workspace path is not configured, THE System SHALL prompt the user to configure it before allowing file operations
3. WHEN the AI assistant receives a file operation request, THE System SHALL inject the workspace path into the system prompt
4. THE System SHALL display the current workspace path in the AI panel header for user awareness

### Requirement 2: 可配置系统提示词

**User Story:** As a user, I want to customize the AI system prompts, so that I can tailor the AI behavior to my specific needs.

#### Acceptance Criteria

1. THE Settings_Store SHALL support storing custom system prompts for different scenarios
2. WHEN a user opens the settings page, THE System SHALL display editable text areas for system prompts
3. WHEN a user saves custom prompts, THE System SHALL persist them to localStorage
4. WHEN custom prompts are not configured, THE System SHALL use default prompts

### Requirement 3: 场景化提示词模板

**User Story:** As a user, I want different AI behaviors for Skills management vs MCP management, so that the AI provides contextually appropriate assistance.

#### Acceptance Criteria

1. THE System SHALL maintain separate prompt templates for Skills management and MCP management scenarios
2. WHEN the user is in the Skills view, THE AI_Assistant SHALL use the Skills-specific prompt template
3. WHEN the user is in the MCP view, THE AI_Assistant SHALL use the MCP-specific prompt template
4. THE System SHALL support template variables like `{{workspace_path}}` and `{{current_file}}` in prompts

### Requirement 4: 默认提示词模板

**User Story:** As a developer, I want sensible default prompts, so that the AI works well out of the box.

#### Acceptance Criteria

1. THE System SHALL provide a default Skills prompt that includes:
   - Workspace path context
   - Available file operation tools
   - Instructions to operate within the workspace
2. THE System SHALL provide a default MCP prompt that includes:
   - MCP configuration context
   - Available MCP management tools
   - Instructions for MCP server configuration
3. WHEN the user resets prompts, THE System SHALL restore the default templates

### Requirement 5: 提示词变量替换

**User Story:** As a user, I want dynamic values in my prompts, so that the AI always has current context.

#### Acceptance Criteria

1. THE System SHALL support the following template variables:
   - `{{skills_workspace}}` - The configured Skills workspace path
   - `{{mcp_config_path}}` - The configured MCP config file path
   - `{{current_file}}` - The currently selected file (if any)
   - `{{current_folder}}` - The currently selected folder (if any)
2. WHEN rendering a prompt, THE System SHALL replace all template variables with their current values
3. IF a variable has no value, THE System SHALL replace it with an empty string or a placeholder message

### Requirement 6: 提示词预览

**User Story:** As a user, I want to preview the final prompt before saving, so that I can verify the template variables work correctly.

#### Acceptance Criteria

1. WHEN editing a prompt template, THE System SHALL show a live preview with variables replaced
2. THE preview SHALL update in real-time as the user types
3. THE System SHALL highlight template variables in the editor for easy identification

### Requirement 7: 工具模式可视化 (类似 Roo Code)

**User Story:** As a user, I want to see what the AI is doing in real-time, so that I understand the operations being performed.

#### Acceptance Criteria

1. WHEN AI calls a tool, THE System SHALL display a tool execution card showing:
   - Tool name with icon (📁 create_folder, 📄 create_file, ✏️ edit_file, 🗑️ delete_file, 📖 read_file, 📋 list_files)
   - Tool parameters (path, name, content preview)
   - Execution status (pending → running → success/error)
   - Expandable details section
2. WHEN tool execution is pending user approval, THE System SHALL show approve/reject buttons
3. WHEN tool execution completes, THE System SHALL show the result with appropriate styling
4. THE tool cards SHALL be collapsible to save space

### Requirement 8: 流式响应支持

**User Story:** As a user, I want to see AI responses as they are generated, so that I don't have to wait for the complete response.

#### Acceptance Criteria

1. THE System SHALL support streaming responses from AI providers (Anthropic, OpenAI, Custom)
2. WHEN streaming, THE System SHALL display text character by character or chunk by chunk
3. THE System SHALL show a typing indicator while streaming
4. WHEN a tool call is detected during streaming, THE System SHALL immediately show the tool card
5. THE System SHALL handle stream interruption gracefully

### Requirement 9: Diff 对比编辑视图

**User Story:** As a user, I want to see exactly what changes the AI is making to my files, so that I can review and approve them.

#### Acceptance Criteria

1. WHEN AI edits a file, THE System SHALL show a side-by-side or inline diff view
2. THE diff view SHALL highlight:
   - Added lines (green background)
   - Removed lines (red background)
   - Modified lines (yellow background)
3. THE System SHALL show line numbers for both old and new content
4. THE user SHALL be able to approve or reject the changes
5. WHEN approved, THE System SHALL apply the changes to the file
6. WHEN rejected, THE System SHALL discard the changes and notify the AI

### Requirement 10: 美化加载和操作 UI

**User Story:** As a user, I want a polished and professional UI for AI interactions, so that the experience feels modern and trustworthy.

#### Acceptance Criteria

1. THE loading state SHALL show:
   - Animated skeleton or pulse effect
   - "AI is thinking..." text with animated dots
   - Cancel button to abort the request
2. THE operation confirmation dialog SHALL show:
   - Clear operation type with icon
   - File path with syntax highlighting
   - Content preview (truncated if too long)
   - Approve (✓) and Reject (✗) buttons with keyboard shortcuts
3. THE success/error states SHALL show:
   - Appropriate color coding (green for success, red for error)
   - Animated checkmark or X icon
   - Brief message describing the result
4. THE System SHALL support dark and light themes for all new UI components

### Requirement 11: 操作权限确认流程

**User Story:** As a user, I want to approve file operations before they execute, so that I maintain control over my file system.

#### Acceptance Criteria

1. WHEN AI requests a file operation, THE System SHALL pause and show a confirmation dialog
2. THE confirmation dialog SHALL clearly show what operation will be performed
3. THE user SHALL be able to:
   - Approve this operation only
   - Approve all operations of this type for this session
   - Reject this operation
   - Reject and stop the AI
4. WHEN user has pre-approved an operation type, THE System SHALL execute without confirmation
5. THE System SHALL log all operations (approved and rejected) for audit

### Requirement 12: 对话历史记录

**User Story:** As a user, I want to save and switch between conversation histories, so that I can continue previous work or reference past conversations.

#### Acceptance Criteria

1. THE System SHALL automatically save conversations to localStorage
2. THE System SHALL display a conversation list in a sidebar or dropdown
3. EACH conversation SHALL show: title (auto-generated from first message), date, message count
4. THE user SHALL be able to:
   - Create new conversation
   - Switch between conversations
   - Delete a conversation
   - Rename a conversation
5. THE System SHALL limit stored conversations (e.g., last 50)

### Requirement 13: 前端交互体验增强

**User Story:** As a user, I want convenient interaction features, so that I can work efficiently with the AI assistant.

#### Acceptance Criteria

**消息操作**
1. EACH message SHALL have a hover toolbar with actions:
   - 📋 Copy text (复制全文)
   - 📄 Copy code blocks only (仅复制代码)
   - 🔄 Regenerate (重新生成，仅 AI 消息)
   - ✏️ Edit & resend (编辑后重发，仅用户消息)
   - 🗑️ Delete message
2. WHEN copying, THE System SHALL show a toast notification "已复制"

**代码块增强**
3. EACH code block SHALL have:
   - Language label (e.g., "javascript", "python")
   - Copy button (一键复制)
   - Line numbers (optional toggle)
   - Syntax highlighting
4. Long code blocks SHALL be collapsible with "Show more/less"

**输入增强**
5. THE input area SHALL support:
   - Ctrl+Enter to send (可配置)
   - Shift+Enter for new line
   - Up arrow to edit last message
   - Esc to clear input
6. THE System SHALL show character/token count

**加载与状态**
7. WHEN AI is responding, THE System SHALL show:
   - Animated typing indicator ("AI 正在思考...")
   - Stop button to cancel generation
8. WHEN request fails, THE System SHALL show:
   - Error message with retry button
   - Option to copy error details

**其他**
9. THE System SHALL support keyboard navigation (Tab between messages)
10. Double-click on message SHALL select all text
11. Right-click context menu with Copy/Delete options


### Requirement 14: 对话框与 Skills 文件联动

**User Story:** As a user, I want the AI panel to be aware of my current context in the Skills editor, so that interactions feel seamless and intelligent.

#### Acceptance Criteria

**场景 1: 选中文件时**
1. WHEN user selects a file in Skills tree, THE AI panel SHALL show context indicator:
   - "当前文件: `skill-name/README.md`"
   - File type icon + truncated path
2. THE user SHALL be able to click the indicator to ask AI about this file
3. Quick actions SHALL appear: "解释这个文件" / "优化这个文件" / "添加注释"

**场景 2: 选中文本时**
4. WHEN user selects text in editor, THE AI panel SHALL show:
   - Selected text preview (truncated, max 3 lines)
   - Quick actions: "解释" / "优化" / "翻译" / "修复"
5. THE selected text SHALL be highlighted in a quote block style

**场景 3: AI 创建/编辑文件后**
6. WHEN AI creates a file, THE System SHALL:
   - Show file card with: icon + filename + "新建" badge
   - "打开文件" button to jump to editor
   - Auto-refresh Skills tree
7. WHEN AI edits a file, THE System SHALL:
   - Show diff preview inline (collapsed by default)
   - "查看完整 Diff" button
   - "在编辑器中打开" button
   - Highlight the file in Skills tree

**场景 4: AI 读取文件时**
8. WHEN AI reads a file, THE System SHALL show:
   - File card with content preview (first 5 lines)
   - "展开全部" to see complete content
   - Syntax highlighting for code files

**场景 5: 空状态引导**
9. WHEN no file is selected AND conversation is empty, THE System SHALL show:
   - Welcome message with usage tips
   - "选择一个文件开始" prompt
   - Quick start buttons: "创建新 Skill" / "浏览现有文件"

### Requirement 15: 内容显示优化

**User Story:** As a user, I want content to be displayed elegantly and readably, so that I can quickly understand information.

#### Acceptance Criteria

**Markdown 渲染**
1. THE System SHALL render Markdown in AI responses:
   - Headers (h1-h6) with proper sizing
   - Bold, italic, strikethrough
   - Lists (ordered and unordered)
   - Links (clickable, open in new tab)
   - Blockquotes with left border style
   - Horizontal rules
   - Tables with proper alignment

**代码显示**
2. Inline code SHALL have:
   - Distinct background color
   - Monospace font
   - Rounded corners
3. Code blocks SHALL have:
   - Language label in top-right corner
   - Dark theme background (even in light mode)
   - Copy button (appears on hover)
   - Line numbers (toggleable)
   - Max height with scroll (300px default)
   - Syntax highlighting by language

**文件路径显示**
4. File paths SHALL be displayed as:
   - Clickable chips/badges
   - Icon based on file type
   - Truncated with ellipsis if too long
   - Tooltip showing full path
   - Click to open in editor

**长内容处理**
5. Long content SHALL be:
   - Collapsed by default (show first N lines)
   - "显示更多" / "收起" toggle
   - Smooth expand/collapse animation

**工具执行结果**
6. Tool results SHALL be displayed as cards:
   - Success: Green left border, ✓ icon
   - Error: Red left border, ✗ icon
   - Compact mode by default
   - Expandable for details

**时间戳**
7. Messages SHALL show:
   - Relative time ("刚刚", "5分钟前", "昨天")
   - Hover to see exact time
   - Group messages by date

**空白与间距**
8. THE layout SHALL have:
   - Consistent spacing between messages
   - Visual separation between user/AI messages
   - Breathing room around content blocks
