// API 基础配置
const API_BASE = 'http://localhost:3002/api';

// ============================================
// Types
// ============================================

export interface SkillFile {
  id: string;
  name: string;
  path: string;
  type: string; // markdown, json, yaml, javascript, typescript, python, etc.
  content: string;
  folderId: string | null;
}

export interface SkillFolder {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
}

export interface McpServer {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface McpConfig {
  mcpServers: Record<string, McpServer>;
}

export interface AppSettings {
  skillsPath: string;
  mcpConfigPath: string;
  theme: string;
  language: string;
  aiProvider: string;
  aiModel: string;
  // 新增字段用于完整持久化
  skillsPaths?: Array<{ path: string; active: boolean }>;
  apiKey?: string;
  aiBaseUrl?: string;
  ollamaUrl?: string;
}

// ============================================
// API 可用性检查
// ============================================

let apiAvailable: boolean | null = null;

export async function checkApiAvailable(): Promise<boolean> {
  if (apiAvailable !== null) return apiAvailable;
  
  try {
    const res = await fetch(`${API_BASE}/settings`, { method: 'GET' });
    apiAvailable = res.ok;
  } catch {
    apiAvailable = false;
  }
  return apiAvailable;
}

export function isApiAvailable(): boolean {
  return apiAvailable === true;
}

// ============================================
// Settings API
// ============================================

export async function loadSettings(): Promise<AppSettings> {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to load settings');
    return await res.json();
  } catch (error) {
    console.error("Failed to load settings:", error);
    return {
      skillsPath: "",
      mcpConfigPath: "",
      theme: "dark",
      language: "zh-CN",
      aiProvider: "anthropic",
      aiModel: "claude-3-5-sonnet",
    };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to save settings');
}

// ============================================
// Skills API
// ============================================

export async function readSkillsDirectory(
  dirPath: string
): Promise<{ folders: SkillFolder[]; files: SkillFile[] }> {
  const res = await fetch(`${API_BASE}/skills?path=${encodeURIComponent(dirPath)}`);
  if (!res.ok) throw new Error('Failed to read skills directory');
  return await res.json();
}

export async function readFileContent(filePath: string): Promise<string> {
  const res = await fetch(`${API_BASE}/file?path=${encodeURIComponent(filePath)}`);
  if (!res.ok) throw new Error('Failed to read file');
  const data = await res.json();
  return data.content;
}

export async function writeFileContent(filePath: string, content: string): Promise<void> {
  const res = await fetch(`${API_BASE}/file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath, content })
  });
  if (!res.ok) throw new Error('Failed to write file');
}

export async function createSkillFile(
  folderPath: string,
  fileName: string,
  content: string
): Promise<string> {
  const filePath = `${folderPath}/${fileName}`.replace(/\\/g, '/');
  await writeFileContent(filePath, content);
  return filePath;
}

export async function createSkillFolder(
  parentPath: string,
  folderName: string
): Promise<string> {
  const folderPath = `${parentPath}/${folderName}`.replace(/\\/g, '/');
  const res = await fetch(`${API_BASE}/folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: folderPath })
  });
  if (!res.ok) throw new Error('Failed to create folder');
  return folderPath;
}

export async function deleteSkillItem(itemPath: string): Promise<void> {
  const res = await fetch(`${API_BASE}/file?path=${encodeURIComponent(itemPath)}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete item');
}

// 复制文件或文件夹（递归）
export async function copyItem(sourcePath: string, destPath: string, isFolder: boolean): Promise<string> {
  const res = await fetch(`${API_BASE}/copy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourcePath, destPath, isFolder })
  });
  if (!res.ok) throw new Error('Failed to copy item');
  const data = await res.json();
  return data.path;
}

// 移动文件或文件夹
export async function moveItem(sourcePath: string, destPath: string): Promise<string> {
  const res = await fetch(`${API_BASE}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourcePath, destPath })
  });
  if (!res.ok) throw new Error('Failed to move item');
  const data = await res.json();
  return data.path;
}

// ============================================
// MCP Config API
// ============================================

export async function readMcpConfig(configPath: string): Promise<McpConfig> {
  const res = await fetch(`${API_BASE}/mcp/config?path=${encodeURIComponent(configPath)}`);
  if (!res.ok) throw new Error('Failed to read MCP config');
  return await res.json();
}

export async function writeMcpConfig(configPath: string, config: McpConfig): Promise<void> {
  const res = await fetch(`${API_BASE}/mcp/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: configPath, config })
  });
  if (!res.ok) throw new Error('Failed to write MCP config');
}

export async function addMcpServer(
  configPath: string,
  name: string,
  server: McpServer
): Promise<void> {
  const config = await readMcpConfig(configPath);
  config.mcpServers[name] = server;
  await writeMcpConfig(configPath, config);
}

export async function removeMcpServer(configPath: string, name: string): Promise<void> {
  const config = await readMcpConfig(configPath);
  delete config.mcpServers[name];
  await writeMcpConfig(configPath, config);
}

export async function getMcpConfigPaths(): Promise<Array<{ name: string; path: string }>> {
  const res = await fetch(`${API_BASE}/mcp/paths`);
  if (!res.ok) throw new Error('Failed to get MCP paths');
  return await res.json();
}

// ============================================
// 文件夹选择（浏览器不支持，需要手动输入）
// ============================================

export async function selectDirectory(): Promise<string | null> {
  // 浏览器环境无法直接选择文件夹，返回 null 让用户手动输入
  return null;
}
