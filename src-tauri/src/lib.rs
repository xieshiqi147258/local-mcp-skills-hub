// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize, Deserialize)]
pub struct SkillFile {
    pub id: String,
    pub name: String,
    pub path: String,
    #[serde(rename = "type")]
    pub file_type: String,
    pub content: String,
    pub folder_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SkillFolder {
    pub id: String,
    pub name: String,
    pub path: String,
    pub parent_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct McpServer {
    pub command: String,
    pub args: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub env: Option<std::collections::HashMap<String, String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct McpConfig {
    #[serde(rename = "mcpServers")]
    pub mcp_servers: std::collections::HashMap<String, McpServer>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppSettings {
    pub skills_path: String,
    pub mcp_config_path: String,
    pub theme: String,
    pub language: String,
    pub ai_provider: String,
    pub ai_model: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            skills_path: String::new(),
            mcp_config_path: get_default_mcp_config_path(),
            theme: "dark".to_string(),
            language: "zh-CN".to_string(),
            ai_provider: "anthropic".to_string(),
            ai_model: "claude-3-5-sonnet".to_string(),
        }
    }
}

fn get_default_mcp_config_path() -> String {
    #[cfg(target_os = "windows")]
    {
        if let Some(appdata) = std::env::var_os("APPDATA") {
            let path = PathBuf::from(appdata).join("Claude").join("claude_desktop_config.json");
            return path.to_string_lossy().to_string();
        }
    }
    #[cfg(target_os = "macos")]
    {
        if let Some(home) = std::env::var_os("HOME") {
            let path = PathBuf::from(home)
                .join("Library")
                .join("Application Support")
                .join("Claude")
                .join("claude_desktop_config.json");
            return path.to_string_lossy().to_string();
        }
    }
    #[cfg(target_os = "linux")]
    {
        if let Some(home) = std::env::var_os("HOME") {
            let path = PathBuf::from(home)
                .join(".config")
                .join("claude")
                .join("claude_desktop_config.json");
            return path.to_string_lossy().to_string();
        }
    }
    String::new()
}

fn get_settings_path(app_handle: &tauri::AppHandle) -> PathBuf {
    app_handle
        .path()
        .app_config_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("settings.json")
}

// ============================================
// Settings Commands
// ============================================

#[tauri::command]
pub fn load_settings(app_handle: tauri::AppHandle) -> Result<AppSettings, String> {
    let settings_path = get_settings_path(&app_handle);
    
    if settings_path.exists() {
        let content = fs::read_to_string(&settings_path)
            .map_err(|e| format!("Failed to read settings: {}", e))?;
        let settings: AppSettings = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse settings: {}", e))?;
        Ok(settings)
    } else {
        Ok(AppSettings::default())
    }
}

#[tauri::command]
pub fn save_settings(app_handle: tauri::AppHandle, settings: AppSettings) -> Result<(), String> {
    let settings_path = get_settings_path(&app_handle);
    
    // Ensure directory exists
    if let Some(parent) = settings_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create settings directory: {}", e))?;
    }
    
    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    fs::write(&settings_path, content)
        .map_err(|e| format!("Failed to write settings: {}", e))?;
    
    Ok(())
}

// ============================================
// Skills Commands
// ============================================

#[tauri::command]
pub fn read_skills_directory(path: String) -> Result<(Vec<SkillFolder>, Vec<SkillFile>), String> {
    let root_path = Path::new(&path);
    
    if !root_path.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }
    
    let mut folders: Vec<SkillFolder> = Vec::new();
    let mut files: Vec<SkillFile> = Vec::new();
    let mut folder_counter = 0u32;
    let mut file_counter = 0u32;
    
    // Read root directory
    read_directory_recursive(
        root_path,
        &path,
        None,
        &mut folders,
        &mut files,
        &mut folder_counter,
        &mut file_counter,
    )?;
    
    Ok((folders, files))
}

fn read_directory_recursive(
    dir_path: &Path,
    root_path: &str,
    parent_id: Option<String>,
    folders: &mut Vec<SkillFolder>,
    files: &mut Vec<SkillFile>,
    folder_counter: &mut u32,
    file_counter: &mut u32,
) -> Result<(), String> {
    let entries = fs::read_dir(dir_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        
        // Skip hidden files and directories
        if name.starts_with('.') {
            continue;
        }
        
        if path.is_dir() {
            *folder_counter += 1;
            let folder_id = format!("folder_{}", folder_counter);
            
            folders.push(SkillFolder {
                id: folder_id.clone(),
                name: name.clone(),
                path: path.to_string_lossy().to_string(),
                parent_id: parent_id.clone(),
            });
            
            // Recursively read subdirectory
            read_directory_recursive(
                &path,
                root_path,
                Some(folder_id),
                folders,
                files,
                folder_counter,
                file_counter,
            )?;
        } else if path.is_file() {
            // Check if it's a supported file type
            let extension = path.extension()
                .and_then(|e| e.to_str())
                .unwrap_or("");
            
            let file_type = match extension {
                "md" | "markdown" => "markdown",
                "json" => "json",
                "yaml" | "yml" => "yaml",
                _ => continue, // Skip unsupported files
            };
            
            *file_counter += 1;
            let file_id = format!("file_{}", file_counter);
            
            // Read file content
            let content = fs::read_to_string(&path)
                .unwrap_or_else(|_| String::new());
            
            files.push(SkillFile {
                id: file_id,
                name,
                path: path.to_string_lossy().to_string(),
                file_type: file_type.to_string(),
                content,
                folder_id: parent_id.clone(),
            });
        }
    }
    
    Ok(())
}

