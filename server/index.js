const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3002;

// Helper function to make HTTP requests (替代 fetch)
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const response = {
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        };
        resolve(response);
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

app.use(cors());
app.use(express.json());

// 配置文件路径
const getConfigDir = () => {
  const configDir = path.join(os.homedir(), '.mcp-skills-hub');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  return configDir;
};

const getSettingsPath = () => path.join(getConfigDir(), 'settings.json');

// 默认 MCP 配置路径
const getDefaultMcpPaths = () => {
  const home = os.homedir();
  const paths = [];
  
  if (process.platform === 'win32') {
    const appdata = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    const userprofile = process.env.USERPROFILE || home;
    
    // Claude Desktop - Windows: %APPDATA%\Claude\claude_desktop_config.json
    paths.push({ 
      name: 'Claude Desktop', 
      path: path.join(appdata, 'Claude', 'claude_desktop_config.json') 
    });
    
    // Cursor - Windows: %USERPROFILE%\.cursor\mcp.json
    paths.push({ 
      name: 'Cursor', 
      path: path.join(userprofile, '.cursor', 'mcp.json') 
    });
    
    // Cline (VS Code extension) - Windows: %APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
    paths.push({ 
      name: 'Cline', 
      path: path.join(appdata, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json') 
    });
    
    // Roo Code - Windows: %APPDATA%\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json
    // 或者新版: %USERPROFILE%\.roo\mcp_settings.json
    paths.push({ 
      name: 'Roo Code', 
      path: path.join(appdata, 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json') 
    });
    paths.push({ 
      name: 'Roo Code (New)', 
      path: path.join(userprofile, '.roo', 'mcp_settings.json') 
    });
    
    // Windsurf - Windows: %USERPROFILE%\.codeium\windsurf\mcp_config.json
    paths.push({ 
      name: 'Windsurf', 
      path: path.join(userprofile, '.codeium', 'windsurf', 'mcp_config.json') 
    });
    
    // VS Code Copilot - 在 settings.json 中配置
    paths.push({ 
      name: 'VS Code (Copilot)', 
      path: path.join(appdata, 'Code', 'User', 'settings.json') 
    });
    
    // Kiro - Windows: %USERPROFILE%\.kiro\settings\mcp.json (用户级)
    paths.push({ 
      name: 'Kiro (User)', 
      path: path.join(userprofile, '.kiro', 'settings', 'mcp.json') 
    });
    
  } else if (process.platform === 'darwin') {
    // macOS
    const appSupport = path.join(home, 'Library', 'Application Support');
    
    // Claude Desktop - macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
    paths.push({ 
      name: 'Claude Desktop', 
      path: path.join(appSupport, 'Claude', 'claude_desktop_config.json') 
    });
    
    // Cursor - macOS: ~/.cursor/mcp.json
    paths.push({ 
      name: 'Cursor', 
      path: path.join(home, '.cursor', 'mcp.json') 
    });
    
    // Cline - macOS: ~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
    paths.push({ 
      name: 'Cline', 
      path: path.join(appSupport, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json') 
    });
    
    // Roo Code
    paths.push({ 
      name: 'Roo Code', 
      path: path.join(appSupport, 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json') 
    });
    paths.push({ 
      name: 'Roo Code (New)', 
      path: path.join(home, '.roo', 'mcp_settings.json') 
    });
    
    // Windsurf - macOS: ~/.codeium/windsurf/mcp_config.json
    paths.push({ 
      name: 'Windsurf', 
      path: path.join(home, '.codeium', 'windsurf', 'mcp_config.json') 
    });
    
    // VS Code Copilot
    paths.push({ 
      name: 'VS Code (Copilot)', 
      path: path.join(appSupport, 'Code', 'User', 'settings.json') 
    });
    
    // Kiro
    paths.push({ 
      name: 'Kiro (User)', 
      path: path.join(home, '.kiro', 'settings', 'mcp.json') 
    });
    
  } else {
    // Linux
    const configDir = path.join(home, '.config');
    
    // Claude Desktop - Linux: ~/.config/Claude/claude_desktop_config.json
    paths.push({ 
      name: 'Claude Desktop', 
      path: path.join(configDir, 'Claude', 'claude_desktop_config.json') 
    });
    
    // Cursor
    paths.push({ 
      name: 'Cursor', 
      path: path.join(home, '.cursor', 'mcp.json') 
    });
    
    // Cline
    paths.push({ 
      name: 'Cline', 
      path: path.join(configDir, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json') 
    });
    
    // Roo Code
    paths.push({ 
      name: 'Roo Code', 
      path: path.join(configDir, 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json') 
    });
    paths.push({ 
      name: 'Roo Code (New)', 
      path: path.join(home, '.roo', 'mcp_settings.json') 
    });
    
    // Windsurf
    paths.push({ 
      name: 'Windsurf', 
      path: path.join(home, '.codeium', 'windsurf', 'mcp_config.json') 
    });
    
    // VS Code Copilot
    paths.push({ 
      name: 'VS Code (Copilot)', 
      path: path.join(configDir, 'Code', 'User', 'settings.json') 
    });
    
    // Kiro
    paths.push({ 
      name: 'Kiro (User)', 
      path: path.join(home, '.kiro', 'settings', 'mcp.json') 
    });
  }
  
  // 标记哪些文件存在
  return paths.map(p => ({
    ...p,
    exists: fs.existsSync(p.path)
  }));
};

// ============================================
// Settings API
// ============================================

app.get('/api/settings', (req, res) => {
  try {
    const settingsPath = getSettingsPath();
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      res.json(settings);
    } else {
      res.json({
        skillsPath: '',
        mcpConfigPath: getDefaultMcpPaths()[0]?.path || '',
        theme: 'dark',
        language: 'zh-CN',
        aiProvider: 'anthropic',
        aiModel: 'claude-3-5-sonnet'
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================
// Skills API
// ============================================

const readSkillsDirectory = (dirPath, rootPath = dirPath, parentId = null) => {
  const folders = [];
  const files = [];
  let folderCounter = 0;
  let fileCounter = 0;

  // 支持的文件类型映射
  const typeMap = { 
    '.md': 'markdown', 
    '.json': 'json', 
    '.yaml': 'yaml', 
    '.yml': 'yaml',
    '.js': 'javascript',
    '.ts': 'typescript',
    '.py': 'python',
    '.sh': 'shell',
    '.bash': 'shell',
    '.zsh': 'shell',
    '.txt': 'text',
    '.xml': 'xml',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.vue': 'vue',
    '.jsx': 'javascript',
    '.tsx': 'typescript',
    '.sql': 'sql',
    '.graphql': 'graphql',
    '.gql': 'graphql',
    '.env': 'env',
    '.gitignore': 'text',
    '.dockerignore': 'text',
    '.editorconfig': 'text',
    '.prettierrc': 'json',
    '.eslintrc': 'json',
    '.babelrc': 'json',
    '.npmrc': 'text',
    '.nvmrc': 'text',
    '.toml': 'toml',
    '.ini': 'ini',
    '.cfg': 'ini',
    '.conf': 'ini',
    '.properties': 'properties',
    '.xsd': 'xml',
    '.xsl': 'xml',
    '.xslt': 'xml',
    '.svg': 'xml',
    '.rs': 'rust',
    '.go': 'go',
    '.java': 'java',
    '.kt': 'kotlin',
    '.swift': 'swift',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.rb': 'ruby',
    '.php': 'php',
    '.pl': 'perl',
    '.r': 'r',
    '.lua': 'lua',
    '.dockerfile': 'dockerfile',
    '.makefile': 'makefile',
  };

  const readDir = (currentPath, currentParentId) => {
    if (!fs.existsSync(currentPath)) return;
    
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        // 跳过隐藏文件夹和 node_modules
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        
        folderCounter++;
        const folderId = `folder_${folderCounter}`;
        folders.push({
          id: folderId,
          name: entry.name,
          path: fullPath,
          parentId: currentParentId
        });
        readDir(fullPath, folderId);
      } else if (entry.isFile()) {
        // 跳过隐藏文件
        if (entry.name.startsWith('.')) continue;
        
        const ext = path.extname(entry.name).toLowerCase();
        const baseName = path.basename(entry.name).toLowerCase();
        
        // 检查扩展名或特殊文件名
        let fileType = typeMap[ext];
        if (!fileType && baseName === 'dockerfile') fileType = 'dockerfile';
        if (!fileType && baseName === 'makefile') fileType = 'makefile';
        if (!fileType && baseName.startsWith('license')) fileType = 'text';
        if (!fileType && baseName.startsWith('readme')) fileType = 'markdown';
        
        if (fileType) {
          fileCounter++;
          let content = '';
          try {
            content = fs.readFileSync(fullPath, 'utf-8');
          } catch (e) {
            console.error(`Failed to read file ${fullPath}:`, e.message);
          }
          files.push({
            id: `file_${fileCounter}`,
            name: entry.name,
            path: fullPath,
            type: fileType,
            content,
            folderId: currentParentId
          });
        }
      }
    }
  };

  readDir(dirPath, parentId);
  return { folders, files };
};

app.get('/api/skills', (req, res) => {
  try {
    const { path: dirPath } = req.query;
    if (!dirPath || !fs.existsSync(dirPath)) {
      return res.json({ folders: [], files: [] });
    }
    res.json(readSkillsDirectory(dirPath));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/file', (req, res) => {
  try {
    const { path: filePath } = req.query;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json({ content: fs.readFileSync(filePath, 'utf-8') });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/file', (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/file', (req, res) => {
  try {
    const { path: filePath } = req.query;
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/folder', (req, res) => {
  try {
    const { path: folderPath } = req.body;
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    res.json({ success: true, path: folderPath });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 递归复制文件夹
const copyFolderRecursive = (src, dest) => {
  // 创建目标文件夹
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // 递归复制子文件夹
      copyFolderRecursive(srcPath, destPath);
    } else {
      // 复制文件
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

// 复制文件或文件夹 API
app.post('/api/copy', (req, res) => {
  try {
    const { sourcePath, destPath, isFolder } = req.body;
    
    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({ error: 'Source not found' });
    }
    
    // 检查目标是否已存在，如果存在则添加后缀
    let finalDestPath = destPath;
    let counter = 1;
    while (fs.existsSync(finalDestPath)) {
      const ext = path.extname(destPath);
      const baseName = path.basename(destPath, ext);
      const dir = path.dirname(destPath);
      finalDestPath = path.join(dir, `${baseName}_copy${counter}${ext}`);
      counter++;
    }
    
    if (isFolder) {
      copyFolderRecursive(sourcePath, finalDestPath);
    } else {
      // 确保目标目录存在
      const destDir = path.dirname(finalDestPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(sourcePath, finalDestPath);
    }
    
    res.json({ success: true, path: finalDestPath });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 移动文件或文件夹 API
app.post('/api/move', (req, res) => {
  try {
    const { sourcePath, destPath } = req.body;
    
    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({ error: 'Source not found' });
    }
    
    // 检查目标是否已存在
    let finalDestPath = destPath;
    let counter = 1;
    while (fs.existsSync(finalDestPath)) {
      const ext = path.extname(destPath);
      const baseName = path.basename(destPath, ext);
      const dir = path.dirname(destPath);
      finalDestPath = path.join(dir, `${baseName}_${counter}${ext}`);
      counter++;
    }
    
    // 确保目标目录存在
    const destDir = path.dirname(finalDestPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // 移动（重命名）
    fs.renameSync(sourcePath, finalDestPath);
    
    res.json({ success: true, path: finalDestPath });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================
// MCP Config API
// ============================================

app.get('/api/mcp/paths', (req, res) => {
  res.json(getDefaultMcpPaths());
});

app.get('/api/mcp/config', (req, res) => {
  try {
    const { path: configPath } = req.query;
    if (!configPath || !fs.existsSync(configPath)) {
      return res.json({ mcpServers: {} });
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    res.json(config);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/mcp/config', (req, res) => {
  try {
    const { path: configPath, config } = req.body;
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================
// File Dialog API (使用 open 模块打开系统文件管理器)
// ============================================

app.get('/api/browse/folder', async (req, res) => {
  // 返回用户主目录下的常用文件夹列表供选择
  const home = os.homedir();
  const suggestions = [
    { name: 'Home', path: home },
    { name: 'Documents', path: path.join(home, 'Documents') },
    { name: 'Desktop', path: path.join(home, 'Desktop') },
  ];
  
  // 过滤存在的路径
  const existing = suggestions.filter(s => fs.existsSync(s.path));
  res.json(existing);
});

app.get('/api/browse/files', (req, res) => {
  // 列出指定目录下的文件和文件夹
  const { dir } = req.query;
  const targetDir = dir || os.homedir();
  
  try {
    if (!fs.existsSync(targetDir)) {
      return res.json({ files: [], folders: [], currentPath: targetDir });
    }
    
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    const folders = [];
    const files = [];
    
    // 添加父目录
    const parentDir = path.dirname(targetDir);
    if (parentDir !== targetDir) {
      folders.push({ name: '..', path: parentDir, isParent: true });
    }
    
    for (const entry of entries) {
      // 跳过隐藏文件（以.开头）
      if (entry.name.startsWith('.')) continue;
      
      const fullPath = path.join(targetDir, entry.name);
      if (entry.isDirectory()) {
        folders.push({ name: entry.name, path: fullPath });
      } else if (entry.name.endsWith('.json')) {
        files.push({ name: entry.name, path: fullPath });
      }
    }
    
    res.json({ 
      files: files.slice(0, 50), 
      folders: folders.slice(0, 50), 
      currentPath: targetDir 
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================
// Docs Context API (读取本地文档作为 AI 上下文)
// ============================================

// 文档目录配置
const DOCS_CATEGORIES = {
  'skill-creator': {
    keywords: ['skill', 'create skill', '技能', '创建技能', 'SKILL.md', 'skill creator'],
    basePath: path.join(__dirname, '..', 'docs', 'skill-creator'),
    mainFile: 'SKILL.md',
    referencesDir: 'references'
  },
  'mcp-builder': {
    keywords: ['mcp', 'mcp server', 'model context protocol', 'mcp builder', 'mcp 服务器', '构建mcp'],
    basePath: path.join(__dirname, '..', 'docs', 'mcp-builder'),
    mainFile: 'SKILL.md',
    referencesDir: 'reference'
  }
};

// 获取文档内容
app.get('/api/docs/:category', (req, res) => {
  try {
    const { category } = req.params;
    const { includeReferences } = req.query;
    
    const config = DOCS_CATEGORIES[category];
    if (!config) {
      return res.status(404).json({ error: `Unknown docs category: ${category}` });
    }
    
    const result = { category, content: '', references: [] };
    
    // 读取主文档
    const mainPath = path.join(config.basePath, config.mainFile);
    if (fs.existsSync(mainPath)) {
      result.content = fs.readFileSync(mainPath, 'utf-8');
    }
    
    // 可选：读取参考文档
    if (includeReferences === 'true') {
      const refDir = path.join(config.basePath, config.referencesDir);
      if (fs.existsSync(refDir)) {
        const refFiles = fs.readdirSync(refDir).filter(f => f.endsWith('.md'));
        for (const file of refFiles) {
          const refPath = path.join(refDir, file);
          result.references.push({
            name: file,
            content: fs.readFileSync(refPath, 'utf-8')
          });
        }
      }
    }
    
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 检测消息中的关键词，返回匹配的文档类别
app.post('/api/docs/detect', (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.json({ categories: [] });
    }
    
    const lowerMessage = message.toLowerCase();
    const matchedCategories = [];
    
    for (const [category, config] of Object.entries(DOCS_CATEGORIES)) {
      const hasMatch = config.keywords.some(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
      );
      if (hasMatch) {
        matchedCategories.push(category);
      }
    }
    
    res.json({ categories: matchedCategories });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================
// AI Tools Definition (工具定义)
// ============================================

const AI_TOOLS = [
  {
    name: 'create_folder',
    description: 'Creates a new folder/directory at the specified location. Use this when the user asks to create, make, or add a new folder.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The parent directory path where the folder should be created (e.g., /Users/john/skills)'
        },
        name: {
          type: 'string',
          description: 'The name of the new folder to create (e.g., "my-folder")'
        }
      },
      required: ['path', 'name']
    }
  },
  {
    name: 'create_file',
    description: 'Creates a new file with the specified content. Use this when the user asks to create, make, or add a new file.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The directory path where the file should be created (e.g., /Users/john/skills)'
        },
        name: {
          type: 'string',
          description: 'The name of the file to create including extension (e.g., "hello.md", "config.json")'
        },
        content: {
          type: 'string',
          description: 'The text content to write into the file. Can be empty string for blank files.'
        }
      },
      required: ['path', 'name', 'content']
    }
  },
  {
    name: 'edit_file',
    description: 'Replaces the entire content of an existing file. Use this when the user asks to edit, modify, update, or change a file.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The complete file path including filename (e.g., /Users/john/skills/hello.md)'
        },
        content: {
          type: 'string',
          description: 'The new complete content that will replace the existing file content'
        }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'delete_file',
    description: 'Deletes a file or folder permanently. Use this when the user asks to delete, remove, or erase a file or folder.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The complete path of the file or folder to delete (e.g., /Users/john/skills/old-file.md)'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'read_file',
    description: 'Reads and returns the content of a file. Use this when the user asks to read, show, display, or view a file.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The complete file path to read (e.g., /Users/john/skills/readme.md)'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'list_files',
    description: 'Lists all files and folders in a directory. Use this when the user asks to list, show, or see what files are in a folder.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The directory path to list contents from (e.g., /Users/john/skills)'
        }
      },
      required: ['path']
    }
  }
];

// 执行工具调用 (Requirement 17.2: Support workspacePath)
async function executeToolCall(toolName, toolInput, workspacePath) {
  try {
    // Helper function to resolve path with workspace
    const resolvePath = (inputPath) => {
      // If workspacePath is provided and inputPath is relative or ".", use workspacePath as base
      if (workspacePath && inputPath) {
        if (inputPath === '.' || inputPath === './') {
          return workspacePath;
        }
        if (!path.isAbsolute(inputPath)) {
          return path.join(workspacePath, inputPath);
        }
      }
      return inputPath;
    };

    switch (toolName) {
      case 'create_folder': {
        const basePath = resolvePath(toolInput.path);
        const folderPath = path.join(basePath, toolInput.name);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
        return { success: true, path: folderPath, message: `Folder created: ${folderPath}` };
      }
      
      case 'create_file': {
        const basePath = resolvePath(toolInput.path);
        const filePath = path.join(basePath, toolInput.name);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, toolInput.content || '');
        return { success: true, path: filePath, message: `File created: ${filePath}` };
      }
      
      case 'edit_file': {
        const filePath = resolvePath(toolInput.path);
        if (!fs.existsSync(filePath)) {
          return { success: false, error: `File not found: ${filePath}` };
        }
        fs.writeFileSync(filePath, toolInput.content);
        return { success: true, path: filePath, message: `File updated: ${filePath}` };
      }
      
      case 'delete_file': {
        const targetPath = resolvePath(toolInput.path);
        if (!fs.existsSync(targetPath)) {
          return { success: false, error: `Path not found: ${targetPath}` };
        }
        const stat = fs.statSync(targetPath);
        if (stat.isDirectory()) {
          fs.rmSync(targetPath, { recursive: true });
        } else {
          fs.unlinkSync(targetPath);
        }
        return { success: true, path: targetPath, message: `Deleted: ${targetPath}` };
      }
      
      case 'read_file': {
        const filePath = resolvePath(toolInput.path);
        if (!fs.existsSync(filePath)) {
          return { success: false, error: `File not found: ${filePath}` };
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        return { success: true, content, message: `Read file: ${filePath}` };
      }
      
      case 'list_files': {
        const dirPath = resolvePath(toolInput.path);
        if (!fs.existsSync(dirPath)) {
          return { success: false, error: `Directory not found: ${dirPath}` };
        }
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        const files = entries.filter(e => e.isFile()).map(e => e.name);
        const folders = entries.filter(e => e.isDirectory()).map(e => e.name);
        return { success: true, files, folders, message: `Listed ${files.length} files and ${folders.length} folders` };
      }
      
      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============================================
// AI Chat API (代理到各 AI 提供商)
// ============================================

app.post('/api/ai/chat', async (req, res) => {
  const { messages, options, permissions, workspacePath } = req.body;
  const { provider, model, apiKey, baseUrl, ollamaUrl, systemPrompt } = options || {};

  // Log workspacePath for debugging
  if (workspacePath) {
    console.log('[AI Chat] Using workspace path:', workspacePath);
  }

  try {
    let content = '';
    let toolCalls = [];

    if (provider === 'anthropic') {
      const result = await callAnthropic(messages, model, apiKey, systemPrompt, permissions);
      content = result.content;
      toolCalls = result.toolCalls || [];
    } else if (provider === 'openai') {
      const result = await callOpenAI(messages, model, apiKey, baseUrl, systemPrompt, permissions);
      content = result.content;
      toolCalls = result.toolCalls || [];
    } else if (provider === 'ollama') {
      content = await callOllama(messages, model, ollamaUrl, systemPrompt);
    } else if (provider === 'custom') {
      const result = await callCustomAPI(messages, model, apiKey, baseUrl, systemPrompt, permissions);
      content = result.content;
      toolCalls = result.toolCalls || [];
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // 执行工具调用 (pass workspacePath)
    const toolResults = [];
    for (const toolCall of toolCalls) {
      console.log('[AI Chat] Executing tool:', toolCall.name, 'with input:', toolCall.input, 'workspace:', workspacePath);
      const result = await executeToolCall(toolCall.name, toolCall.input, workspacePath);
      console.log('[AI Chat] Tool result:', result);
      toolResults.push({
        toolName: toolCall.name,
        toolInput: toolCall.input,
        result
      });
    }

    console.log('[AI Chat] Total tools executed:', toolResults.length);
    res.json({ content, toolCalls: toolResults });
  } catch (e) {
    console.error('AI Chat Error:', e.message);
    console.error('Error stack:', e.stack);
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});

// Anthropic Claude API
async function callAnthropic(messages, model, apiKey, systemPrompt, permissions) {
  if (!apiKey) throw new Error('Anthropic API key is required');

  // 根据权限过滤可用工具
  const availableTools = AI_TOOLS.filter(tool => {
    if (tool.name === 'create_folder' && !permissions?.createFolder) return false;
    if (tool.name === 'create_file' && !permissions?.createFile) return false;
    if (tool.name === 'edit_file' && !permissions?.editFile) return false;
    if (tool.name === 'delete_file' && !permissions?.deleteFile) return false;
    return true;
  });

  const defaultSystemPrompt = `You are a file system assistant with DIRECT file manipulation capabilities through function calls.

⚠️ CRITICAL RULES - YOU MUST FOLLOW THESE:

1. You have REAL tools that can ACTUALLY create/edit/delete files
2. When user asks to create/edit/delete files, you MUST call the tool function
3. You are FORBIDDEN from providing bash commands or instructions
4. You are FORBIDDEN from saying "you can use..." or "run this command..."
5. You MUST use the tools - this is NOT optional

Available function tools:
- create_folder(path, name) - Creates a folder
- create_file(path, name, content) - Creates a file with content
- edit_file(path, content) - Modifies file content
- delete_file(path) - Deletes file or folder
- read_file(path) - Reads file content
- list_files(path) - Lists directory contents

CORRECT BEHAVIOR:
User: "Create debug-test.txt with content 'Hello'"
You: [IMMEDIATELY CALL create_file function]
Response: "I've created the file."

FORBIDDEN BEHAVIOR (DO NOT DO THIS):
User: "Create debug-test.txt"
You: "You can use echo command..." ❌ WRONG!
You: "Run this bash command..." ❌ WRONG!
You: "Execute the following..." ❌ WRONG!

YOU HAVE REAL TOOLS. USE THEM. DO NOT PROVIDE INSTRUCTIONS.`;

  const requestBody = {
    model: model || 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    system: systemPrompt || defaultSystemPrompt,
    messages: messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role,
      content: m.content,
    })),
  };

  // 只有在有可用工具时才添加 tools 参数
  if (availableTools.length > 0) {
    requestBody.tools = availableTools;
    // 注意：Anthropic 不支持 tool_choice 参数，它会自动决定是否使用工具
    console.log('[Anthropic] Sending', availableTools.length, 'tools to API');
  } else {
    console.log('[Anthropic] No tools available (check permissions)');
  }

  console.log('[Anthropic] Request body:', JSON.stringify({
    model: requestBody.model,
    system: requestBody.system.substring(0, 100) + '...',
    messages: requestBody.messages.map(m => ({ role: m.role, content: m.content.substring(0, 50) + '...' })),
    tools: requestBody.tools ? `${requestBody.tools.length} tools` : 'none'
  }, null, 2));

  const response = await makeRequest('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Anthropic API error');
  }

  const data = await response.json();
  
  // 调试日志
  console.log('[Anthropic] Response content blocks:', data.content?.length || 0);
  
  // 提取文本内容和工具调用
  let content = '';
  const toolCalls = [];
  
  for (const block of data.content) {
    if (block.type === 'text') {
      content += block.text;
    } else if (block.type === 'tool_use') {
      console.log('[Anthropic] Tool call detected:', block.name, block.input);
      toolCalls.push({
        id: block.id,
        name: block.name,
        input: block.input
      });
    }
  }
  
  console.log('[Anthropic] Total tool calls:', toolCalls.length);
  
  return { content, toolCalls };
}

// OpenAI API
async function callOpenAI(messages, model, apiKey, baseUrl, systemPrompt, permissions) {
  if (!apiKey) throw new Error('OpenAI API key is required');
  
  const url = baseUrl || 'https://api.openai.com/v1';
  
  const allMessages = systemPrompt 
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  // 根据权限过滤可用工具
  const availableTools = AI_TOOLS.filter(tool => {
    if (tool.name === 'create_folder' && !permissions?.createFolder) return false;
    if (tool.name === 'create_file' && !permissions?.createFile) return false;
    if (tool.name === 'edit_file' && !permissions?.editFile) return false;
    if (tool.name === 'delete_file' && !permissions?.deleteFile) return false;
    return true;
  });

  // 转换为 OpenAI 格式的工具定义
  const openaiTools = availableTools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema
    }
  }));

  const requestBody = {
    model: model || 'gpt-4-turbo',
    messages: allMessages,
    max_tokens: 4096,
  };

  if (openaiTools.length > 0) {
    requestBody.tools = openaiTools;
    requestBody.tool_choice = 'auto';
  }

  const response = await makeRequest(`${url}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  const message = data.choices[0]?.message;
  
  const content = message?.content || '';
  const toolCalls = (message?.tool_calls || []).map(tc => ({
    id: tc.id,
    name: tc.function.name,
    input: JSON.parse(tc.function.arguments)
  }));
  
  return { content, toolCalls };
}

// Ollama (本地)
async function callOllama(messages, model, ollamaUrl, systemPrompt) {
  const url = ollamaUrl || 'http://localhost:11434';
  
  const allMessages = systemPrompt 
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const response = await makeRequest(`${url}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'llama3.2',
      messages: allMessages,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error('Ollama API error - is Ollama running?');
  }

  const data = await response.json();
  return data.message?.content || '';
}

// Custom API (OpenAI 兼容格式)
async function callCustomAPI(messages, model, apiKey, baseUrl, systemPrompt, permissions) {
  if (!baseUrl) throw new Error('Custom API base URL is required');
  
  const allMessages = systemPrompt 
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  // 根据权限过滤可用工具
  const availableTools = AI_TOOLS.filter(tool => {
    if (tool.name === 'create_folder' && !permissions?.createFolder) return false;
    if (tool.name === 'create_file' && !permissions?.createFile) return false;
    if (tool.name === 'edit_file' && !permissions?.editFile) return false;
    if (tool.name === 'delete_file' && !permissions?.deleteFile) return false;
    return true;
  });

  // 转换为 OpenAI 格式的工具定义
  const openaiTools = availableTools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema
    }
  }));

  const requestBody = {
    model: model || 'default',
    messages: allMessages,
    max_tokens: 4096,
  };

  if (openaiTools.length > 0) {
    requestBody.tools = openaiTools;
    requestBody.tool_choice = 'auto';
    console.log('[Custom API] Sending', openaiTools.length, 'tools to API');
  }

  // 打印完整请求体用于调试
  console.log('[Custom API] Full request body:');
  console.log(JSON.stringify(requestBody, null, 2));

  const response = await makeRequest(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.log('[Custom API] Error response:', JSON.stringify(error, null, 2));
    throw new Error(error.error?.message || 'Custom API error');
  }

  const data = await response.json();
  
  // 打印完整响应用于调试
  console.log('[Custom API] Full response:');
  console.log(JSON.stringify(data, null, 2));
  
  const message = data.choices?.[0]?.message;
  
  const content = message?.content || data.content || '';
  const toolCalls = (message?.tool_calls || []).map(tc => ({
    id: tc.id,
    name: tc.function.name,
    input: JSON.parse(tc.function.arguments)
  }));
  
  console.log('[Custom API] Tool calls count:', toolCalls.length);
  
  return { content, toolCalls };
}

// ============================================
// AI Chat Stream API (SSE 流式响应)
// ============================================

// Helper function to send SSE event
function sendSSE(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// Anthropic Streaming API (with tool result feedback loop)
async function callAnthropicStream(res, messages, model, apiKey, systemPrompt, permissions, workspacePath, maxIterations = 10) {
  // 根据权限过滤可用工具
  const availableTools = AI_TOOLS.filter(tool => {
    if (tool.name === 'create_folder' && !permissions?.createFolder) return false;
    if (tool.name === 'create_file' && !permissions?.createFile) return false;
    if (tool.name === 'edit_file' && !permissions?.editFile) return false;
    if (tool.name === 'delete_file' && !permissions?.deleteFile) return false;
    return true;
  });

  const defaultSystemPrompt = `You are a file system assistant with DIRECT file manipulation capabilities through function calls.

⚠️ CRITICAL RULES - YOU MUST FOLLOW THESE:

1. You have REAL tools that can ACTUALLY create/edit/delete files
2. When user asks to create/edit/delete files, you MUST call the tool function
3. You are FORBIDDEN from providing bash commands or instructions
4. You are FORBIDDEN from saying "you can use..." or "run this command..."
5. You MUST use the tools - this is NOT optional

Available function tools:
- create_folder(path, name) - Creates a folder
- create_file(path, name, content) - Creates a file with content
- edit_file(path, content) - Modifies file content
- delete_file(path) - Deletes file or folder
- read_file(path) - Reads file content
- list_files(path) - Lists directory contents

CORRECT BEHAVIOR:
User: "Create debug-test.txt with content 'Hello'"
You: [IMMEDIATELY CALL create_file function]
Response: "I've created the file."

FORBIDDEN BEHAVIOR (DO NOT DO THIS):
User: "Create debug-test.txt"
You: "You can use echo command..." ❌ WRONG!
You: "Run this bash command..." ❌ WRONG!
You: "Execute the following..." ❌ WRONG!

YOU HAVE REAL TOOLS. USE THEM. DO NOT PROVIDE INSTRUCTIONS.`;

  // 内部递归函数，处理工具调用循环
  const processStream = (currentMessages, iteration = 0) => {
    return new Promise((resolve, reject) => {
      if (iteration >= maxIterations) {
        console.log('[Anthropic Stream] Max iterations reached, stopping');
        sendSSE(res, 'done', { maxIterationsReached: true });
        resolve();
        return;
      }

      // 转换消息格式为 Anthropic 格式
      const anthropicMessages = currentMessages.filter(m => m.role !== 'system').map(m => {
        // 处理工具结果消息
        if (m.role === 'user' && m.tool_results) {
          return {
            role: 'user',
            content: m.tool_results.map(tr => ({
              type: 'tool_result',
              tool_use_id: tr.tool_use_id,
              content: JSON.stringify(tr.result)
            }))
          };
        }
        // 处理助手消息（可能包含工具调用）
        if (m.role === 'assistant' && m.tool_calls) {
          const content = [];
          if (m.content) {
            content.push({ type: 'text', text: m.content });
          }
          for (const tc of m.tool_calls) {
            content.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.input
            });
          }
          return { role: 'assistant', content };
        }
        return { role: m.role, content: m.content };
      });

      const requestBody = {
        model: model || 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        stream: true,
        system: systemPrompt || defaultSystemPrompt,
        messages: anthropicMessages,
      };

      if (availableTools.length > 0) {
        requestBody.tools = availableTools;
      }

      const postData = JSON.stringify(requestBody);
      
      const options = {
        hostname: 'api.anthropic.com',
        port: 443,
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (apiRes) => {
        if (apiRes.statusCode !== 200) {
          let errorData = '';
          apiRes.on('data', chunk => errorData += chunk);
          apiRes.on('end', () => {
            try {
              const error = JSON.parse(errorData);
              sendSSE(res, 'error', { message: error.error?.message || 'Anthropic API error' });
            } catch {
              sendSSE(res, 'error', { message: 'Anthropic API error' });
            }
            sendSSE(res, 'done', {});
            resolve();
          });
          return;
        }

        let buffer = '';
        let currentToolCall = null;
        let toolCalls = [];
        let fullContent = '';
        let messageStopReceived = false;

        apiRes.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            // Skip empty lines and event type lines
            if (!line.trim() || line.startsWith('event:')) continue;
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const event = JSON.parse(data);
                
                console.log('[Anthropic Stream] Event type:', event.type);
                
                if (event.type === 'content_block_start') {
                  if (event.content_block?.type === 'tool_use') {
                    currentToolCall = {
                      id: event.content_block.id,
                      name: event.content_block.name,
                      input: ''
                    };
                    sendSSE(res, 'tool_call', {
                      id: currentToolCall.id,
                      name: currentToolCall.name,
                      params: {},
                      status: 'pending'
                    });
                  }
                } else if (event.type === 'content_block_delta') {
                  if (event.delta?.type === 'text_delta') {
                    const text = event.delta.text;
                    fullContent += text;
                    sendSSE(res, 'text', { content: text });
                  } else if (event.delta?.type === 'input_json_delta' && currentToolCall) {
                    currentToolCall.input += event.delta.partial_json;
                  }
                } else if (event.type === 'content_block_stop') {
                  if (currentToolCall) {
                    try {
                      currentToolCall.input = JSON.parse(currentToolCall.input);
                    } catch {
                      currentToolCall.input = {};
                    }
                    toolCalls.push(currentToolCall);
                    
                    sendSSE(res, 'tool_call', {
                      id: currentToolCall.id,
                      name: currentToolCall.name,
                      params: currentToolCall.input,
                      status: 'approved'
                    });
                    
                    currentToolCall = null;
                  }
                } else if (event.type === 'message_stop' || event.type === 'message_delta') {
                  // message_delta with stop_reason indicates end of message
                  if (event.type === 'message_delta' && event.delta?.stop_reason !== 'tool_use' && event.delta?.stop_reason !== 'end_turn') {
                    continue;
                  }
                  
                  if (messageStopReceived) continue;
                  messageStopReceived = true;
                  
                  console.log('[Anthropic Stream] Message stop received, toolCalls:', toolCalls.length);
                  
                  // Execute all tool calls and continue conversation if needed
                  (async () => {
                    if (toolCalls.length === 0) {
                      // No tool calls, we're done
                      sendSSE(res, 'done', {});
                      resolve();
                      return;
                    }

                    // Execute tools and collect results
                    const toolResults = [];
                    for (const toolCall of toolCalls) {
                      sendSSE(res, 'tool_call', {
                        id: toolCall.id,
                        name: toolCall.name,
                        params: toolCall.input,
                        status: 'running'
                      });
                      
                      const result = await executeToolCall(toolCall.name, toolCall.input, workspacePath);
                      
                      sendSSE(res, 'tool_result', {
                        id: toolCall.id,
                        name: toolCall.name,
                        success: result.success,
                        message: result.message,
                        error: result.error,
                        data: result
                      });
                      
                      sendSSE(res, 'tool_call', {
                        id: toolCall.id,
                        name: toolCall.name,
                        params: toolCall.input,
                        status: result.success ? 'success' : 'error'
                      });

                      toolResults.push({
                        tool_use_id: toolCall.id,
                        result: result
                      });
                    }

                    // Build updated messages with tool results for next iteration
                    const updatedMessages = [
                      ...currentMessages,
                      {
                        role: 'assistant',
                        content: fullContent,
                        tool_calls: toolCalls
                      },
                      {
                        role: 'user',
                        tool_results: toolResults
                      }
                    ];

                    console.log('[Anthropic Stream] Tool calls executed, continuing conversation (iteration', iteration + 1, ')');
                    
                    // Continue the conversation with tool results
                    await processStream(updatedMessages, iteration + 1);
                    resolve();
                  })();
                }
              } catch (e) {
                console.error('[Anthropic Stream] Parse error:', e.message, 'Line:', line);
              }
            }
          }
        });

        apiRes.on('end', () => {
          console.log('[Anthropic Stream] Stream ended, toolCalls:', toolCalls.length, 'messageStopReceived:', messageStopReceived);
          
          // Handle case where message_stop wasn't received but we have tool calls
          if (!messageStopReceived && toolCalls.length > 0) {
            messageStopReceived = true;
            console.log('[Anthropic Stream] Processing tool calls on stream end');
            
            (async () => {
              const toolResults = [];
              for (const toolCall of toolCalls) {
                sendSSE(res, 'tool_call', {
                  id: toolCall.id,
                  name: toolCall.name,
                  params: toolCall.input,
                  status: 'running'
                });
                
                const result = await executeToolCall(toolCall.name, toolCall.input, workspacePath);
                
                sendSSE(res, 'tool_result', {
                  id: toolCall.id,
                  name: toolCall.name,
                  success: result.success,
                  message: result.message,
                  error: result.error,
                  data: result
                });
                
                sendSSE(res, 'tool_call', {
                  id: toolCall.id,
                  name: toolCall.name,
                  params: toolCall.input,
                  status: result.success ? 'success' : 'error'
                });

                toolResults.push({
                  tool_use_id: toolCall.id,
                  result: result
                });
              }

              const updatedMessages = [
                ...currentMessages,
                {
                  role: 'assistant',
                  content: fullContent,
                  tool_calls: toolCalls
                },
                {
                  role: 'user',
                  tool_results: toolResults
                }
              ];

              console.log('[Anthropic Stream] Tool calls executed on end, continuing conversation (iteration', iteration + 1, ')');
              await processStream(updatedMessages, iteration + 1);
              resolve();
            })();
          } else if (!messageStopReceived && toolCalls.length === 0) {
            sendSSE(res, 'done', {});
            resolve();
          }
        });

        apiRes.on('error', (e) => {
          sendSSE(res, 'error', { message: e.message });
          sendSSE(res, 'done', {});
          resolve();
        });
      });

      req.on('error', (e) => {
        sendSSE(res, 'error', { message: e.message });
        sendSSE(res, 'done', {});
        resolve();
      });

      req.write(postData);
      req.end();
    });
  };

  // Start the conversation
  return processStream(messages);
}

// OpenAI Streaming API (with tool result feedback loop)
async function callOpenAIStream(res, messages, model, apiKey, baseUrl, systemPrompt, permissions, workspacePath, maxIterations = 10) {
  const url = baseUrl || 'https://api.openai.com/v1';

  // 根据权限过滤可用工具
  const availableTools = AI_TOOLS.filter(tool => {
    if (tool.name === 'create_folder' && !permissions?.createFolder) return false;
    if (tool.name === 'create_file' && !permissions?.createFile) return false;
    if (tool.name === 'edit_file' && !permissions?.editFile) return false;
    if (tool.name === 'delete_file' && !permissions?.deleteFile) return false;
    return true;
  });

  // 转换为 OpenAI 格式的工具定义
  const openaiTools = availableTools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema
    }
  }));

  // 内部递归函数，处理工具调用循环
  const processStream = (currentMessages, iteration = 0) => {
    return new Promise((resolve, reject) => {
      if (iteration >= maxIterations) {
        console.log('[OpenAI Stream] Max iterations reached, stopping');
        sendSSE(res, 'done', { maxIterationsReached: true });
        resolve();
        return;
      }

      const allMessages = systemPrompt 
        ? [{ role: 'system', content: systemPrompt }, ...currentMessages]
        : currentMessages;

      // 转换消息格式为 OpenAI 格式
      const openaiMessages = allMessages.map(m => {
        // 处理助手消息（可能包含工具调用）
        if (m.role === 'assistant' && m.tool_calls) {
          return {
            role: 'assistant',
            content: m.content || null,
            tool_calls: m.tool_calls.map(tc => ({
              id: tc.id,
              type: 'function',
              function: {
                name: tc.name,
                arguments: JSON.stringify(tc.input)
              }
            }))
          };
        }
        // 处理工具结果消息
        if (m.role === 'tool') {
          return {
            role: 'tool',
            tool_call_id: m.tool_call_id,
            content: JSON.stringify(m.result)
          };
        }
        return { role: m.role, content: m.content };
      });

      const requestBody = {
        model: model || 'gpt-4-turbo',
        messages: openaiMessages,
        max_tokens: 4096,
        stream: true
      };

      if (openaiTools.length > 0) {
        requestBody.tools = openaiTools;
        requestBody.tool_choice = 'auto';
      }

      const postData = JSON.stringify(requestBody);
      const urlObj = new URL(`${url}/chat/completions`);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = client.request(options, (apiRes) => {
        if (apiRes.statusCode !== 200) {
          let errorData = '';
          apiRes.on('data', chunk => errorData += chunk);
          apiRes.on('end', () => {
            try {
              const error = JSON.parse(errorData);
              sendSSE(res, 'error', { message: error.error?.message || 'OpenAI API error' });
            } catch {
              sendSSE(res, 'error', { message: 'OpenAI API error' });
            }
            sendSSE(res, 'done', {});
            resolve();
          });
          return;
        }

        let buffer = '';
        let toolCalls = {};
        let fullContent = '';
        let streamEnded = false;

        apiRes.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                streamEnded = true;
                // Parse tool call arguments first
                for (const key of Object.keys(toolCalls)) {
                  try {
                    if (typeof toolCalls[key].input === 'string') {
                      toolCalls[key].input = JSON.parse(toolCalls[key].input);
                    }
                    sendSSE(res, 'tool_call', {
                      id: toolCalls[key].id,
                      name: toolCalls[key].name,
                      params: toolCalls[key].input,
                      status: 'approved'
                    });
                  } catch {
                    toolCalls[key].input = {};
                  }
                }

                // Execute all tool calls
                const toolCallsArray = Object.values(toolCalls);
                if (toolCallsArray.length > 0) {
                  (async () => {
                    const toolResults = [];
                    
                    for (const toolCall of toolCallsArray) {
                      sendSSE(res, 'tool_call', {
                        id: toolCall.id,
                        name: toolCall.name,
                        params: toolCall.input,
                        status: 'running'
                      });
                      
                      const result = await executeToolCall(toolCall.name, toolCall.input, workspacePath);
                      
                      sendSSE(res, 'tool_result', {
                        id: toolCall.id,
                        name: toolCall.name,
                        success: result.success,
                        message: result.message,
                        error: result.error,
                        data: result
                      });
                      
                      sendSSE(res, 'tool_call', {
                        id: toolCall.id,
                        name: toolCall.name,
                        params: toolCall.input,
                        status: result.success ? 'success' : 'error'
                      });

                      toolResults.push({
                        tool_call_id: toolCall.id,
                        result: result
                      });
                    }

                    // Build updated messages with tool results for next iteration
                    const updatedMessages = [
                      ...currentMessages,
                      {
                        role: 'assistant',
                        content: fullContent,
                        tool_calls: toolCallsArray
                      },
                      ...toolResults.map(tr => ({
                        role: 'tool',
                        tool_call_id: tr.tool_call_id,
                        result: tr.result
                      }))
                    ];

                    console.log('[OpenAI Stream] Tool calls executed, continuing conversation (iteration', iteration + 1, ')');
                    
                    // Continue the conversation with tool results
                    await processStream(updatedMessages, iteration + 1);
                    resolve();
                  })();
                } else {
                  sendSSE(res, 'done', {});
                  resolve();
                }
                continue;
              }
              
              try {
                const event = JSON.parse(data);
                const delta = event.choices?.[0]?.delta;
                
                if (delta?.content) {
                  fullContent += delta.content;
                  sendSSE(res, 'text', { content: delta.content });
                }
                
                if (delta?.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    const index = tc.index;
                    if (!toolCalls[index]) {
                      toolCalls[index] = {
                        id: tc.id || `tool_${index}`,
                        name: tc.function?.name || '',
                        input: ''
                      };
                      if (tc.function?.name) {
                        sendSSE(res, 'tool_call', {
                          id: toolCalls[index].id,
                          name: tc.function.name,
                          params: {},
                          status: 'pending'
                        });
                      }
                    }
                    
                    if (tc.function?.name) {
                      toolCalls[index].name = tc.function.name;
                    }
                    if (tc.function?.arguments) {
                      toolCalls[index].input += tc.function.arguments;
                    }
                    if (tc.id) {
                      toolCalls[index].id = tc.id;
                    }
                  }
                }
              } catch (e) {
                console.error('[OpenAI Stream] Parse error:', e.message);
              }
            }
          }
        });

        apiRes.on('end', () => {
          // Only handle if stream didn't end properly with [DONE]
          if (!streamEnded && Object.keys(toolCalls).length === 0) {
            sendSSE(res, 'done', {});
            resolve();
          }
        });

        apiRes.on('error', (e) => {
          sendSSE(res, 'error', { message: e.message });
          sendSSE(res, 'done', {});
          resolve();
        });
      });

      req.on('error', (e) => {
        sendSSE(res, 'error', { message: e.message });
        sendSSE(res, 'done', {});
        resolve();
      });

      req.write(postData);
      req.end();
    });
  };

  // Start the conversation
  return processStream(messages);
}

// Custom API Streaming (OpenAI compatible, with tool result feedback loop)
async function callCustomAPIStream(res, messages, model, apiKey, baseUrl, systemPrompt, permissions, workspacePath, maxIterations = 10) {
  if (!baseUrl) {
    sendSSE(res, 'error', { message: 'Custom API base URL is required' });
    sendSSE(res, 'done', {});
    return;
  }

  // 根据权限过滤可用工具
  const availableTools = AI_TOOLS.filter(tool => {
    if (tool.name === 'create_folder' && !permissions?.createFolder) return false;
    if (tool.name === 'create_file' && !permissions?.createFile) return false;
    if (tool.name === 'edit_file' && !permissions?.editFile) return false;
    if (tool.name === 'delete_file' && !permissions?.deleteFile) return false;
    return true;
  });

  const openaiTools = availableTools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema
    }
  }));

  // 内部递归函数，处理工具调用循环
  const processStream = (currentMessages, iteration = 0) => {
    return new Promise((resolve, reject) => {
      if (iteration >= maxIterations) {
        console.log('[Custom API Stream] Max iterations reached, stopping');
        sendSSE(res, 'done', { maxIterationsReached: true });
        resolve();
        return;
      }

      const allMessages = systemPrompt 
        ? [{ role: 'system', content: systemPrompt }, ...currentMessages]
        : currentMessages;

      // 转换消息格式为 OpenAI 格式
      const openaiMessages = allMessages.map(m => {
        if (m.role === 'assistant' && m.tool_calls) {
          return {
            role: 'assistant',
            content: m.content || null,
            tool_calls: m.tool_calls.map(tc => ({
              id: tc.id,
              type: 'function',
              function: {
                name: tc.name,
                arguments: JSON.stringify(tc.input)
              }
            }))
          };
        }
        if (m.role === 'tool') {
          return {
            role: 'tool',
            tool_call_id: m.tool_call_id,
            content: JSON.stringify(m.result)
          };
        }
        return { role: m.role, content: m.content };
      });

      const requestBody = {
        model: model || 'default',
        messages: openaiMessages,
        max_tokens: 4096,
        stream: true
      };

      if (openaiTools.length > 0) {
        requestBody.tools = openaiTools;
        requestBody.tool_choice = 'auto';
      }

      const postData = JSON.stringify(requestBody);
      const urlObj = new URL(`${baseUrl}/chat/completions`);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname,
        method: 'POST',
        headers
      };

      const req = client.request(options, (apiRes) => {
        if (apiRes.statusCode !== 200) {
          let errorData = '';
          apiRes.on('data', chunk => errorData += chunk);
          apiRes.on('end', () => {
            try {
              const error = JSON.parse(errorData);
              sendSSE(res, 'error', { message: error.error?.message || 'Custom API error' });
            } catch {
              sendSSE(res, 'error', { message: 'Custom API error' });
            }
            sendSSE(res, 'done', {});
            resolve();
          });
          return;
        }

        let buffer = '';
        let toolCalls = {};
        let fullContent = '';
        let streamEnded = false;

        apiRes.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                streamEnded = true;
                // Parse tool call arguments first
                for (const key of Object.keys(toolCalls)) {
                  try {
                    if (typeof toolCalls[key].input === 'string') {
                      toolCalls[key].input = JSON.parse(toolCalls[key].input);
                    }
                    sendSSE(res, 'tool_call', {
                      id: toolCalls[key].id,
                      name: toolCalls[key].name,
                      params: toolCalls[key].input,
                      status: 'approved'
                    });
                  } catch {
                    toolCalls[key].input = {};
                  }
                }

                const toolCallsArray = Object.values(toolCalls);
                if (toolCallsArray.length > 0) {
                  (async () => {
                    const toolResults = [];
                    
                    for (const toolCall of toolCallsArray) {
                      sendSSE(res, 'tool_call', {
                        id: toolCall.id,
                        name: toolCall.name,
                        params: toolCall.input,
                        status: 'running'
                      });
                      
                      const result = await executeToolCall(toolCall.name, toolCall.input, workspacePath);
                      
                      sendSSE(res, 'tool_result', {
                        id: toolCall.id,
                        name: toolCall.name,
                        success: result.success,
                        message: result.message,
                        error: result.error,
                        data: result
                      });
                      
                      sendSSE(res, 'tool_call', {
                        id: toolCall.id,
                        name: toolCall.name,
                        params: toolCall.input,
                        status: result.success ? 'success' : 'error'
                      });

                      toolResults.push({
                        tool_call_id: toolCall.id,
                        result: result
                      });
                    }

                    // Build updated messages with tool results for next iteration
                    const updatedMessages = [
                      ...currentMessages,
                      {
                        role: 'assistant',
                        content: fullContent,
                        tool_calls: toolCallsArray
                      },
                      ...toolResults.map(tr => ({
                        role: 'tool',
                        tool_call_id: tr.tool_call_id,
                        result: tr.result
                      }))
                    ];

                    console.log('[Custom API Stream] Tool calls executed, continuing conversation (iteration', iteration + 1, ')');
                    
                    // Continue the conversation with tool results
                    await processStream(updatedMessages, iteration + 1);
                    resolve();
                  })();
                } else {
                  sendSSE(res, 'done', {});
                  resolve();
                }
                continue;
              }
              
              try {
                const event = JSON.parse(data);
                const delta = event.choices?.[0]?.delta;
                const finishReason = event.choices?.[0]?.finish_reason;
                
                // Log for debugging
                if (finishReason) {
                  console.log('[Custom API Stream] Finish reason:', finishReason);
                }
                
                if (delta?.content) {
                  fullContent += delta.content;
                  sendSSE(res, 'text', { content: delta.content });
                }
                
                if (delta?.tool_calls) {
                  console.log('[Custom API Stream] Tool call delta received');
                  for (const tc of delta.tool_calls) {
                    const index = tc.index;
                    if (!toolCalls[index]) {
                      toolCalls[index] = {
                        id: tc.id || `tool_${index}`,
                        name: tc.function?.name || '',
                        input: ''
                      };
                      if (tc.function?.name) {
                        console.log('[Custom API Stream] New tool call:', tc.function.name);
                        sendSSE(res, 'tool_call', {
                          id: toolCalls[index].id,
                          name: tc.function.name,
                          params: {},
                          status: 'pending'
                        });
                      }
                    }
                    
                    if (tc.function?.name) {
                      toolCalls[index].name = tc.function.name;
                    }
                    if (tc.function?.arguments) {
                      toolCalls[index].input += tc.function.arguments;
                    }
                    if (tc.id) {
                      toolCalls[index].id = tc.id;
                    }
                  }
                }
                
                // Handle finish_reason for tool_calls (some APIs send this instead of [DONE])
                if (finishReason === 'tool_calls' || finishReason === 'stop') {
                  console.log('[Custom API Stream] Finish reason received:', finishReason, 'toolCalls:', Object.keys(toolCalls).length);
                }
              } catch (e) {
                console.error('[Custom API Stream] Parse error:', e.message, 'Data:', data.substring(0, 100));
              }
            }
          }
        });

        apiRes.on('end', () => {
          console.log('[Custom API Stream] Stream ended, streamEnded:', streamEnded, 'toolCalls:', Object.keys(toolCalls).length);
          
          if (streamEnded) {
            // Already handled by [DONE]
            return;
          }
          
          // Handle case where [DONE] wasn't received but stream ended
          // Parse any pending tool call arguments
          for (const key of Object.keys(toolCalls)) {
            try {
              if (typeof toolCalls[key].input === 'string' && toolCalls[key].input) {
                toolCalls[key].input = JSON.parse(toolCalls[key].input);
              }
              sendSSE(res, 'tool_call', {
                id: toolCalls[key].id,
                name: toolCalls[key].name,
                params: toolCalls[key].input,
                status: 'approved'
              });
            } catch {
              toolCalls[key].input = {};
            }
          }

          const toolCallsArray = Object.values(toolCalls);
          if (toolCallsArray.length > 0) {
            console.log('[Custom API Stream] Processing tool calls on stream end');
            (async () => {
              const toolResults = [];
              
              for (const toolCall of toolCallsArray) {
                sendSSE(res, 'tool_call', {
                  id: toolCall.id,
                  name: toolCall.name,
                  params: toolCall.input,
                  status: 'running'
                });
                
                const result = await executeToolCall(toolCall.name, toolCall.input, workspacePath);
                
                sendSSE(res, 'tool_result', {
                  id: toolCall.id,
                  name: toolCall.name,
                  success: result.success,
                  message: result.message,
                  error: result.error,
                  data: result
                });
                
                sendSSE(res, 'tool_call', {
                  id: toolCall.id,
                  name: toolCall.name,
                  params: toolCall.input,
                  status: result.success ? 'success' : 'error'
                });

                toolResults.push({
                  tool_call_id: toolCall.id,
                  result: result
                });
              }

              // Build updated messages with tool results for next iteration
              const updatedMessages = [
                ...currentMessages,
                {
                  role: 'assistant',
                  content: fullContent,
                  tool_calls: toolCallsArray
                },
                ...toolResults.map(tr => ({
                  role: 'tool',
                  tool_call_id: tr.tool_call_id,
                  result: tr.result
                }))
              ];

              console.log('[Custom API Stream] Tool calls executed on end, continuing conversation (iteration', iteration + 1, ')');
              
              // Continue the conversation with tool results
              await processStream(updatedMessages, iteration + 1);
              resolve();
            })();
          } else {
            sendSSE(res, 'done', {});
            resolve();
          }
        });

        apiRes.on('error', (e) => {
          sendSSE(res, 'error', { message: e.message });
          sendSSE(res, 'done', {});
          resolve();
        });
      });

      req.on('error', (e) => {
        sendSSE(res, 'error', { message: e.message });
        sendSSE(res, 'done', {});
        resolve();
      });

      req.write(postData);
      req.end();
    });
  };

  // Start the conversation
  return processStream(messages);
}

