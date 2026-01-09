# MCP Skills Hub

A local-first skill management application with AI assistant integration. Manage your MCP (Model Context Protocol) skills, prompts, and workflows in one place.

![Skills View](screenshots/skills-view.png)

## Features

- 📁 **File Browser** - Browse and manage skill files (Markdown, JSON, YAML)
- ✏️ **Built-in Editor** - Edit skills with live preview
- 🤖 **AI Assistant** - Integrated AI chat panel for code explanation, optimization, and commenting
- 🔧 **MCP Server Management** - Configure and manage MCP servers
- 🌙 **Dark/Light Theme** - Automatic theme switching
- 🌐 **i18n Support** - English and Chinese

## Screenshots

### Skills Management
![Skills Management](screenshots/skills-view.png)

### AI Assistant
![AI Assistant](screenshots/ai-assistant.png)

### MCP Server Config
![MCP Config](screenshots/mcp-view.png)

## Quick Start

```bash
# Install dependencies
npm install

# Start backend server
cd server && npm install && npm start

# Start frontend (new terminal)
npm run dev
```

Open http://localhost:1420

## Configuration

### AI Provider Setup

Go to Settings and configure your AI provider:

- **OpenAI** - API Key + Model (gpt-4, gpt-3.5-turbo)
- **Anthropic** - API Key + Model (claude-3-sonnet, claude-3-opus)
- **Custom API** - OpenAI-compatible endpoint

### Workspace Path

Set your skills workspace path in Settings to start managing files.

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **Backend**: Node.js + Express
- **UI**: Custom components with SCSS
- **Desktop**: Tauri (optional)

## License

MIT
