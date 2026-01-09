# MCP Skills Hub

本地优先的技能管理应用，集成 AI 助手。在一个地方管理你的 MCP（模型上下文协议）技能、提示词和工作流。

![技能视图](screenshots/skills-view.png)

## 功能特性

- 📁 **文件浏览器** - 浏览和管理技能文件（Markdown、JSON、YAML）
- ✏️ **内置编辑器** - 编辑技能并实时预览
- 🤖 **AI 助手** - 集成 AI 对话面板，支持代码解释、优化和注释
- 🔧 **MCP 服务器管理** - 配置和管理 MCP 服务器
- 🌙 **深色/浅色主题** - 自动主题切换
- 🌐 **国际化** - 支持中英文

## 截图

### 技能管理
![技能管理](screenshots/skills-view.png)

### AI 助手
![AI 助手](screenshots/ai-assistant.png)

### MCP 服务器配置
![MCP 配置](screenshots/mcp-view.png)

## 快速开始

```bash
# 安装依赖
npm install

# 启动后端服务
cd server && npm install && npm start

# 启动前端（新终端）
npm run dev
```

打开 http://localhost:1420

## 配置说明

### AI 服务商设置

进入设置页面配置 AI 服务商：

- **OpenAI** - API Key + 模型（gpt-4、gpt-3.5-turbo）
- **Anthropic** - API Key + 模型（claude-3-sonnet、claude-3-opus）
- **自定义 API** - OpenAI 兼容接口

### 工作目录

在设置中配置技能工作目录路径，即可开始管理文件。

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **后端**: Node.js + Express
- **UI**: 自定义组件 + SCSS
- **桌面端**: Tauri（可选）

## 许可证

MIT