// Ollama Streaming API
async function callOllamaStream(res, messages, model, ollamaUrl, systemPrompt, workspacePath) {
  const url = ollamaUrl || 'http://localhost:11434';
  
  const allMessages = systemPrompt 
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  return new Promise((resolve, reject) => {
    const requestBody = {
      model: model || 'llama3.2',
      messages: allMessages,
      stream: true
    };
    
    const postData = JSON.stringify(requestBody);
    const urlObj = new URL(`${url}/api/chat`);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 11434,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (apiRes) => {
      if (apiRes.statusCode !== 200) {
        sendSSE(res, 'error', { message: 'Ollama API error - is Ollama running?' });
        sendSSE(res, 'done', {});
        resolve();
        return;
      }

      let buffer = '';

      apiRes.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const event = JSON.parse(line);
            
            if (event.message?.content) {
              sendSSE(res, 'text', { content: event.message.content });
            }
            
            if (event.done) {
              sendSSE(res, 'done', {});
              resolve();
            }
          } catch (e) {
            console.error('[Ollama Stream] Parse error:', e.message);
          }
        }
      });

      apiRes.on('end', () => {
        sendSSE(res, 'done', {});
        resolve();
      });

      apiRes.on('error', (e) => {
        sendSSE(res, 'error', { message: e.message });
        sendSSE(res, 'done', {});
        resolve();
      });
    });

    req.on('error', (e) => {
      sendSSE(res, 'error', { message: e.message });
      sendSSE(res, 'done', {});
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// SSE Streaming Endpoint
app.post('/api/ai/chat/stream', async (req, res) => {
  const { messages, options, permissions, workspacePath } = req.body;
  const { provider, model, apiKey, baseUrl, ollamaUrl, systemPrompt } = options || {};

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Log workspacePath for debugging
  if (workspacePath) {
    console.log('[AI Chat Stream] Using workspace path:', workspacePath);
  }

  try {
    if (provider === 'anthropic') {
      if (!apiKey) {
        sendSSE(res, 'error', { message: 'Anthropic API key is required' });
        sendSSE(res, 'done', {});
        res.end();
        return;
      }
      await callAnthropicStream(res, messages, model, apiKey, systemPrompt, permissions, workspacePath);
    } else if (provider === 'openai') {
      if (!apiKey) {
        sendSSE(res, 'error', { message: 'OpenAI API key is required' });
        sendSSE(res, 'done', {});
        res.end();
        return;
      }
      await callOpenAIStream(res, messages, model, apiKey, baseUrl, systemPrompt, permissions, workspacePath);
    } else if (provider === 'ollama') {
      await callOllamaStream(res, messages, model, ollamaUrl, systemPrompt, workspacePath);
    } else if (provider === 'custom') {
      await callCustomAPIStream(res, messages, model, apiKey, baseUrl, systemPrompt, permissions, workspacePath);
    } else {
      sendSSE(res, 'error', { message: `Unsupported provider: ${provider}` });
      sendSSE(res, 'done', {});
    }
  } catch (e) {
    console.error('AI Chat Stream Error:', e.message);
    sendSSE(res, 'error', { message: e.message });
    sendSSE(res, 'done', {});
  }

  res.end();
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log(`MCP Skills Hub API running at http://localhost:${PORT}`);
});