import { invoke } from "@tauri-apps/api/core";

// ============================================
// Types
// ============================================

export interface SkillFile {
  id: string;
  name: string;
  path: string;
  type: "markdown" | "json" | "yaml";
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
}

// ============================================
// Settings API
// ============================================

export async function loadSettings(): Promise<AppSettings> {
  try {
    const settings = await invoke<{
      skills_path: string;
      mcp_config_path: string;
      theme: string;
      language: string;
      ai_provider: string;
      ai_model: string;
    }>("load_settings");
    
    return {
      skillsPath: settings.skills_path,
      mcpConfigPath: settings.mcp_config_path,
      theme: settings.theme,
      language: settings.language,
      aiProvider: settings.ai_provider,
      aiModel: settings.ai_model,
    };
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
  await invoke("save_settings", {
    settings: {
      skills_path: settings.skillsPath,
      mcp_config_path: settings.mcpConfigPath,
      theme: settings.theme,
      language: settings.language,
      ai_provider: settings.aiProvider,
      ai_model: settings.aiModel,
    },
  });
}

// ============================================
// Skills API
// ============================================

export async function readSkillsDirectory(
  path: string
): Promise<{ folders: SkillFolder[]; files: SkillFile[] }> {
  const result = await invoke<[
    Array<{ id: string; name: string; path: string; parent_id: string | null }>,
    Array<{
      id: string;
      name: string;
      path: string;
      type: string;
      content: string;
      folder_id: string | null;
    }>
  ]>("read_skills_directory", { path });

  const [rawFolders, rawFiles] = result;

  const folders: SkillFolder[] = rawFolders.map((f) => ({
    id: f.id,
    name: f.name,
    path: f.path,
    parentId: f.parent_id,
  }));

  const files: SkillFile[] = rawFiles.map((f) => ({
    id: f.id,
    name: f.name,
    path: f.path,
    type: f.type as "markdown" | "json" | "yaml",
    content: f.content,
    folderId: f.folder_id,
  }));

  return { folders, files };
}

export async function readFileContent(path: string): Promise<string> {
  return await invoke<string>("read_file_content", { path });
}

export async function writeFileContent(
  path: string,
  content: string
): Promise<void> {
  await invoke("write_file_content", { path, content });
}

export async function createSkillFile(
  folderPath: string,
  fileName: string,
  content: string
): Promise<string> {
  return await invoke<string>("create_skill_file", {
    folderPath,
    fileName,
    content,
  });
}

export async function createSkillFolder(
  parentPath: string,
  folderName: string
): Promise<string> {
  return await invoke<string>("create_skill_folder", {
    parentPath,
    folderName,
  });
}

export async function deleteSkillItem(path: string): Promise<void> {
  await invoke("delete_skill_item", { path });
}

// ============================================
// MCP Config API
// ============================================

export async function readMcpConfig(path: string): Promise<McpConfig> {
  const result = await invoke<{ mcpServers: Record<string, McpServer> }>(
    "read_mcp_config",
    { path }
  );
  return result;
}

export async function writeMcpConfig(
  path: string,
  config: McpConfig
): Promise<void> {
  await invoke("write_mcp_config", { path, config });
}

export async function addMcpServer(
  path: string,
  name: string,
  server: McpServer
): Promise<void> {
  await invoke("add_mcp_server", { path, name, server });
}

export async function removeMcpServer(
  path: string,
  name: string
): Promise<void> {
  await invoke("remove_mcp_server", { path, name });
}

export async function getMcpConfigPaths(): Promise<
  Array<{ name: string; path: string }>
> {
  const result = await invoke<Array<[string, string]>>("get_mcp_config_paths");
  return result.map(([name, path]) => ({ name, path }));
}

// ============================================
// File Dialog API
// ============================================

export async function selectDirectory(): Promise<string | null> {
  return await invoke<string | null>("select_directory");
}

// ============================================
// Utility Functions
// ============================================

export function isTauriAvailable(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}
