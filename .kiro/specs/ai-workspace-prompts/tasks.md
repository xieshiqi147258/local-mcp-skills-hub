# Implementation Plan: AI Workspace Prompts

## Overview

全面升级 AI 助手，实现工作空间路径注入、可配置提示词、工具模式可视化、流式响应、Diff 对比视图、对话历史记录等功能。

## Tasks

- [x] 1. 扩展 Settings Store 支持系统提示词
  - [x] 1.1 添加 systemPrompts 字段到 Settings Store
    - 添加 SystemPrompts 接口定义
    - 添加 skillsPrompt 和 mcpPrompt 字段
    - 实现 localStorage 持久化
    - _Requirements: 2.1, 2.3, 2.4_
  - [x] 1.2 实现模板变量替换函数
    - 创建 replaceTemplateVariables 函数
    - 支持 {{skills_workspace}}, {{mcp_config_path}}, {{current_file}}, {{current_folder}}
    - 变量无值时替换为空字符串或占位符
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 1.3 添加默认提示词模板
    - Skills 场景默认提示词（含工作空间路径、工具列表）
    - MCP 场景默认提示词（含 MCP 配置路径）
    - 重置为默认功能
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 1.4 实现场景化提示词切换
    - Skills 视图使用 Skills 提示词
    - MCP 视图使用 MCP 提示词
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2. 创建提示词编辑器组件 (Settings 页面)
  - [x] 2.1 实现提示词编辑 UI
    - 可编辑文本区域
    - 变量高亮显示
    - _Requirements: 2.2, 6.3_
  - [x] 2.2 实现实时预览功能
    - 变量替换后的预览
    - 实时更新
    - _Requirements: 6.1, 6.2_

- [x] 3. 创建工具执行卡片组件 AiToolCard.vue
  - [x] 3.1 实现工具卡片基础结构
    - 工具图标映射 (create_folder, create_file, edit_file, delete_file, read_file, list_files)
    - 工具名称和参数显示
    - 可折叠详情区域
    - _Requirements: 7.1, 7.4_
  - [x] 3.2 实现工具执行状态样式
    - pending/approved/rejected/running/success/error 状态
    - 状态图标和颜色
    - 状态过渡动画
    - _Requirements: 7.1, 7.3_
  - [x] 3.3 实现允许/拒绝按钮
    - 按钮样式和交互
    - 发射 approve/reject 事件
    - _Requirements: 7.2_

- [x] 4. 创建代码块组件 AiCodeBlock.vue
  - [x] 4.1 集成 highlight.js 语法高亮
    - 安装 highlight.js 依赖
    - 实现语法高亮渲染
    - 支持多种语言
    - _Requirements: 15.2, 15.3_
  - [x] 4.2 实现代码块 UI 功能
    - 语言标签显示（右上角）
    - 复制按钮（hover 显示）
    - 行号显示（可切换）
    - 深色背景（即使在浅色模式）
    - 最大高度 300px + 滚动
    - _Requirements: 13.3, 13.4, 15.3_
  - [x] 4.3 实现长代码折叠
    - 默认折叠超长代码
    - "显示更多/收起" 切换
    - 平滑展开/折叠动画
    - _Requirements: 13.4, 15.5_

- [x] 5. 创建打字指示器组件 AiTypingIndicator.vue
  - 动画打字指示器（三个点动画）
  - "AI 正在思考..." 文本
  - 停止按钮（取消生成）
  - _Requirements: 10.1, 13.7_

- [x] 6. 创建消息操作工具栏 AiMessageActions.vue
  - [x] 6.1 实现消息操作按钮
    - 复制全文按钮
    - 复制代码按钮（仅复制代码块）
    - 重新生成按钮（AI 消息）
    - 编辑重发按钮（用户消息）
    - 删除按钮
    - _Requirements: 13.1_
  - [x] 6.2 实现 Toast 通知
    - 复制成功提示 "已复制"
    - 操作反馈
    - _Requirements: 13.2_

- [x] 7. 创建输入区域组件 AiInputArea.vue
  - [x] 7.1 实现键盘快捷键
    - Ctrl+Enter 发送（可配置）
    - Shift+Enter 换行
    - Up 编辑上条消息
    - Esc 清空输入
    - _Requirements: 13.5_
  - [x] 7.2 实现字符计数
    - 显示当前字符数
    - _Requirements: 13.6_

