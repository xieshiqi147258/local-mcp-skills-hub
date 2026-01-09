import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  readSkillsDirectory,
  readFileContent,
  writeFileContent,
  createSkillFile,
  createSkillFolder,
  deleteSkillItem,
  copyItem,
  moveItem,
  checkApiAvailable,
  isApiAvailable,
  type SkillFile,
  type SkillFolder,
} from "@/utils/api";

export type { SkillFile, SkillFolder };

// localStorage key for skills paths
export const SKILLS_PATHS_STORAGE_KEY = "skills_paths";

// Interface for skill path configuration
export interface SkillPath {
  path: string;
  active: boolean;
}

// Interface for stored skills paths data
export interface StoredSkillsPaths {
  paths: SkillPath[];
  lastUpdated?: string;
}

// Helper functions for localStorage operations (exported for testing)
export function savePathsToStorage(paths: SkillPath[]): void {
  const data: StoredSkillsPaths = {
    paths,
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem(SKILLS_PATHS_STORAGE_KEY, JSON.stringify(data));
}

export function readPathsFromStorage(): SkillPath[] {
  try {
    const stored = localStorage.getItem(SKILLS_PATHS_STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    // Handle both old format (array) and new format (object with paths)
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && Array.isArray(parsed.paths)) {
      return parsed.paths;
    }
    return [];
  } catch (e) {
    console.error("Failed to parse skills paths from localStorage:", e);
    return [];
  }
}

export const useSkillsStore = defineStore("skills", () => {
  // State
  const skillsPath = ref<string>("");
  const skillsPaths = ref<SkillPath[]>([]);
  const activePathIndex = ref<number>(0);
  const folders = ref<SkillFolder[]>([]);
  const files = ref<SkillFile[]>([]);
  const selectedSkill = ref<SkillFile | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Highlighted file path for AI-edited files (Requirement 14.7)
  const highlightedFilePath = ref<string | null>(null);
  const highlightTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

  // Getters
  const rootFolders = computed(() => {
    return folders.value.filter((f) => f.parentId === null);
  });

  const getSkillsInFolder = (folderId: string | null) => {
    return files.value.filter((f) => f.folderId === folderId);
  };

  const getSubFolders = (parentId: string | null) => {
    return folders.value.filter((f) => f.parentId === parentId);
  };

  // Computed: check if there's at least one valid active path
  const hasValidPath = computed(() => {
    return skillsPaths.value.some((p) => p.active && p.path);
  });

  // Get the first active path
  const activePath = computed(() => {
    const active = skillsPaths.value.find((p) => p.active && p.path);
    return active?.path || "";
  });

  // Actions
  
  /**
   * Load skills paths from localStorage
   * Reads the skills_paths key, parses JSON, and sets to skillsPaths state
   * If there are active paths, automatically calls loadSkills
   * Requirements: 1.1, 1.2
   */
  function loadPathsFromStorage(): void {
    const paths = readPathsFromStorage();
    skillsPaths.value = paths;
    
    // Set skillsPath to the first active path for backward compatibility
    const firstActive = paths.find((p) => p.active && p.path);
    if (firstActive) {
      skillsPath.value = firstActive.path;
      // Auto-load skills if there's an active path
      loadSkills();
    }
  }
  async function setSkillsPath(path: string) {
    skillsPath.value = path;
    if (path) {
      await loadSkills();
    } else {
      folders.value = [];
      files.value = [];
      selectedSkill.value = null;
    }
  }

  async function loadSkills() {
    if (!skillsPath.value) {
      error.value = "Skills path not set";
      return;
    }

    await checkApiAvailable();
    
    if (!isApiAvailable()) {
      loadMockData();
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const result = await readSkillsDirectory(skillsPath.value);
      folders.value = result.folders;
      files.value = result.files;
    } catch (e) {
      error.value = `Failed to load skills: ${e}`;
      console.error(error.value);
    } finally {
      loading.value = false;
    }
  }

  async function selectSkill(skill: SkillFile) {
    selectedSkill.value = skill;

    if (!skill.content && isApiAvailable()) {
      try {
        const content = await readFileContent(skill.path);
        skill.content = content;
        const index = files.value.findIndex((f) => f.id === skill.id);
        if (index !== -1) {
          files.value[index].content = content;
        }
      } catch (e) {
        console.error("Failed to read file content:", e);
      }
    }
  }

  async function saveSkill(skill: SkillFile, content: string) {
    if (!isApiAvailable()) {
      skill.content = content;
      const index = files.value.findIndex((f) => f.id === skill.id);
      if (index !== -1) {
        files.value[index].content = content;
      }
      return;
    }

    try {
      await writeFileContent(skill.path, content);
      skill.content = content;
      const index = files.value.findIndex((f) => f.id === skill.id);
      if (index !== -1) {
        files.value[index].content = content;
      }
    } catch (e) {
      error.value = `Failed to save skill: ${e}`;
      throw e;
    }
  }

  async function createNewFile(
    folderPath: string,
    fileName: string,
    content: string = ""
  ) {
    if (!isApiAvailable()) {
      const newFile: SkillFile = {
        id: `file_${Date.now()}`,
        name: fileName,
        path: `${folderPath}/${fileName}`,
        type: fileName.endsWith(".json")
          ? "json"
          : fileName.endsWith(".yaml") || fileName.endsWith(".yml")
          ? "yaml"
          : "markdown",
        content,
        folderId: folders.value.find((f) => f.path === folderPath)?.id || null,
      };
      files.value.push(newFile);
      return newFile.path;
    }

    try {
      const path = await createSkillFile(folderPath, fileName, content);
      await loadSkills();
      return path;
    } catch (e) {
      error.value = `Failed to create file: ${e}`;
      throw e;
    }
  }

  async function createNewFolder(parentPath: string, folderName: string) {
    if (!isApiAvailable()) {
      const newFolder: SkillFolder = {
        id: `folder_${Date.now()}`,
        name: folderName,
        path: `${parentPath}/${folderName}`,
        parentId: folders.value.find((f) => f.path === parentPath)?.id || null,
      };
      folders.value.push(newFolder);
      return newFolder.path;
    }

    try {
      const path = await createSkillFolder(parentPath, folderName);
      await loadSkills();
      return path;
    } catch (e) {
      error.value = `Failed to create folder: ${e}`;
      throw e;
    }
  }

  async function deleteItem(path: string) {
    if (!isApiAvailable()) {
      files.value = files.value.filter((f) => f.path !== path);
      folders.value = folders.value.filter((f) => f.path !== path);
      if (selectedSkill.value?.path === path) {
        selectedSkill.value = null;
      }
      return;
    }

    try {
      await deleteSkillItem(path);
      await loadSkills();
      if (selectedSkill.value?.path === path) {
        selectedSkill.value = null;
      }
    } catch (e) {
      error.value = `Failed to delete item: ${e}`;
      throw e;
    }
  }

  // 复制文件或文件夹到目标路径
  async function copyItemToPath(sourcePath: string, destFolderPath: string, itemName: string, isFolder: boolean) {
    const destPath = `${destFolderPath}/${itemName}`.replace(/\\/g, '/');
    
    if (!isApiAvailable()) {
      // Mock 模式下简单处理
      if (isFolder) {
        const newFolder: SkillFolder = {
          id: `folder_${Date.now()}`,
          name: itemName,
          path: destPath,
          parentId: folders.value.find((f) => f.path === destFolderPath)?.id || null,
        };
        folders.value.push(newFolder);
      } else {
        const sourceFile = files.value.find((f) => f.path === sourcePath);
        if (sourceFile) {
          const newFile: SkillFile = {
            ...sourceFile,
            id: `file_${Date.now()}`,
            path: destPath,
            folderId: folders.value.find((f) => f.path === destFolderPath)?.id || null,
          };
          files.value.push(newFile);
        }
      }
      return destPath;
    }

    try {
      const resultPath = await copyItem(sourcePath, destPath, isFolder);
      await loadSkills();
      return resultPath;
    } catch (e) {
      error.value = `Failed to copy item: ${e}`;
      throw e;
    }
  }

  // 移动文件或文件夹到目标路径
  async function moveItemToPath(sourcePath: string, destFolderPath: string, itemName: string) {
    const destPath = `${destFolderPath}/${itemName}`.replace(/\\/g, '/');
    
    if (!isApiAvailable()) {
      // Mock 模式下简单处理
      const file = files.value.find((f) => f.path === sourcePath);
      if (file) {
        file.path = destPath;
        file.folderId = folders.value.find((f) => f.path === destFolderPath)?.id || null;
      }
      const folder = folders.value.find((f) => f.path === sourcePath);
      if (folder) {
        folder.path = destPath;
        folder.parentId = folders.value.find((f) => f.path === destFolderPath)?.id || null;
      }
      return destPath;
    }

    try {
      const resultPath = await moveItem(sourcePath, destPath);
      await loadSkills();
      if (selectedSkill.value?.path === sourcePath) {
        selectedSkill.value = null;
      }
      return resultPath;
    } catch (e) {
      error.value = `Failed to move item: ${e}`;
      throw e;
    }
  }

  async function browseForSkillsPath() {
    // 浏览器环境不支持文件夹选择，返回 null
    return null;
  }

  function loadMockData() {
    folders.value = [
      { id: "1", name: "Claude Code Skills", path: "/skills/Claude Code Skills", parentId: null },
      { id: "2", name: "MCP Configs", path: "/skills/MCP Configs", parentId: null },
    ];

    files.value = [
      {
        id: "1",
        name: "code-review.md",
        path: "/skills/Claude Code Skills/code-review.md",
        type: "markdown",
        folderId: "1",
        content: `# Code Review\n\n## Description\nReview code for quality, security, and best practices.\n\n## Instructions\n1. Analyze code structure\n2. Check for security issues\n3. Suggest improvements`,
      },
      {
        id: "2",
        name: "git-commit.md",
        path: "/skills/Claude Code Skills/git-commit.md",
        type: "markdown",
        folderId: "1",
        content: `# Git Commit Message Generator\n\n## Description\nGenerate commit messages following Conventional Commits.`,
      },
      {
        id: "3",
        name: "filesystem-server.json",
        path: "/skills/MCP Configs/filesystem-server.json",
        type: "json",
        folderId: "2",
        content: `{\n  "mcpServers": {\n    "filesystem": {\n      "command": "npx",\n      "args": ["-y", "@modelcontextprotocol/server-filesystem"]\n    }\n  }\n}`,
      },
    ];
  }

  /**
   * Highlight a file in the Skills tree after AI operations (Requirement 14.7)
   * The highlight will automatically clear after 5 seconds
   * @param filePath The path of the file to highlight
   */
  function highlightFile(filePath: string): void {
    // Clear any existing timeout
    if (highlightTimeout.value) {
      clearTimeout(highlightTimeout.value);
      highlightTimeout.value = null;
    }
    
    // Normalize the path for comparison
    const normalizedPath = filePath.replace(/\\/g, '/');
    highlightedFilePath.value = normalizedPath;
    
    // Auto-clear highlight after 5 seconds
    highlightTimeout.value = setTimeout(() => {
      highlightedFilePath.value = null;
      highlightTimeout.value = null;
    }, 5000);
  }

  /**
   * Clear the highlighted file
   */
  function clearHighlight(): void {
    if (highlightTimeout.value) {
      clearTimeout(highlightTimeout.value);
      highlightTimeout.value = null;
    }
    highlightedFilePath.value = null;
  }

  /**
   * Check if a file path is currently highlighted
   * @param filePath The path to check
   */
  function isFileHighlighted(filePath: string): boolean {
    if (!highlightedFilePath.value) return false;
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedHighlight = highlightedFilePath.value.replace(/\\/g, '/');
    return normalizedPath === normalizedHighlight;
  }

  /**
   * Get the folder ID for a given file path
   * Used to auto-expand folders containing highlighted files
   */
  function getFolderIdForPath(filePath: string): string | null {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const file = files.value.find(f => f.path.replace(/\\/g, '/') === normalizedPath);
    return file?.folderId || null;
  }

  /**
   * Get all parent folder IDs for a given file path
   * Used to expand the entire path to a highlighted file
   */
  function getParentFolderIds(filePath: string): string[] {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const file = files.value.find(f => f.path.replace(/\\/g, '/') === normalizedPath);
    if (!file || !file.folderId) return [];
    
    const parentIds: string[] = [];
    let currentFolderId: string | null = file.folderId;
    
    while (currentFolderId) {
      parentIds.push(currentFolderId);
      const folder = folders.value.find(f => f.id === currentFolderId);
      currentFolderId = folder?.parentId || null;
    }
    
    return parentIds;
  }

  return {
    skillsPath,
    skillsPaths,
    activePathIndex,
    folders,
    files,
    selectedSkill,
    loading,
    error,
    rootFolders,
    hasValidPath,
    activePath,
    highlightedFilePath,
    getSkillsInFolder,
    getSubFolders,
    loadPathsFromStorage,
    setSkillsPath,
    loadSkills,
    selectSkill,
    saveSkill,
    createNewFile,
    createNewFolder,
    deleteItem,
    copyItemToPath,
    moveItemToPath,
    browseForSkillsPath,
    loadMockData,
    highlightFile,
    clearHighlight,
    isFileHighlighted,
    getFolderIdForPath,
    getParentFolderIds,
  };
});
