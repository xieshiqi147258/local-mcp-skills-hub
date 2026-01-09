# Requirements Document

## Introduction

优化技能库（Skills View）的显示逻辑和交互逻辑，使其与MCP配置页面风格保持一致，简化界面结构，移除冗余功能，并确保设置中的路径配置能正确生效。

## Glossary

- **Skills_View**: 技能库视图组件，用于浏览和编辑技能文件
- **Settings_View**: 设置视图组件，包含技能路径配置
- **Skills_Store**: 技能状态管理，存储技能路径和文件列表
- **Skill_File**: 技能文件，包括 .md、.json、.yaml 格式
- **Skill_Folder**: 技能文件夹，包含多个技能文件

## Requirements

### Requirement 1: 路径配置同步

**User Story:** As a user, I want the skills path configured in Settings to be automatically applied to Skills View, so that I don't need to configure it twice.

#### Acceptance Criteria

1. WHEN a user saves skills paths in Settings_View, THE Skills_Store SHALL persist the paths to localStorage
2. WHEN Skills_View loads, THE Skills_Store SHALL read paths from localStorage and load skills automatically
3. WHEN no skills path is configured, THE Skills_View SHALL display an empty state with a link to Settings
4. IF skills path is invalid or inaccessible, THEN THE Skills_View SHALL display an error message with retry option

### Requirement 2: 移除冗余的文件夹选择功能

**User Story:** As a user, I want a cleaner Skills View without duplicate folder selection functionality, so that the interface is less confusing.

#### Acceptance Criteria

1. THE Skills_View SHALL NOT display a folder browser dialog
2. THE Skills_View SHALL NOT display a "select folder" button in the header
3. WHEN no skills path is configured, THE Skills_View SHALL display a button that navigates to Settings
4. THE Skills_View header SHALL only contain the title and a "new skill" button

### Requirement 3: 简化顶部区域

**User Story:** As a user, I want a simplified header without unnecessary elements, so that I can focus on the skill content.

#### Acceptance Criteria

1. THE Skills_View header SHALL NOT display "技能浏览器" subtitle
2. THE Skills_View header SHALL NOT display a search input in the header area
3. THE Skills_View header SHALL display only the page title and action buttons
4. THE Skills_View header style SHALL match the MCP_View header style

### Requirement 4: 目录列表样式优化

**User Story:** As a user, I want the skills list to have a cleaner, more consistent style similar to MCP cards, so that the interface looks professional.

#### Acceptance Criteria

1. THE Skills_View SHALL display skill folders as expandable list items with consistent styling
2. WHEN a folder is expanded, THE Skills_View SHALL display skill files with proper indentation
3. THE skill list items SHALL have hover states with subtle background color change
4. THE skill list items SHALL have cursor pointer on hover
5. THE active skill item SHALL have a distinct visual indicator matching the primary color theme

### Requirement 5: 合并重复的新建功能

**User Story:** As a user, I want only one way to create new skills, so that the interface is not confusing.

#### Acceptance Criteria

1. THE Skills_View SHALL have only ONE "new skill" button in the header
2. THE Skills_View empty state SHALL NOT display a separate "create skill" button
3. WHEN the "new skill" button is clicked, THE Skills_View SHALL show a create dialog

### Requirement 6: 编辑器区域保持不变

**User Story:** As a user, I want the skill editor to remain functional, so that I can continue editing skills.

#### Acceptance Criteria

1. THE Skills_View editor panel SHALL remain on the right side
2. WHEN a skill is selected, THE editor SHALL display the skill content
3. THE editor SHALL support edit and preview tabs
4. THE editor SHALL support save and delete actions

### Requirement 7: 响应式布局

**User Story:** As a user, I want the Skills View to work well on different screen sizes, so that I can use it comfortably.

#### Acceptance Criteria

1. THE Skills_View SHALL use a two-column layout with resizable panels
2. THE left panel (skill list) SHALL have a minimum width of 240px
3. THE right panel (editor) SHALL take the remaining space
4. WHEN the window is narrow, THE Skills_View SHALL maintain usability