- [x] 8. 集成 Markdown 渲染
  - [x] 8.1 安装并配置 marked
    - 安装 marked 和 dayjs 依赖
    - 配置渲染选项
    - _Requirements: 15.1_
  - [x] 8.2 实现完整 Markdown 支持
    - 标题 h1-h6
    - 粗体、斜体、删除线
    - 有序/无序列表
    - 链接（新标签页打开）
    - 引用块（左边框样式）
    - 水平线
    - 表格
    - _Requirements: 15.1_
  - [x] 8.3 实现内联代码样式
    - 背景色区分
    - 等宽字体
    - 圆角
    - _Requirements: 15.2_

- [x] 9. 扩展 AI Store 支持对话历史
  - [x] 9.1 添加对话数据结构
    - 添加 Conversation 接口
    - 添加 conversations 数组
    - 添加 currentConversationId
    - 扩展 Message 接口（toolCalls, fileContext, isStreaming）
    - _Requirements: 12.1_
  - [x] 9.2 实现对话持久化
    - localStorage 存储
    - 限制最多 50 条
    - 自动保存
    - 自动生成标题（从首条消息）
    - _Requirements: 12.1, 12.3, 12.5_

- [x] 10. 创建对话历史列表组件 AiConversationList.vue
  - [x] 10.1 实现对话列表显示
    - 标题、日期、消息数
    - 当前对话高亮
    - _Requirements: 12.2, 12.3_
  - [x] 10.2 实现对话操作
    - 新建对话
    - 切换对话
    - 删除对话
    - 重命名对话
    - _Requirements: 12.4_

- [x] 11. 创建面板头部组件 AiPanelHeader.vue
  - 显示当前工作空间路径
  - 对话切换下拉
  - 新建对话按钮
  - _Requirements: 1.4, 12.2_

- [x] 12. 创建上下文指示器组件 AiContextIndicator.vue
  - [x] 12.1 显示当前选中文件
    - 文件图标 + 路径
    - 点击询问 AI
    - _Requirements: 14.1, 14.2_
  - [x] 12.2 显示选中文本预览
    - 截断显示（最多 3 行）
    - 引用块样式高亮
    - _Requirements: 14.4, 14.5_
  - [x] 12.3 实现快捷操作按钮
    - 文件：解释/优化/添加注释
    - 文本：解释/优化/翻译/修复
    - _Requirements: 14.3_

- [x] 13. 创建文件卡片组件 AiFileCard.vue
  - [x] 13.1 实现文件卡片 UI
    - 文件图标 + 名称
    - 新建/编辑 badge
    - 打开文件按钮
    - _Requirements: 14.6, 14.7_
  - [x] 13.2 实现内容预览
    - 显示前 5 行
    - 展开全部按钮
    - 代码文件语法高亮
    - _Requirements: 14.8_

- [x] 14. 创建空状态引导组件 AiEmptyState.vue
  - 欢迎消息
  - 使用提示
  - 快速开始按钮（创建新 Skill / 浏览现有文件）
  - _Requirements: 14.9_

- [x] 15. 创建单条消息组件 AiMessage.vue
  - [x] 15.1 实现消息基础结构
    - 用户/AI 消息区分样式
    - 头像显示
    - 内容渲染（Markdown）
    - _Requirements: 15.8_
  - [x] 15.2 实现时间戳显示
    - 相对时间（刚刚、5分钟前、昨天）
    - hover 显示精确时间
    - 按日期分组
    - _Requirements: 15.7_
  - [x] 15.3 实现交互功能
    - 双击选中全文
    - 右键上下文菜单（复制/删除）
    - _Requirements: 13.10, 13.11_

- [x] 16. 创建消息列表组件 AiMessageList.vue
  - 消息列表容器
  - 自动滚动到底部
  - 键盘导航（Tab 切换消息）
  - _Requirements: 13.9_

- [x] 17. 修改 AiSidebarPanel 集成所有组件
  - [x] 17.1 集成工作空间路径
    - 从 Settings Store 获取 skillsPath
    - 未配置时提示用户配置
    - _Requirements: 1.1, 1.2, 1.4_
  - [x] 17.2 传递 workspacePath 到后端
    - 修改 chat 请求参数
    - 注入到系统提示词
    - _Requirements: 1.1, 1.3_
  - [x] 17.3 集成所有子组件
    - AiPanelHeader
    - AiContextIndicator
    - AiMessageList
    - AiEmptyState
    - AiConversationList
    - AiInputArea
    - _Requirements: 设计文档组件结构_

- [x] 18. 修改后端 executeToolCall 支持工作空间路径
  - 接收 workspacePath 参数
  - 相对路径拼接 workspacePath
  - _Requirements: 1.1_

- [x] 19. Checkpoint - 基础功能验证
  - 确保所有组件正常渲染
  - 确保工作空间路径正确传递
  - 确保对话历史正常保存

