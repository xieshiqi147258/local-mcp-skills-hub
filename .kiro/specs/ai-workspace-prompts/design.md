# Design Document

## Overview

全面升级 AI 助手，实现类似 Roo Code 的工具模式体验，包括：
- 工作空间路径注入和可配置提示词
- 流式响应和工具执行可视化
- Diff 对比编辑和操作确认
- 对话历史记录
- 前端交互体验增强
- 对话框与 Skills 文件联动
- 内容显示优化

## Architecture

### 组件结构

```
AiSidebarPanel.vue (主面板)
├── AiPanelHeader.vue (头部：工作空间路径 + 对话切换)
├── AiContextIndicator.vue (上下文指示器：当前文件/选中文本)
├── AiMessageList.vue (消息列表)
│   ├── AiMessage.vue (单条消息)
│   │   ├── AiMessageActions.vue (消息操作工具栏)
│   │   ├── AiToolCard.vue (工具执行卡片)
│   │   ├── AiDiffView.vue (Diff 对比视图)
│   │   ├── AiFileCard.vue (文件卡片)
│   │   └── AiCodeBlock.vue (代码块)
│   └── AiTypingIndicator.vue (打字指示器)
├── AiEmptyState.vue (空状态引导)
├── AiConversationList.vue (对话历史列表)
└── AiInputArea.vue (输入区域)
```

### 数据流

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────────────────────────────────────────────────────┤
│  Settings Store          AI Store           Skills Store    │
│  ├─ skillsPath          ├─ conversations   ├─ currentFile   │
│  ├─ mcpConfigPath       ├─ currentConvId   ├─ selectedText  │
│  └─ systemPrompts       ├─ messages        └─ files[]       │
│                         └─ loading                           │
├─────────────────────────────────────────────────────────────┤
│                    AiSidebarPanel.vue                        │
│  1. 读取 skillsPath 作为 workspacePath                       │
│  2. 替换提示词模板变量                                        │
│  3. 发送请求到后端（含 workspacePath）                        │
│  4. 处理流式响应，渲染工具卡片                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
├─────────────────────────────────────────────────────────────┤
│  POST /api/ai/chat/stream                                    │
│  ├─ 接收 workspacePath                                       │
│  ├─ 流式调用 AI Provider                                     │
│  ├─ 检测 tool_call → 发送 SSE 事件                           │
│  └─ executeToolCall(使用 workspacePath 作为基础路径)         │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### Conversation (对话)

```typescript
interface Conversation {
  id: string;
  title: string;           // 自动从首条消息生成
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}
```

### Message (消息) - 扩展

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  // 新增字段
  toolCalls?: ToolCall[];      // 工具调用
  fileContext?: FileContext;   // 文件上下文
  isStreaming?: boolean;       // 是否正在流式输出
}

interface ToolCall {
  id: string;
  name: string;
  params: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'running' | 'success' | 'error';
  result?: ToolResult;
}

interface ToolResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;              // 如 read_file 的内容
  diff?: DiffResult;       // 如 edit_file 的变更
}

interface FileContext {
  path: string;
  name: string;
  type: string;
  content?: string;        // 预览内容
}
```

### SystemPrompts (系统提示词)

```typescript
interface SystemPrompts {
  skills: string;          // Skills 场景提示词
  mcp: string;             // MCP 场景提示词
}

// 默认提示词
const DEFAULT_PROMPTS: SystemPrompts = {
  skills: `You are a file system assistant for managing Skills.

WORKSPACE: {{skills_workspace}}

All file operations MUST be performed within this workspace.
When creating files, use the workspace path as the base directory.

Available tools: create_folder, create_file, edit_file, delete_file, read_file, list_files

IMPORTANT: Always use the tools directly. Never provide bash commands.`,

  mcp: `You are an MCP configuration assistant.

MCP Config Path: {{mcp_config_path}}

Help users manage their MCP server configurations.`
};
```

## Component Designs

### 1. AiToolCard.vue (工具执行卡片)

显示 AI 正在执行的操作，类似 Roo Code 风格。

```
┌─────────────────────────────────────────┐
│ 📄 create_file                  ⏳ 执行中 │
├─────────────────────────────────────────┤
│ path: /skills/my-skill/                 │
│ name: README.md                         │
│ content: # My Skill...                  │
├─────────────────────────────────────────┤
│ [✓ 允许]  [✗ 拒绝]  [▼ 详情]            │
└─────────────────────────────────────────┘
```

### 2. AiDiffView.vue (Diff 对比视图)

文件编辑的逐行对比。

```
┌─────────────────────────────────────────┐
│ ✏️ edit_file: README.md                  │
├─────────────────────────────────────────┤
│  1  │ # My Skill                        │
│ -2  │ Old description                   │
│ +2  │ New improved description          │
│  3  │                                   │
├─────────────────────────────────────────┤
│ [✓ 应用更改]  [✗ 放弃]                   │
└─────────────────────────────────────────┘
```

### 3. AiMessageActions.vue (消息操作工具栏)

悬停时显示的操作按钮。

```
┌─────────────────────────────────────────┐
│ 📋 复制  📄 复制代码  🔄 重新生成  🗑️ 删除 │
└─────────────────────────────────────────┘
```

### 4. AiContextIndicator.vue (上下文指示器)

显示当前选中的文件或文本。

```
┌─────────────────────────────────────────┐
│ 📄 当前文件: my-skill/README.md          │
│ [解释] [优化] [添加注释]                  │
└─────────────────────────────────────────┘
```

### 5. AiConversationList.vue (对话历史)

```
┌─────────────────────────────────────────┐
│ 📝 对话历史                    [+ 新建]  │
├─────────────────────────────────────────┤
│ ● 创建 API 文档 Skill          今天      │
│   修改 MCP 配置                 昨天      │
│   调试文件读取问题              3天前     │
└─────────────────────────────────────────┘
```

### 6. AiCodeBlock.vue (代码块)

```
┌─────────────────────────────────────────┐
│ javascript                        [📋]  │
├─────────────────────────────────────────┤
│ 1 │ function hello() {                  │
│ 2 │   console.log('Hello');             │
│ 3 │ }                                   │
└─────────────────────────────────────────┘
```

## API Changes

### 新增 SSE 端点

```javascript
// POST /api/ai/chat/stream
// Request Body 同 /api/ai/chat，新增 workspacePath
{
  messages: [...],
  options: { provider, model, apiKey, systemPrompt },
  permissions: {...},
  workspacePath: "/path/to/skills"  // 新增
}