#[tauri::command]
pub fn read_file_content(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub fn write_file_content(path: String, content: String) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub fn create_skill_file(folder_path: String, file_name: String, content: String) -> Result<String, String> {
    let file_path = Path::new(&folder_path).join(&file_name);
    
    if file_path.exists() {
        return Err(format!("File already exists: {}", file_path.display()));
    }
    
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn create_skill_folder(parent_path: String, folder_name: String) -> Result<String, String> {
    let folder_path = Path::new(&parent_path).join(&folder_name);
    
    if folder_path.exists() {
        return Err(format!("Folder already exists: {}", folder_path.display()));
    }
    
    fs::create_dir_all(&folder_path)
        .map_err(|e| format!("Failed to create folder: {}", e))?;
    
    Ok(folder_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn delete_skill_item(path: String) -> Result<(), String> {
    let path = Path::new(&path);
    
    if path.is_dir() {
        fs::remove_dir_all(path)
            .map_err(|e| format!("Failed to delete folder: {}", e))
    } else {
        fs::remove_file(path)
            .map_err(|e| format!("Failed to delete file: {}", e))
    }
}

// ============================================
// MCP Config Commands
// ============================================

#[tauri::command]
pub fn read_mcp_config(path: String) -> Result<McpConfig, String> {
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read MCP config: {}", e))?;
    
    let config: McpConfig = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse MCP config: {}", e))?;
    
    Ok(config)
}

#[tauri::command]
pub fn write_mcp_config(path: String, config: McpConfig) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize MCP config: {}", e))?;
    
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write MCP config: {}", e))
}

#[tauri::command]
pub fn add_mcp_server(path: String, name: String, server: McpServer) -> Result<(), String> {
    let mut config = if Path::new(&path).exists() {
        read_mcp_config(path.clone())?
    } else {
        McpConfig {
            mcp_servers: std::collections::HashMap::new(),
        }
    };
    
    config.mcp_servers.insert(name, server);
    write_mcp_config(path, config)
}

#[tauri::command]
pub fn remove_mcp_server(path: String, name: String) -> Result<(), String> {
    let mut config = read_mcp_config(path.clone())?;
    config.mcp_servers.remove(&name);
    write_mcp_config(path, config)
}

#[tauri::command]
pub fn get_mcp_config_paths() -> Vec<(String, String)> {
    let mut paths = Vec::new();
    
    // Claude Desktop
    #[cfg(target_os = "windows")]
    {
        if let Some(appdata) = std::env::var_os("APPDATA") {
            let path = PathBuf::from(appdata).join("Claude").join("claude_desktop_config.json");
            paths.push(("Claude Desktop".to_string(), path.to_string_lossy().to_string()));
        }
    }
    #[cfg(target_os = "macos")]
    {
        if let Some(home) = std::env::var_os("HOME") {
            let path = PathBuf::from(home)
                .join("Library")
                .join("Application Support")
                .join("Claude")
                .join("claude_desktop_config.json");
            paths.push(("Claude Desktop".to_string(), path.to_string_lossy().to_string()));
        }
    }
    
    // Cursor
    #[cfg(target_os = "windows")]
    {
        if let Some(home) = std::env::var_os("USERPROFILE") {
            let path = PathBuf::from(home).join(".cursor").join("mcp.json");
            paths.push(("Cursor".to_string(), path.to_string_lossy().to_string()));
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        if let Some(home) = std::env::var_os("HOME") {
            let path = PathBuf::from(home).join(".cursor").join("mcp.json");
            paths.push(("Cursor".to_string(), path.to_string_lossy().to_string()));
        }
    }
    
    paths
}

// ============================================
// File Dialog Commands
// ============================================

#[tauri::command]
pub fn select_directory() -> Result<Option<String>, String> {
    use std::process::Command;
    
    #[cfg(target_os = "windows")]
    {
        // Use PowerShell to show folder browser dialog
        let output = Command::new("powershell")
            .args([
                "-Command",
                r#"Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.FolderBrowserDialog; if ($dialog.ShowDialog() -eq 'OK') { $dialog.SelectedPath }"#
            ])
            .output()
            .map_err(|e| format!("Failed to open folder dialog: {}", e))?;
        
        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if path.is_empty() {
            Ok(None)
        } else {
            Ok(Some(path))
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        // For macOS/Linux, use zenity or kdialog if available
        let output = Command::new("zenity")
            .args(["--file-selection", "--directory"])
            .output();
        
        match output {
            Ok(output) => {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if path.is_empty() {
                    Ok(None)
                } else {
                    Ok(Some(path))
                }
            }
            Err(_) => Ok(None),
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Settings
            load_settings,
            save_settings,
            // Skills
            read_skills_directory,
            read_file_content,
            write_file_content,
            create_skill_file,
            create_skill_folder,
            delete_skill_item,
            // MCP Config
            read_mcp_config,
            write_mcp_config,
            add_mcp_server,
            remove_mcp_server,
            get_mcp_config_paths,
            // File Dialog
            select_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