- [x] 20. 创建 Diff 对比视图组件 AiDiffView.vue
  - [x] 20.1 集成 diff 库
    - 安装 diff 依赖
    - 实现文本差异计算
    - _Requirements: 9.1_
  - [x] 20.2 实现 Diff 显示
    - 逐行对比显示（side-by-side 或 inline）
    - 添加行（绿色背景）
    - 删除行（红色背景）
    - 修改行（黄色背景）
    - 行号显示
    - _Requirements: 9.2, 9.3_
  - [x] 20.3 实现 approve/reject 流程
    - 应用更改按钮
    - 放弃更改按钮
    - 通知 AI 结果
    - _Requirements: 9.4, 9.5, 9.6_

- [x] 21. 后端添加 SSE 流式端点
  - [x] 21.1 创建 /api/ai/chat/stream 端点
    - SSE 响应格式
    - 流式调用 AI Provider（Anthropic, OpenAI, Custom）
    - _Requirements: 8.1_
  - [x] 21.2 实现 SSE 事件类型
    - text 事件（文本内容）
    - tool_call 事件（工具调用）
    - tool_result 事件（工具结果）
    - done 事件（完成）
    - error 事件（错误）
    - _Requirements: 8.1_

- [x] 22. 前端实现流式响应
  - [x] 22.1 实现 EventSource 连接
    - 连接 SSE 端点
    - 处理各类事件
    - _Requirements: 8.2_
  - [x] 22.2 实现打字机效果
    - 逐字符/逐块渲染
    - 平滑动画
    - _Requirements: 8.3_
  - [x] 22.3 流式工具调用处理
    - 检测到 tool_call 立即显示卡片
    - 处理中断
    - _Requirements: 8.4, 8.5_

- [x] 23. 创建操作确认弹窗 AiOperationConfirm.vue
  - [x] 23.1 实现弹窗 UI
    - 操作类型 + 图标
    - 文件路径显示（语法高亮）
    - 内容预览（截断）
    - _Requirements: 10.2, 11.1, 11.2_
  - [x] 23.2 实现确认按钮
    - 允许按钮（✓）+ 键盘快捷键
    - 拒绝按钮（✗）+ 键盘快捷键
    - _Requirements: 10.2_
  - [x] 23.3 实现确认选项
    - 仅允许此操作
    - 允许本次会话所有此类操作
    - 拒绝此操作
    - 拒绝并停止 AI
    - _Requirements: 11.3_
  - [x] 23.4 实现"记住本次会话"选项
    - 预批准后自动执行
    - _Requirements: 11.4_
  - [x] 23.5 实现操作日志
    - 记录所有操作（允许/拒绝）
    - _Requirements: 11.5_

- [x] 24. 实现成功/错误状态 UI
  - [x] 24.1 实现状态样式
    - 成功：绿色 + ✓ 图标
    - 错误：红色 + ✗ 图标
    - _Requirements: 10.3_
  - [x] 24.2 实现动画效果
    - 成功/错误图标动画
    - _Requirements: 10.3_
  - [x] 24.3 实现错误处理 UI
    - 错误消息显示
    - 重试按钮
    - 复制错误详情
    - _Requirements: 13.8_

- [x] 25. 实现文件路径显示组件
  - 可点击 chips/badges
  - 文件类型图标
  - 长路径截断 + tooltip
  - 点击在编辑器中打开
  - _Requirements: 15.4_

- [x] 26. 实现工具执行结果卡片样式
  - 成功：绿色左边框 + ✓ 图标
  - 错误：红色左边框 + ✗ 图标
  - 默认紧凑模式
  - 可展开详情
  - _Requirements: 15.6_

- [x] 27. 实现 Skills tree 文件高亮
  - AI 编辑文件后高亮该文件
  - 自动刷新 Skills tree
  - _Requirements: 14.7_

- [x] 28. 实现深色/浅色主题支持
  - 所有新组件支持主题切换
  - 遵循设计文档颜色方案
  - _Requirements: 10.4_

- [x] 29. Final Checkpoint - 完整功能验证
  - 确保所有测试通过
  - 确保 UI 符合设计规范
  - 用户如有问题请提出

## Dependencies

```bash
npm install marked highlight.js diff dayjs
npm install -D @types/marked
```

## Notes

- 任务按依赖顺序排列，建议按顺序执行
- 每个任务完成后进行功能验证
- Checkpoint 任务用于阶段性验证
- 所有组件需支持深色/浅色主题
- 遵循设计文档中的 UI/UX 规范和无障碍要求