// SSE Events
event: text
data: {"content": "Hello..."}

event: tool_call
data: {"id": "tc_1", "name": "create_file", "params": {...}}

event: tool_result
data: {"id": "tc_1", "success": true, "message": "File created"}

event: done
data: {}

event: error
data: {"message": "Error details"}
```

### 修改 executeToolCall

```javascript
async function executeToolCall(toolName, toolInput, workspacePath) {
  // 如果 path 是相对路径或 "."，则拼接 workspacePath
  if (toolInput.path === '.' || !path.isAbsolute(toolInput.path)) {
    toolInput.path = path.join(workspacePath, toolInput.path);
  }
  // ... 执行工具
}
```

## UI/UX 设计

### 设计风格 (基于 UI Pro Max)

**产品类型**: Developer Tool / IDE + SaaS
**主要风格**: Dark Mode (OLED) + Minimalism
**次要风格**: Flat Design, Micro-interactions

### 字体方案

使用 **Developer Mono** 字体组合：
- **标题/UI**: IBM Plex Sans (清晰、专业)
- **代码**: JetBrains Mono (开发者友好)

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

fontFamily: {
  mono: ['JetBrains Mono', 'monospace'],
  sans: ['IBM Plex Sans', 'sans-serif']
}
```

### 颜色方案

**Dark Mode (主要)**:
```scss
// 基础色
--background: #0F172A;      // 深色背景
--foreground: #F1F5F9;      // 浅色文字
--card: #1E293B;            // 卡片背景
--border: #334155;          // 边框

// 主色调
--primary: #3B82F6;         // 蓝色主色
--primary-hover: #2563EB;   // 蓝色悬停
--cta: #2563EB;             // CTA 按钮

// 工具状态
--tool-pending: #64748B;    // 等待中 (slate-500)
--tool-approved: #3B82F6;   // 已批准 (blue-500)
--tool-running: #3B82F6;    // 执行中 (blue-500)
--tool-success: #22C55E;    // 成功 (green-500)
--tool-error: #EF4444;      // 错误 (red-500)
--tool-rejected: #64748B;   // 已拒绝 (slate-500)

// Diff 颜色
--diff-add-bg: rgba(34, 197, 94, 0.15);
--diff-add-text: #22C55E;
--diff-add-border: #22C55E;
--diff-remove-bg: rgba(239, 68, 68, 0.15);
--diff-remove-text: #EF4444;
--diff-remove-border: #EF4444;

// 消息
--msg-user-bg: #3B82F6;
--msg-assistant-bg: #1E293B;
```

**Light Mode**:
```scss
--background: #F8FAFC;
--foreground: #1E293B;
--card: #FFFFFF;
--border: #E2E8F0;
--primary: #2563EB;
```

### 动画规范

遵循 UX 最佳实践：
- 使用 `ease-out` 进入动画，`ease-in` 退出动画
- 避免 `linear` 过渡（感觉机械）
- 尊重 `prefers-reduced-motion` 设置
- 仅在加载指示器使用持续动画

```scss
// 打字指示器 (仅用于加载)
@keyframes typing-dots {
  0%, 20% { opacity: 0.3; }
  50% { opacity: 1; }
  80%, 100% { opacity: 0.3; }
}

// 工具卡片展开 (ease-out)
.tool-body-enter-active {
  animation: slideDown 0.2s ease-out;
}

// 成功/失败图标
@keyframes checkmark {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

// 尊重用户动画偏好
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 交互规范

| 规则 | 正确做法 | 错误做法 |
|------|----------|----------|
| 图标 | 使用 SVG 图标 (Heroicons/Lucide) | 使用 emoji 作为 UI 图标 |
| 悬停 | 颜色/透明度过渡 | scale 变换导致布局偏移 |
| 光标 | 可点击元素添加 `cursor-pointer` | 交互元素使用默认光标 |
| 过渡 | `transition-colors duration-200` | 无过渡或过慢 (>500ms) |
| 对比度 | 文字对比度 ≥ 4.5:1 | 低对比度文字 |

### 无障碍要求

- 所有图片需要 `alt` 文本
- 错误消息使用 `role="alert"` 或 `aria-live`
- 不仅依赖颜色传达信息
- 键盘可导航 (Tab/Enter/Esc)
- 焦点状态清晰可见

## 依赖库

- `marked` - Markdown 渲染
- `highlight.js` - 代码语法高亮
- `diff` - 文本差异计算
- `dayjs` - 相对时间显示
