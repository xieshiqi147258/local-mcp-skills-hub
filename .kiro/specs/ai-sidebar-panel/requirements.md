# Requirements Document

## Introduction

将 AI 助手从独立页面改为可展开/收起的侧边栏面板，集成到技能库页面中，并提供文件操作权限控制功能。AI 助手可以在用户授权的情况下执行创建文件夹、创建文件、编辑文件、删除文件等操作。支持从编辑器选中文本发送到 AI 进行优化，以及通过选项式交互引导用户创建 Skills。

## Glossary

- **AI_Panel**: 可展开/收起的 AI 助手侧边栏面板
- **Skills_View**: 技能库主视图
- **Permission_Control**: AI 助手的文件操作权限控制系统
- **File_Operations**: 包括创建文件夹、创建文件、编辑文件、删除文件的操作
- **Text_Selection_Menu**: 编辑器中选中文本后弹出的快捷菜单
- **Option_Prompt**: AI 交互中提供选项让用户选择的提示方式

## Requirements

### Requirement 1: AI 侧边栏面板

**User Story:** As a user, I want the AI assistant to be accessible as a collapsible sidebar panel, so that I can use it while working in the Skills view without navigating away.

#### Acceptance Criteria

1. WHEN the user clicks the AI toggle button, THE AI_Panel SHALL expand from the right side of the screen
2. WHEN the AI_Panel is expanded, THE AI_Panel SHALL display the chat interface with message history
3. WHEN the user clicks the AI toggle button again, THE AI_Panel SHALL collapse and hide
4. WHILE the AI_Panel is collapsed, THE Skills_View SHALL occupy the full available width
5. WHILE the AI_Panel is expanded, THE Skills_View SHALL resize to accommodate the panel
6. THE AI_Panel SHALL persist its expanded/collapsed state across page navigation

### Requirement 2: 权限控制界面

**User Story:** As a user, I want to control what file operations the AI assistant can perform, so that I can maintain control over my files.

#### Acceptance Criteria

1. THE Permission_Control SHALL display at the top of the AI_Panel above the chat area
2. THE Permission_Control SHALL provide toggles for: create folder, create file, edit file, delete file
3. WHEN a permission toggle is disabled, THE AI_Panel SHALL NOT execute that type of operation
4. THE Permission_Control SHALL persist user preferences to localStorage
5. WHEN the AI_Panel loads, THE Permission_Control SHALL restore previously saved preferences
6. THE Permission_Control SHALL default all permissions to disabled for safety

### Requirement 3: AI 文件操作能力

**User Story:** As a user, I want the AI assistant to help me manage files in the Skills library, so that I can work more efficiently.

#### Acceptance Criteria

1. WHERE create folder permission is enabled, THE AI_Panel SHALL be able to create new folders in the skills directory
2. WHERE create file permission is enabled, THE AI_Panel SHALL be able to create new files with specified content
3. WHERE edit file permission is enabled, THE AI_Panel SHALL be able to modify existing file content
4. WHERE delete file permission is enabled, THE AI_Panel SHALL be able to delete files and folders
5. WHEN the AI executes a file operation, THE AI_Panel SHALL display a notification of the action taken
6. WHEN a file operation fails, THE AI_Panel SHALL display an error message to the user
7. WHEN the AI modifies files, THE Skills_View SHALL automatically refresh to show changes

### Requirement 4: 导航更新

**User Story:** As a user, I want the navigation to reflect the new AI panel location, so that the interface is intuitive.

#### Acceptance Criteria

1. THE Sidebar navigation SHALL remove the standalone AI page link
2. THE Skills_View header SHALL include an AI toggle button
3. WHEN the AI toggle button is clicked, THE AI_Panel SHALL toggle its visibility
4. THE AI toggle button SHALL indicate the current state (expanded/collapsed) visually

### Requirement 5: 响应式布局

**User Story:** As a user, I want the AI panel to work well on different screen sizes, so that I can use it on various devices.

#### Acceptance Criteria

1. WHILE the screen width is below 768px, THE AI_Panel SHALL overlay the content instead of pushing it
2. WHILE the screen width is 768px or above, THE AI_Panel SHALL push the content to make room
3. THE AI_Panel SHALL have a minimum width of 320px
4. THE AI_Panel SHALL have a maximum width of 480px

### Requirement 6: 编辑器文本选择菜单

**User Story:** As a user, I want to select text in the editor and send it to the AI assistant for optimization, so that I can quickly improve specific content.

#### Acceptance Criteria

1. WHEN the user selects text in the editor, THE Text_Selection_Menu SHALL appear near the selection
2. THE Text_Selection_Menu SHALL display a "Send to AI" button
3. WHEN the user clicks "Send to AI", THE AI_Panel SHALL open if not already open
4. WHEN the user clicks "Send to AI", THE AI_Panel SHALL receive the selected text as context
5. THE AI_Panel SHALL display a prompt asking how to process the selected text
6. THE Text_Selection_Menu SHALL disappear when the user clicks elsewhere or deselects text

### Requirement 7: 选项式 AI 交互

**User Story:** As a user, I want the AI to provide options during skill creation, so that I can make choices without typing everything manually.

#### Acceptance Criteria

1. WHEN creating a new skill, THE AI_Panel SHALL provide predefined options for common choices
2. THE Option_Prompt SHALL display clickable option buttons for user selection
3. THE Option_Prompt SHALL include an "Other" option that allows custom text input
4. WHEN the user selects an option, THE AI_Panel SHALL use that selection to continue the conversation
5. WHEN the user selects "Other", THE AI_Panel SHALL display a text input for custom response
6. THE Option_Prompt SHALL support multiple option categories (e.g., skill type, target audience, complexity level)
