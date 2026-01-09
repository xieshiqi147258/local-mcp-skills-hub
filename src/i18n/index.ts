import { ref, computed } from 'vue';

export type Locale = 'zh-CN' | 'en';

const messages: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    // 侧边栏
    'nav.skills': '技能库',
    'nav.mcp': 'MCP 配置',
    'nav.ai': 'AI 助手',
    'nav.settings': '设置',
    'sidebar.title': 'MCP Skills Hub',
    'sidebar.subtitle': '开发者工具箱',
    'sidebar.lightMode': '浅色模式',
    'sidebar.darkMode': '深色模式',
    'sidebar.version': '版本',

    // Skills 页面
    'skills.title': '技能库',
    'skills.subtitle': '浏览和管理你的技能文件',
    'skills.search': '搜索技能...',
    'skills.new': '新建',
    'skills.noFolder': '未选择技能文件夹',
    'skills.noFolderDesc': '请在设置中配置技能目录路径',
    'skills.goToSettings': '前往设置',
    'skills.selectFolder': '选择文件夹',
    'skills.noSkills': '没有找到技能',
    'skills.noSkillsDesc': '创建你的第一个技能开始使用',
    'skills.createSkill': '创建技能',
    'skills.noSelected': '未选择技能',
    'skills.noSelectedDesc': '从浏览器中选择一个技能开始编辑',
    'skills.edit': '编辑',
    'skills.preview': '预览',
    'skills.save': '保存',
    'skills.delete': '删除',
    'skills.loading': '加载技能中...',
    'skills.unsavedChanges': '你有未保存的更改，确定要放弃吗？',
    'skills.confirmDelete': '确定要删除 "{name}" 吗？',
    'skills.createNew': '创建新技能',
    'skills.fileName': '文件名',
    'skills.fileType': '类型',
    'skills.cancel': '取消',
    'skills.create': '创建',
    'skills.newFolder': '新建文件夹',
    'skills.folderName': '文件夹名称',
    'skills.newSubfolder': '新建子文件夹',
    'skills.newFile': '新建文件',
    'skills.copyContent': '复制内容',
    'skills.copy': '复制',
    'skills.cut': '剪切',
    'skills.paste': '粘贴',
    'skills.confirmDeleteTitle': '确认删除',

    // MCP 页面
    'mcp.title': 'MCP 配置',
    'mcp.subtitle': '管理你的 MCP 服务器和配置',
    'mcp.addServer': '添加服务器',
    'mcp.platform': '平台：',
    'mcp.customPath': '自定义路径...',
    'mcp.enterPath': '输入配置文件路径...',
    'mcp.load': '加载',
    'mcp.noPath': '未设置配置路径',
    'mcp.loading': '加载配置中...',
    'mcp.noServers': '没有 MCP 服务器',
    'mcp.noServersDesc': '添加你的第一个 MCP 服务器开始使用',
    'mcp.running': '运行中',
    'mcp.stopped': '已停止',
    'mcp.error': '错误',
    'mcp.start': '启动',
    'mcp.stop': '停止',
    'mcp.restart': '重启',
    'mcp.logs': '日志',
    'mcp.editServer': '编辑服务器',
    'mcp.addNewServer': '添加新服务器',
    'mcp.serverName': '服务器名称',
    'mcp.command': '命令',
    'mcp.arguments': '参数（每行一个）',
    'mcp.description': '描述（可选）',
    'mcp.saveChanges': '保存更改',
    'mcp.deleteServer': '删除服务器',
    'mcp.confirmDeleteServer': '确定要删除 "{name}" 吗？此操作无法撤销。',
    'mcp.retry': '重试',

    // AI 页面
    'ai.title': 'AI 助手',
    'ai.poweredBy': '由 Claude 提供支持',
    'ai.welcome': '你好！我可以帮助你处理技能相关的工作。我可以读取、分析、优化和修改整个技能包。从浏览器中选择一个技能，或者描述你想创建什么。',
    'ai.optimize': '优化技能',
    'ai.addExamples': '添加示例',
    'ai.review': '质量审查',
    'ai.refactor': '重构',
    'ai.thinking': '思考中...',
    'ai.selectSkillHint': '从技能浏览器中选择一个技能来使用，或者让我创建一个新的',
    'ai.placeholder': '问我任何关于技能的问题...',
    'ai.placeholderWithSkill': '询问关于 "{name}" 的问题...',
    'ai.send': '发送',

    // 设置页面
    'settings.title': '设置',
    'settings.subtitle': '配置你的 MCP Skills Hub 偏好设置',
    'settings.loading': '加载设置中...',
    'settings.pathConfig': '路径配置',
    'settings.skillsDir': '技能目录',
    'settings.skillsDirHint': '选择存储技能文件的文件夹，支持多个目录',
    'settings.addPath': '添加路径',
    'settings.clickToSelect': '点击选择文件夹',
    'settings.mcpConfigPath': 'MCP 配置路径',
    'settings.mcpConfigPathHint': 'MCP 配置文件的路径',
    'settings.aiConfig': 'AI 配置',
    'settings.defaultProvider': '服务提供商',
    'settings.apiKey': 'API 密钥',
    'settings.apiKeyHint': '你的 API 密钥（本地存储，不会上传）',
    'settings.baseUrl': 'API 地址',
    'settings.baseUrlHint': '自定义 API 端点地址',
    'settings.model': '模型 ID',
    'settings.modelHint': '输入或选择模型标识符',
    'settings.ollamaUrl': 'Ollama 地址',
    'settings.ollamaUrlHint': '本地 Ollama 服务地址',
    'settings.appearance': '外观',
    'settings.theme': '主题',
    'settings.themeLight': '浅色',
    'settings.themeDark': '深色',
    'settings.themeSystem': '跟随系统',
    'settings.language': '语言',
    'settings.resetDefaults': '恢复默认',
    'settings.saveChanges': '保存更改',
    'settings.saving': '保存中...',
    'settings.saveSuccess': '设置保存成功！',
    'settings.selectFolder': '选择文件夹',
    'settings.selectFile': '选择文件',
    'settings.browse': '浏览',
    'settings.go': '前往',
    'settings.select': '选择',

    // 通用
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.delete': '删除',
    'common.save': '保存',
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',

    // 状态栏
    'statusbar.mcpRunning': 'MCP: {count} 运行中',
    'statusbar.themeLight': '浅色',
    'statusbar.themeDark': '深色',
    'statusbar.themeSystem': '系统',

    // AI 面板
    'aiPanel.title': 'AI 助手',
    'aiPanel.emptyTitle': '开始与 AI 助手对话',
    'aiPanel.emptyDesc': '可以帮你优化 Skill、检查语法、生成代码',
    'aiPanel.placeholder': '输入消息...',
    'aiPanel.contextHint': '基于当前文件',
    'aiPanel.mockReply': '这是一个模拟的 AI 回复。实际功能将在后续版本中实现。',

    // AI 权限控制
    'aiPermission.title': '文件操作权限',
    'aiPermission.createFolder': '创建文件夹',
    'aiPermission.createFile': '创建文件',
    'aiPermission.editFile': '编辑文件',
    'aiPermission.deleteFile': '删除文件',
    'aiPermission.createFolderDesc': '允许 AI 创建新文件夹',
    'aiPermission.createFileDesc': '允许 AI 创建新文件',
    'aiPermission.editFileDesc': '允许 AI 编辑现有文件',
    'aiPermission.deleteFileDesc': '允许 AI 删除文件和文件夹',

    // AI 操作标签
    'aiPanel.operations.createFolder': '创建文件夹',
    'aiPanel.operations.createFile': '创建文件',
    'aiPanel.operations.editFile': '编辑文件',
    'aiPanel.operations.deleteFile': '删除',

    // 文本选择菜单
    'textSelection.sendToAi': '发送到 AI',
    'textSelection.processPrompt': '你想如何处理选中的文本？',
    'textSelection.optimize': '优化内容',
    'textSelection.explain': '解释说明',
    'textSelection.translate': '翻译',
    'textSelection.other': '其他',

    // AI 选项提示
    'aiOptionPrompt.customPlaceholder': '输入自定义内容...',
    'aiOptionPrompt.skillType': '技能类型',
    'aiOptionPrompt.targetAudience': '目标用户',
    'aiOptionPrompt.complexityLevel': '复杂度',

    // 标题栏
    'titlebar.aiAssistant': 'AI 助手',
    'titlebar.themeLight': '浅色主题',
    'titlebar.themeDark': '深色主题',
    'titlebar.themeSystem': '跟随系统',

    // AI 打字指示器
    'aiTyping.thinking': 'AI 正在思考',
    'aiTyping.stop': '停止生成',

    // AI 消息操作
    'aiMessageActions.toolbar': '消息操作',
    'aiMessageActions.copyText': '复制全文',
    'aiMessageActions.copyCode': '复制代码',
    'aiMessageActions.regenerate': '重新生成',
    'aiMessageActions.edit': '编辑重发',
    'aiMessageActions.delete': '删除消息',
    'aiMessageActions.copied': '已复制',
    'aiMessageActions.copyFailed': '复制失败',
    'aiMessageActions.noCode': '没有代码块',

    // Toast 通知
    'toast.dismiss': '关闭',

    // AI 上下文指示器
    'aiContext.currentFile': '当前文件:',
    'aiContext.selectedText': '选中文本',
    'aiContext.askAboutFile': '点击询问 AI 关于此文件',
    'aiContext.workingDirectory': '工作目录',
    'aiContext.noWorkspace': '未配置工作目录',
    'aiContext.manageWorkspaces': '管理工作目录',
    'aiContext.workspaceChanged': '工作目录已切换到',
    'aiContext.actions.explain': '解释',
    'aiContext.actions.optimize': '优化',
    'aiContext.actions.addComments': '添加注释',
    'aiContext.actions.translate': '翻译',
    'aiContext.actions.fix': '修复',
    'common.close': '关闭',

    // AI 文件卡片
    'aiFileCard.openFile': '打开文件',
    'aiFileCard.expand': '展开预览',
    'aiFileCard.collapse': '收起预览',
    'aiFileCard.showMore': '展开全部',
    'aiFileCard.badgeNew': '新建',
    'aiFileCard.badgeEdit': '编辑',

    // AI 对话历史
    'aiConversation.title': '对话历史',
    'aiConversation.newChat': '新建对话',
    'aiConversation.today': '今天',
    'aiConversation.yesterday': '昨天',
    'aiConversation.daysAgo': '{days}天前',
    'aiConversation.messages': '{count} 条消息',
    'aiConversation.noMessages': '暂无消息',
    'aiConversation.rename': '重命名',
    'aiConversation.delete': '删除',
    'aiConversation.confirmDelete': '确定要删除这个对话吗？',
    'aiConversation.empty': '暂无对话',
    'aiConversation.emptyDesc': '点击上方按钮开始新对话',

    // AI 单条消息
    'aiMessage.userMessage': '用户消息',
    'aiMessage.assistantMessage': 'AI 消息',
    'aiMessage.you': '你',
    'aiMessage.assistant': 'AI',
    'aiMessage.copy': '复制',
    'aiMessage.delete': '删除',
    'aiMessage.toolStatus.pending': '等待中',
    'aiMessage.toolStatus.approved': '已批准',
    'aiMessage.toolStatus.rejected': '已拒绝',
    'aiMessage.toolStatus.running': '执行中',
    'aiMessage.toolStatus.success': '成功',
    'aiMessage.toolStatus.error': '错误',

    // AI 消息列表
    'aiMessageList.ariaLabel': '对话消息列表',
    'aiMessageList.today': '今天',
    'aiMessageList.yesterday': '昨天',

    // AI 空状态引导
    'aiEmptyState.welcome': '欢迎使用 AI 助手',
    'aiEmptyState.description': '我可以帮助你创建、编辑和优化技能文件。选择一个文件开始，或者让我帮你创建新的技能。',
    'aiEmptyState.tip1': '选择文件后，我可以帮你分析和优化',
    'aiEmptyState.tip2': '直接描述你想要的功能，我来帮你实现',
    'aiEmptyState.tip3': '我可以帮你编写、修改和重构代码',
    'aiEmptyState.createSkill': '创建新 Skill',
    'aiEmptyState.browseFiles': '浏览现有文件',
    'aiEmptyState.sendHint': '发送消息',

    // AI 面板头部
    'aiPanelHeader.workspace': '工作空间',
    'aiPanelHeader.noWorkspace': '未配置工作空间',
    'aiPanelHeader.configureWorkspace': '请在设置中配置 Skills 目录',
    'aiPanelHeader.goToSettings': '前往设置',
    'aiPanelHeader.conversations': '对话',

    // AI 输入区域
    'aiInputArea.newLine': '换行',

    // AI 操作确认弹窗
    'aiOperationConfirm.path': '文件路径',
    'aiOperationConfirm.contentPreview': '内容预览',
    'aiOperationConfirm.showMore': '显示更多',
    'aiOperationConfirm.showLess': '收起',
    'aiOperationConfirm.approveOnce': '仅允许此操作',
    'aiOperationConfirm.approveSession': '允许本次会话所有此类操作',
    'aiOperationConfirm.rejectOnce': '拒绝此操作',
    'aiOperationConfirm.rejectStop': '拒绝并停止 AI',
    'aiOperationConfirm.approve': '允许',
    'aiOperationConfirm.reject': '拒绝',
    'aiOperationConfirm.createFolder': '创建文件夹',
    'aiOperationConfirm.createFile': '创建文件',
    'aiOperationConfirm.editFile': '编辑文件',
    'aiOperationConfirm.deleteFile': '删除文件',
    'aiOperationConfirm.readFile': '读取文件',
    'aiOperationConfirm.listFiles': '列出文件',

    // AI 错误显示
    'aiError.title': '发生错误',
    'aiError.showDetails': '显示详情',
    'aiError.hideDetails': '隐藏详情',
    'aiError.retry': '重试',
    'aiError.retrying': '重试中...',
    'aiError.copyError': '复制错误',
    'aiError.copyTooltip': '复制错误详情到剪贴板',
    'aiError.copied': '已复制',
    'aiError.copiedToast': '错误详情已复制',
    'aiError.copyFailed': '复制失败',
    'aiError.dismiss': '关闭',

    // AI 状态指示器
    'aiStatus.success': '成功',
    'aiStatus.error': '错误',
    'aiStatus.loading': '加载中',

    // AI 文件路径
    'aiFilePath.openInEditor': '在编辑器中打开',
    'aiFilePath.copyPath': '复制路径',
    'aiFilePath.copied': '已复制',

    // AI 工具执行结果卡片
    'aiToolResult.success': '成功',
    'aiToolResult.error': '错误',
    'aiToolResult.successAria': '执行成功',
    'aiToolResult.errorAria': '执行失败',
    'aiToolResult.expand': '展开详情',
    'aiToolResult.collapse': '收起详情',
    'aiToolResult.errorDetails': '错误详情',

    // AI 工具卡片
    'aiToolCard.expand': '展开详情',
    'aiToolCard.collapse': '收起详情',
    'aiToolCard.approve': '允许',
    'aiToolCard.reject': '拒绝',
    'aiToolCard.statusPending': '等待中',
    'aiToolCard.statusApproved': '已批准',
    'aiToolCard.statusRejected': '已拒绝',
    'aiToolCard.statusRunning': '执行中',
    'aiToolCard.statusSuccess': '成功',
    'aiToolCard.statusError': '错误',
    'aiToolCard.contentPreview': '内容预览',
    'aiToolCard.error': '错误',

    // AI 代码块
    'aiCodeBlock.copy': '复制代码',
    'aiCodeBlock.copied': '已复制',
    'aiCodeBlock.copyFailed': '复制失败',
    'aiCodeBlock.showMore': '显示更多',
    'aiCodeBlock.showLess': '收起',
    'aiCodeBlock.showLineNumbers': '显示行号',
    'aiCodeBlock.hideLineNumbers': '隐藏行号',

    // AI Diff 视图
    'aiDiff.ariaLabel': '文件差异对比视图',
    'aiDiff.editFile': '编辑文件',
    'aiDiff.expand': '展开差异',
    'aiDiff.collapse': '收起差异',
    'aiDiff.inlineView': '行内视图',
    'aiDiff.sideBySide': '并排视图',
    'aiDiff.original': '原始内容',
    'aiDiff.modified': '修改后',
    'aiDiff.apply': '应用更改',
    'aiDiff.reject': '放弃更改',
    'aiDiff.applyChanges': '应用这些更改到文件',
    'aiDiff.rejectChanges': '放弃这些更改',
    'aiDiff.changesApplied': '更改已应用',
    'aiDiff.changesRejected': '更改已放弃',
  },
  'en': {
    // Sidebar
    'nav.skills': 'Skills',
    'nav.mcp': 'MCP',
    'nav.ai': 'AI Assistant',
    'nav.settings': 'Settings',
    'sidebar.title': 'MCP Skills Hub',
    'sidebar.subtitle': 'Developer Toolkit',
    'sidebar.lightMode': 'Light Mode',
    'sidebar.darkMode': 'Dark Mode',
    'sidebar.version': 'Version',

    // Skills page
    'skills.title': 'Skills Library',
    'skills.subtitle': 'Browse and manage your skill files',
    'skills.search': 'Search skills...',
    'skills.new': 'New',
    'skills.noFolder': 'No skills folder selected',
    'skills.noFolderDesc': 'Please configure skills directory path in Settings',
    'skills.goToSettings': 'Go to Settings',
    'skills.selectFolder': 'Select Folder',
    'skills.noSkills': 'No skills found',
    'skills.noSkillsDesc': 'Create your first skill to get started',
    'skills.createSkill': 'Create Skill',
    'skills.noSelected': 'No skill selected',
    'skills.noSelectedDesc': 'Select a skill from the browser to start editing',
    'skills.edit': 'Edit',
    'skills.preview': 'Preview',
    'skills.save': 'Save',
    'skills.delete': 'Delete',
    'skills.loading': 'Loading skills...',
    'skills.unsavedChanges': 'You have unsaved changes. Discard them?',
    'skills.confirmDelete': 'Delete "{name}"?',
    'skills.createNew': 'Create New Skill',
    'skills.fileName': 'File Name',
    'skills.fileType': 'Type',
    'skills.cancel': 'Cancel',
    'skills.create': 'Create',
    'skills.newFolder': 'New Folder',
    'skills.folderName': 'Folder Name',
    'skills.newSubfolder': 'New Subfolder',
    'skills.newFile': 'New File',
    'skills.copyContent': 'Copy Content',
    'skills.copy': 'Copy',
    'skills.cut': 'Cut',
    'skills.paste': 'Paste',
    'skills.confirmDeleteTitle': 'Confirm Delete',

    // MCP page
    'mcp.title': 'MCP Configuration',
    'mcp.subtitle': 'Manage your MCP servers and configurations',
    'mcp.addServer': 'Add Server',
    'mcp.platform': 'Platform:',
    'mcp.customPath': 'Custom Path...',
    'mcp.enterPath': 'Enter config file path...',
    'mcp.load': 'Load',
    'mcp.noPath': 'No config path set',
    'mcp.loading': 'Loading configuration...',
    'mcp.noServers': 'No MCP Servers',
    'mcp.noServersDesc': 'Add your first MCP server to get started',
    'mcp.running': 'Running',
    'mcp.stopped': 'Stopped',
    'mcp.error': 'Error',
    'mcp.start': 'Start',
    'mcp.stop': 'Stop',
    'mcp.restart': 'Restart',
    'mcp.logs': 'Logs',
    'mcp.editServer': 'Edit Server',
    'mcp.addNewServer': 'Add New Server',
    'mcp.serverName': 'Server Name',
    'mcp.command': 'Command',
    'mcp.arguments': 'Arguments (one per line)',
    'mcp.description': 'Description (optional)',
    'mcp.saveChanges': 'Save Changes',
    'mcp.deleteServer': 'Delete Server',
    'mcp.confirmDeleteServer': 'Are you sure you want to delete "{name}"? This action cannot be undone.',
    'mcp.retry': 'Retry',

    // AI page
    'ai.title': 'AI Assistant',
    'ai.poweredBy': 'Powered by Claude',
    'ai.welcome': "Hello! I can help you work with your Skills. I can read, analyze, optimize, and modify entire skill packages. Select a skill from the browser or describe what you'd like to create.",
    'ai.optimize': 'Optimize Skill',
    'ai.addExamples': 'Add Examples',
    'ai.review': 'Review Quality',
    'ai.refactor': 'Refactor',
    'ai.thinking': 'Thinking...',
    'ai.selectSkillHint': 'Select a skill from the Skills Browser to work with it, or ask me to create a new one',
    'ai.placeholder': 'Ask me anything about your skills...',
    'ai.placeholderWithSkill': 'Ask about "{name}"...',
    'ai.send': 'Send',

    // Settings page
    'settings.title': 'Settings',
    'settings.subtitle': 'Configure your MCP Skills Hub preferences',
    'settings.loading': 'Loading settings...',
    'settings.pathConfig': 'Path Configuration',
    'settings.skillsDir': 'Skills Directories',
    'settings.skillsDirHint': 'Select folders where your skill files are stored. Multiple directories supported.',
    'settings.addPath': 'Add Path',
    'settings.clickToSelect': 'Click to select folder',
    'settings.mcpConfigPath': 'MCP Config Path',
    'settings.mcpConfigPathHint': 'Path to your MCP configuration file',
    'settings.aiConfig': 'AI Configuration',
    'settings.defaultProvider': 'Provider',
    'settings.apiKey': 'API Key',
    'settings.apiKeyHint': 'Your API key (stored locally, never uploaded)',
    'settings.baseUrl': 'Base URL',
    'settings.baseUrlHint': 'Custom API endpoint URL',
    'settings.model': 'Model ID',
    'settings.modelHint': 'Enter or select model identifier',
    'settings.ollamaUrl': 'Ollama URL',
    'settings.ollamaUrlHint': 'Local Ollama service address',
    'settings.appearance': 'Appearance',
    'settings.theme': 'Theme',
    'settings.themeLight': 'Light',
    'settings.themeDark': 'Dark',
    'settings.themeSystem': 'System',
    'settings.language': 'Language',
    'settings.resetDefaults': 'Reset to Defaults',
    'settings.saveChanges': 'Save Changes',
    'settings.saving': 'Saving...',
    'settings.saveSuccess': 'Settings saved successfully!',
    'settings.selectFolder': 'Select Folder',
    'settings.selectFile': 'Select File',
    'settings.browse': 'Browse',
    'settings.go': 'Go',
    'settings.select': 'Select',

    // Common
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',

    // Statusbar
    'statusbar.mcpRunning': 'MCP: {count} Running',
    'statusbar.themeLight': 'Light',
    'statusbar.themeDark': 'Dark',
    'statusbar.themeSystem': 'System',

    // AI Panel
    'aiPanel.title': 'AI Assistant',
    'aiPanel.emptyTitle': 'Start chatting with AI Assistant',
    'aiPanel.emptyDesc': 'Can help you optimize Skills, check syntax, generate code',
    'aiPanel.placeholder': 'Type a message...',
    'aiPanel.contextHint': 'Based on current file',
    'aiPanel.mockReply': 'This is a mock AI reply. Actual functionality will be implemented in future versions.',

    // AI Permission Control
    'aiPermission.title': 'File Operation Permissions',
    'aiPermission.createFolder': 'Create Folder',
    'aiPermission.createFile': 'Create File',
    'aiPermission.editFile': 'Edit File',
    'aiPermission.deleteFile': 'Delete File',
    'aiPermission.createFolderDesc': 'Allow AI to create new folders',
    'aiPermission.createFileDesc': 'Allow AI to create new files',
    'aiPermission.editFileDesc': 'Allow AI to edit existing files',
    'aiPermission.deleteFileDesc': 'Allow AI to delete files and folders',

    // AI Operation Labels
    'aiPanel.operations.createFolder': 'Created folder',
    'aiPanel.operations.createFile': 'Created file',
    'aiPanel.operations.editFile': 'Edited file',
    'aiPanel.operations.deleteFile': 'Deleted',

    // Text Selection Menu
    'textSelection.sendToAi': 'Send to AI',
    'textSelection.processPrompt': 'How would you like to process the selected text?',
    'textSelection.optimize': 'Optimize',
    'textSelection.explain': 'Explain',
    'textSelection.translate': 'Translate',
    'textSelection.other': 'Other',

    // AI Option Prompt
    'aiOptionPrompt.customPlaceholder': 'Enter custom input...',
    'aiOptionPrompt.skillType': 'Skill Type',
    'aiOptionPrompt.targetAudience': 'Target Audience',
    'aiOptionPrompt.complexityLevel': 'Complexity Level',

    // Titlebar
    'titlebar.aiAssistant': 'AI Assistant',
    'titlebar.themeLight': 'Light Theme',
    'titlebar.themeDark': 'Dark Theme',
    'titlebar.themeSystem': 'Follow System',

    // AI Typing Indicator
    'aiTyping.thinking': 'AI is thinking',
    'aiTyping.stop': 'Stop',

    // AI Message Actions
    'aiMessageActions.toolbar': 'Message actions',
    'aiMessageActions.copyText': 'Copy text',
    'aiMessageActions.copyCode': 'Copy code',
    'aiMessageActions.regenerate': 'Regenerate',
    'aiMessageActions.edit': 'Edit & resend',
    'aiMessageActions.delete': 'Delete message',
    'aiMessageActions.copied': 'Copied',
    'aiMessageActions.copyFailed': 'Copy failed',
    'aiMessageActions.noCode': 'No code blocks',

    // Toast notifications
    'toast.dismiss': 'Dismiss',

    // AI Context Indicator
    'aiContext.currentFile': 'Current file:',
    'aiContext.selectedText': 'Selected text',
    'aiContext.askAboutFile': 'Click to ask AI about this file',
    'aiContext.workingDirectory': 'Working Directory',
    'aiContext.noWorkspace': 'No workspace configured',
    'aiContext.manageWorkspaces': 'Manage workspaces',
    'aiContext.workspaceChanged': 'Workspace changed to',
    'aiContext.actions.explain': 'Explain',
    'aiContext.actions.optimize': 'Optimize',
    'aiContext.actions.addComments': 'Add comments',
    'aiContext.actions.translate': 'Translate',
    'aiContext.actions.fix': 'Fix',
    'common.close': 'Close',

    // AI File Card
    'aiFileCard.openFile': 'Open file',
    'aiFileCard.expand': 'Expand preview',
    'aiFileCard.collapse': 'Collapse preview',
    'aiFileCard.showMore': 'Show more',
    'aiFileCard.badgeNew': 'New',
    'aiFileCard.badgeEdit': 'Edit',

    // AI Conversation History
    'aiConversation.title': 'Conversations',
    'aiConversation.newChat': 'New Chat',
    'aiConversation.today': 'Today',
    'aiConversation.yesterday': 'Yesterday',
    'aiConversation.daysAgo': '{days} days ago',
    'aiConversation.messages': '{count} messages',
    'aiConversation.noMessages': 'No messages',
    'aiConversation.rename': 'Rename',
    'aiConversation.delete': 'Delete',
    'aiConversation.confirmDelete': 'Are you sure you want to delete this conversation?',
    'aiConversation.empty': 'No conversations',
    'aiConversation.emptyDesc': 'Click the button above to start a new chat',

    // AI Single Message
    'aiMessage.userMessage': 'User message',
    'aiMessage.assistantMessage': 'AI message',
    'aiMessage.you': 'You',
    'aiMessage.assistant': 'AI',
    'aiMessage.copy': 'Copy',
    'aiMessage.delete': 'Delete',
    'aiMessage.toolStatus.pending': 'Pending',
    'aiMessage.toolStatus.approved': 'Approved',
    'aiMessage.toolStatus.rejected': 'Rejected',
    'aiMessage.toolStatus.running': 'Running',
    'aiMessage.toolStatus.success': 'Success',
    'aiMessage.toolStatus.error': 'Error',

    // AI Message List
    'aiMessageList.ariaLabel': 'Conversation messages',
    'aiMessageList.today': 'Today',
    'aiMessageList.yesterday': 'Yesterday',

    // AI Empty State
    'aiEmptyState.welcome': 'Welcome to AI Assistant',
    'aiEmptyState.description': 'I can help you create, edit, and optimize skill files. Select a file to get started, or let me help you create a new skill.',
    'aiEmptyState.tip1': 'Select a file and I can analyze and optimize it',
    'aiEmptyState.tip2': 'Describe what you want, and I\'ll help you build it',
    'aiEmptyState.tip3': 'I can help you write, modify, and refactor code',
    'aiEmptyState.createSkill': 'Create New Skill',
    'aiEmptyState.browseFiles': 'Browse Files',
    'aiEmptyState.sendHint': 'to send',

    // AI Panel Header
    'aiPanelHeader.workspace': 'Workspace',
    'aiPanelHeader.noWorkspace': 'No workspace configured',
    'aiPanelHeader.configureWorkspace': 'Please configure Skills directory in Settings',
    'aiPanelHeader.goToSettings': 'Go to Settings',
    'aiPanelHeader.conversations': 'Conversations',

    // AI Input Area
    'aiInputArea.newLine': 'new line',

    // AI Operation Confirm Dialog
    'aiOperationConfirm.path': 'File Path',
    'aiOperationConfirm.contentPreview': 'Content Preview',
    'aiOperationConfirm.showMore': 'Show more',
    'aiOperationConfirm.showLess': 'Show less',
    'aiOperationConfirm.approveOnce': 'Approve this operation only',
    'aiOperationConfirm.approveSession': 'Approve all operations of this type for this session',
    'aiOperationConfirm.rejectOnce': 'Reject this operation',
    'aiOperationConfirm.rejectStop': 'Reject and stop AI',
    'aiOperationConfirm.approve': 'Approve',
    'aiOperationConfirm.reject': 'Reject',
    'aiOperationConfirm.createFolder': 'Create Folder',
    'aiOperationConfirm.createFile': 'Create File',
    'aiOperationConfirm.editFile': 'Edit File',
    'aiOperationConfirm.deleteFile': 'Delete File',
    'aiOperationConfirm.readFile': 'Read File',
    'aiOperationConfirm.listFiles': 'List Files',

    // AI Error Display
    'aiError.title': 'An error occurred',
    'aiError.showDetails': 'Show details',
    'aiError.hideDetails': 'Hide details',
    'aiError.retry': 'Retry',
    'aiError.retrying': 'Retrying...',
    'aiError.copyError': 'Copy error',
    'aiError.copyTooltip': 'Copy error details to clipboard',
    'aiError.copied': 'Copied',
    'aiError.copiedToast': 'Error details copied',
    'aiError.copyFailed': 'Copy failed',
    'aiError.dismiss': 'Dismiss',

    // AI Status Indicator
    'aiStatus.success': 'Success',
    'aiStatus.error': 'Error',
    'aiStatus.loading': 'Loading',

    // AI File Path
    'aiFilePath.openInEditor': 'Open in editor',
    'aiFilePath.copyPath': 'Copy path',
    'aiFilePath.copied': 'Copied',

    // AI Tool Result Card
    'aiToolResult.success': 'Success',
    'aiToolResult.error': 'Error',
    'aiToolResult.successAria': 'executed successfully',
    'aiToolResult.errorAria': 'execution failed',
    'aiToolResult.expand': 'Expand details',
    'aiToolResult.collapse': 'Collapse details',
    'aiToolResult.errorDetails': 'Error details',

    // AI Tool Card
    'aiToolCard.expand': 'Expand details',
    'aiToolCard.collapse': 'Collapse details',
    'aiToolCard.approve': 'Approve',
    'aiToolCard.reject': 'Reject',
    'aiToolCard.statusPending': 'Pending',
    'aiToolCard.statusApproved': 'Approved',
    'aiToolCard.statusRejected': 'Rejected',
    'aiToolCard.statusRunning': 'Running',
    'aiToolCard.statusSuccess': 'Success',
    'aiToolCard.statusError': 'Error',
    'aiToolCard.contentPreview': 'Content Preview',
    'aiToolCard.error': 'Error',

    // AI Code Block
    'aiCodeBlock.copy': 'Copy code',
    'aiCodeBlock.copied': 'Copied',
    'aiCodeBlock.copyFailed': 'Copy failed',
    'aiCodeBlock.showMore': 'Show more',
    'aiCodeBlock.showLess': 'Show less',
    'aiCodeBlock.showLineNumbers': 'Show line numbers',
    'aiCodeBlock.hideLineNumbers': 'Hide line numbers',

    // AI Diff View
    'aiDiff.ariaLabel': 'File diff comparison view',
    'aiDiff.editFile': 'Edit file',
    'aiDiff.expand': 'Expand diff',
    'aiDiff.collapse': 'Collapse diff',
    'aiDiff.inlineView': 'Inline',
    'aiDiff.sideBySide': 'Side by Side',
    'aiDiff.original': 'Original',
    'aiDiff.modified': 'Modified',
    'aiDiff.apply': 'Apply Changes',
    'aiDiff.reject': 'Discard',
    'aiDiff.applyChanges': 'Apply these changes to the file',
    'aiDiff.rejectChanges': 'Discard these changes',
    'aiDiff.changesApplied': 'Changes applied',
    'aiDiff.changesRejected': 'Changes discarded',
  }
};

// 当前语言
const currentLocale = ref<Locale>(
  (localStorage.getItem('locale') as Locale) || 'zh-CN'
);

// 设置语言
export function setLocale(locale: Locale) {
  currentLocale.value = locale;
  localStorage.setItem('locale', locale);
}

// 获取当前语言
export function getLocale(): Locale {
  return currentLocale.value;
}

// 翻译函数
export function t(key: string, params?: Record<string, string>): string {
  let text = messages[currentLocale.value]?.[key] || messages['en']?.[key] || key;
  
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }
  
  return text;
}

// 响应式翻译 composable
export function useI18n() {
  const locale = computed(() => currentLocale.value);
  
  return {
    locale,
    t,
    setLocale,
  };
}
