import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  readMcpConfig,
  writeMcpConfig,
  addMcpServer,
  removeMcpServer,
  getMcpConfigPaths,
  checkApiAvailable,
  isApiAvailable,
} from "@/utils/api";
import type { McpServer, McpConfig } from "@/utils/api";

export interface McpServerWithStatus {
  id: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  status: "running" | "stopped" | "error";
  description?: string;
}

export const useMcpStore = defineStore("mcp", () => {
  const configPath = ref<string>("");
  const platform = ref<string>("claude-desktop");
  const servers = ref<McpServerWithStatus[]>([]);
  const availablePlatforms = ref<Array<{ name: string; path: string; exists?: boolean }>>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const runningServers = computed(() => servers.value.filter((s) => s.status === "running"));
  const stoppedServers = computed(() => servers.value.filter((s) => s.status === "stopped"));
  const errorServers = computed(() => servers.value.filter((s) => s.status === "error"));

  async function loadAvailablePlatforms() {
    await checkApiAvailable();
    if (!isApiAvailable()) {
      availablePlatforms.value = [
        { name: "Claude Desktop", path: "%APPDATA%/Claude/claude_desktop_config.json", exists: false },
        { name: "Cursor", path: "~/.cursor/mcp.json", exists: false },
        { name: "Cline", path: "%APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json", exists: false },
        { name: "Roo Code", path: "%APPDATA%/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json", exists: false },
        { name: "Kiro", path: "~/.kiro/settings/mcp.json", exists: false },
      ];
      return;
    }
    try {
      availablePlatforms.value = await getMcpConfigPaths();
    } catch (e) {
      console.error("Failed to load platform paths:", e);
    }
  }


  async function setConfigPath(path: string) {
    configPath.value = path;
    if (path) await loadConfig();
    else servers.value = [];
  }

  async function setPlatform(platformName: string) {
    platform.value = platformName;
    const platformConfig = availablePlatforms.value.find(
      (p) => p.name === platformName || p.name.toLowerCase().replace(" ", "-") === platformName
    );
    if (platformConfig) await setConfigPath(platformConfig.path);
  }

  async function loadConfig() {
    if (!configPath.value) {
      error.value = "Config path not set";
      return;
    }
    if (!isApiAvailable()) {
      loadMockData();
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      const config = await readMcpConfig(configPath.value);
      servers.value = Object.entries(config.mcpServers).map(([name, srv], index) => ({
        id: `server_${index + 1}`,
        name,
        command: srv.command,
        args: srv.args,
        env: srv.env,
        status: "stopped" as const,
        description: getServerDescription(name),
      }));
    } catch (e) {
      if (String(e).includes("Failed to read")) {
        servers.value = [];
      } else {
        error.value = `Failed to load MCP config: ${e}`;
      }
    } finally {
      loading.value = false;
    }
  }

  async function saveConfig() {
    if (!configPath.value || !isApiAvailable()) return;
    const config: McpConfig = { mcpServers: {} };
    for (const srv of servers.value) {
      config.mcpServers[srv.name] = { command: srv.command, args: srv.args, env: srv.env };
    }
    try {
      await writeMcpConfig(configPath.value, config);
    } catch (e) {
      error.value = `Failed to save MCP config: ${e}`;
      throw e;
    }
  }

  async function addNewServer(name: string, server: McpServer, description?: string) {
    if (!isApiAvailable()) {
      servers.value.push({
        id: `server_${Date.now()}`,
        name,
        command: server.command,
        args: server.args,
        env: server.env,
        status: "stopped",
        description,
      });
      return;
    }
    try {
      await addMcpServer(configPath.value, name, server);
      await loadConfig();
    } catch (e) {
      error.value = `Failed to add server: ${e}`;
      throw e;
    }
  }

  async function removeServerByName(name: string) {
    if (!isApiAvailable()) {
      servers.value = servers.value.filter((s) => s.name !== name);
      return;
    }
    try {
      await removeMcpServer(configPath.value, name);
      await loadConfig();
    } catch (e) {
      error.value = `Failed to remove server: ${e}`;
      throw e;
    }
  }

  function setServerStatus(name: string, status: "running" | "stopped" | "error") {
    const server = servers.value.find((s) => s.name === name);
    if (server) server.status = status;
  }

  function getServerDescription(name: string): string {
    const descriptions: Record<string, string> = {
      filesystem: "File system access and operations",
      database: "Database connection and queries",
      postgres: "PostgreSQL database connection",
      github: "GitHub repository operations",
      "web-search": "Web search and content retrieval",
      fetch: "HTTP fetch operations",
      memory: "Memory and context management",
    };
    for (const [key, desc] of Object.entries(descriptions)) {
      if (name.toLowerCase().includes(key)) return desc;
    }
    return "MCP Server";
  }

  function loadMockData() {
    servers.value = [
      { id: "1", name: "filesystem", command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem"], status: "running", description: "File system access" },
      { id: "2", name: "github", command: "npx", args: ["-y", "@modelcontextprotocol/server-github"], status: "stopped", description: "GitHub operations" },
    ];
  }

  return {
    configPath, platform, servers, availablePlatforms, loading, error,
    runningServers, stoppedServers, errorServers,
    loadAvailablePlatforms, setConfigPath, setPlatform, loadConfig, saveConfig,
    addNewServer, removeServerByName, setServerStatus, loadMockData,
  };
});
