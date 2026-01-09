<div align="center">
  <img src="public/屏幕截图 2026-01-09 141551.png" alt="MCP Skills Hub" width="800"/>
  
  # 🛠️ MCP Skills Hub
  
  **本地优先的 AI 工作空间 — Skills & MCP 管理中心**
  
  通过集成 AI 助手，构建、管理和优化你的 AI 技能和 MCP 服务器 — 一切都在本地运行。

  [English](./README.md) | 中文

  ![License](https://img.shields.io/badge/license-MIT-blue.svg)
  ![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
  ![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
</div>

---

## ✨ 为什么选择 MCP Skills Hub？

| 痛点 | 我们的解决方案 |
|------|---------------|
| Skills 散落在各个文件夹 | 📁 集中式文件浏览器，树形视图一目了然 |
| 手动编辑技能文件很繁琐 | 🤖 AI 驱动的生成、优化和注释功能 |
| MCP 配置难以管理 | 🔧 可视化 MCP 服务器配置 |
| 云端 API = 隐私担忧 | 🔒 100% 本地优先，数据完全属于你 |
| 没有统一的工作空间 | 🏠 一个应用管理 Skills、Prompts 和 MCP |

---

## 🌟 核心功能

### 🤖 AI 驱动的技能开发
- **生成 Skills** — 描述你的需求，AI 自动创建技能文件
- **解释代码** — 一键让 AI 分析解释文件内容
- **优化重构** — AI 为你的技能提供改进建议
- **添加注释** — 自动生成代码文档和注释

### 📁 本地 Skills 管理
- 浏览和组织技能文件（Markdown、JSON、YAML）
- 内置编辑器，支持 Markdown 实时预览
- 文件夹树形结构，支持拖拽操作
- 快速搜索和文件操作

### 🔧 MCP 服务器中心
- 可视化配置 MCP 服务器
- 集中管理所有 MCP 工具
- 轻松启用/禁用和参数编辑

### 🔒 隐私优先
- **100% 本地** — 无云端依赖，数据不上传
- **自带 API** — 支持 OpenAI、Anthropic、Ollama 或任何兼容接口
- **离线可用** — 配合本地模型无需联网

---

## 📸 界面截图

<div align="center">
  <img src="public/屏幕截图 2026-01-09 141630.png" alt="编辑器视图" width="45%"/>
  <img src="public/屏幕截图 2026-01-09 141803.png" alt="AI 助手" width="45%"/>
</div>

<div align="center">
  <img src="public/屏幕截图 2026-01-09 142125.png" alt="MCP 配置" width="45%"/>
  <img src="public/屏幕截图 2026-01-09 142315.png" alt="设置页面" width="45%"/>
</div>

---

## 🚀 快速开始

```bash
# 克隆仓库
git clone https://github.com/xieshiqi147258/local-mcp-skills-hub.git
cd local-mcp-skills-hub

# 安装依赖
npm install

# 启动后端服务
cd server && npm install && npm start

# 启动前端（新终端）
cd .. && npm run dev
```

在浏览器中打开 **http://localhost:1420**

---

## ⚙️ 配置说明

### AI 服务商设置

进入 **设置** 页面配置你的 AI 服务商：

| 服务商 | 配置项 |
|--------|--------|
| OpenAI | API Key + 模型 (gpt-4o, gpt-4-turbo) |
| Anthropic | API Key + 模型 (claude-3.5-sonnet, claude-3-opus) |
| 自定义 API | 任何 OpenAI 兼容接口 |
| Ollama | 本地模型 (llama3, mistral 等) |

### 工作目录

在设置中配置你的 Skills 工作目录路径，即可开始管理文件。

---

## 📍 开发路线图

### 🎯 进行中
- [ ] AI 对话中执行 MCP 工具
- [ ] AI 编辑的文件差异预览
- [ ] 对话历史持久化

### 🔮 计划中
- [ ] **MCP 市场** — 浏览和安装社区 MCP 服务器
- [ ] **版本控制** — Git 集成，技能版本管理
- [ ] **技能模板** — 常用场景的快速启动模板
- [ ] **多工作空间** — 管理多个技能目录
- [ ] **导入/导出** — 将技能打包分享
- [ ] **Tauri 桌面应用** — 原生应用，更好的性能

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + TypeScript + Vite |
| 后端 | Node.js + Express |
| 样式 | SCSS + CSS Variables |
| 状态管理 | Pinia |
| 国际化 | Vue I18n (中/英) |

---

## 🤝 参与贡献

欢迎贡献代码！你可以：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 🔧 提交 Pull Request

---

## 📜 开源协议

[MIT License](./LICENSE) — 自由使用，构建精彩！

---

<div align="center">
  <sub>为 AI 开发者社区用 ❤️ 构建</sub>
</div>
