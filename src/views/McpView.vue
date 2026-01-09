<template>
  <div class="mcp-panel">
    <!-- 头部 -->
    <div class="panel-header">
      <div class="header-content">
        <div>
          <h2 class="header-title">{{ t('mcp.title') }}</h2>
          <p class="header-subtitle">{{ t('mcp.subtitle') }}</p>
        </div>
        <button class="btn-add" @click="showAddDialog = true">
          <Plus class="btn-icon" />
          {{ t('mcp.addServer') }}
        </button>
      </div>

      <div class="header-toolbar">
        <div class="platform-selector">
          <span class="selector-label">{{ t('mcp.platform') }}</span>
          <select v-model="selectedPlatform" class="platform-select" @change="onPlatformChange">
            <option v-for="p in mcpStore.availablePlatforms" :key="p.name" :value="p.name">
              {{ p.name }} {{ p.exists ? '✓' : '' }}
            </option>
            <option value="custom">{{ t('mcp.customPath') }}</option>
          </select>
        </div>
        <div class="config-path">
          <input
            v-if="selectedPlatform === 'custom'"
            v-model="customPath"
            type="text"
            class="path-input"
            :placeholder="t('mcp.enterPath')"
            @keydown.enter="loadCustomPath"
          />
          <span v-else class="path-text">{{ mcpStore.configPath || t('mcp.noPath') }}</span>
          <button v-if="selectedPlatform === 'custom'" class="load-btn" @click="loadCustomPath">
            {{ t('mcp.load') }}
          </button>
          <button class="copy-btn" @click="copyPath" :disabled="!mcpStore.configPath">
            <Copy class="copy-icon" />
          </button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="mcpStore.loading" class="loading-state">
      <Loader2 class="loading-icon" />
      <span>{{ t('mcp.loading') }}</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="mcpStore.error" class="error-state">
      <AlertCircle class="error-icon" />
      <span>{{ mcpStore.error }}</span>
      <button class="btn-retry" @click="mcpStore.loadConfig()">{{ t('mcp.retry') }}</button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="mcpStore.servers.length === 0" class="empty-state">
      <Server class="empty-icon" />
      <h3 class="empty-title">{{ t('mcp.noServers') }}</h3>
      <p class="empty-description">{{ t('mcp.noServersDesc') }}</p>
      <button class="btn-add-empty" @click="showAddDialog = true">
        <Plus class="btn-icon" />
        {{ t('mcp.addServer') }}
      </button>
    </div>

    <!-- 服务器列表 -->
    <div v-else class="servers-container">
      <div class="servers-grid">
        <div v-for="server in mcpStore.servers" :key="server.id" class="server-card">
          <div class="card-header">
            <div class="server-info">
              <h3 class="server-name">{{ server.name }}</h3>
              <span class="server-type">stdio</span>
            </div>
          </div>

          <p v-if="server.description" class="server-description">{{ server.description }}</p>

          <div class="server-status">
            <span class="status-dot" :class="server.status"></span>
            <span class="status-text">{{ getStatusText(server.status) }}</span>
          </div>

          <div class="server-command">
            <code>{{ server.command }} {{ server.args?.join(' ') || '' }}</code>
          </div>

          <div class="card-actions">
            <template v-if="server.status === 'running'">
              <button class="action-btn flex-1" @click="stopServer(server.name)">
                <Square class="action-icon" />
                {{ t('mcp.stop') }}
              </button>
            </template>
            <template v-else-if="server.status === 'error'">
              <button class="action-btn flex-1" @click="restartServer(server.name)">
                <RefreshCw class="action-icon" />
                {{ t('mcp.restart') }}
              </button>
              <button class="action-btn" @click="viewLogs(server.name)">
                <FileText class="action-icon" />
                {{ t('mcp.logs') }}
              </button>
            </template>
            <template v-else>
              <button class="action-btn primary flex-1" @click="startServer(server.name)">
                <Play class="action-icon" />
                {{ t('mcp.start') }}
              </button>
            </template>
            <button class="action-btn icon" @click="editServer(server)">
              <Settings class="action-icon" />
            </button>
            <button class="action-btn icon destructive" @click="confirmDeleteServer(server)">
              <Trash2 class="action-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑服务器对话框 -->
    <div v-if="showAddDialog || editingServer" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h3 class="dialog-title">{{ editingServer ? t('mcp.editServer') : t('mcp.addNewServer') }}</h3>
          <button class="dialog-close" @click="closeDialog">
            <X class="close-icon" />
          </button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label class="form-label" for="server-name">{{ t('mcp.serverName') }}</label>
            <input id="server-name" v-model="serverForm.name" type="text" class="form-input" placeholder="e.g., filesystem" :disabled="!!editingServer" />
          </div>
          <div class="form-group">
            <label class="form-label" for="server-command">{{ t('mcp.command') }}</label>
            <input id="server-command" v-model="serverForm.command" type="text" class="form-input" placeholder="e.g., npx" />
          </div>
          <div class="form-group">
            <label class="form-label" for="server-args">{{ t('mcp.arguments') }}</label>
            <textarea id="server-args" v-model="serverForm.argsText" class="form-textarea" placeholder="-y&#10;@modelcontextprotocol/server-filesystem&#10;/path/to/files" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="server-description">{{ t('mcp.description') }}</label>
            <input id="server-description" v-model="serverForm.description" type="text" class="form-input" placeholder="Brief description of the server" />
          </div>
        </div>
        <div class="dialog-actions">
          <button class="btn-secondary" @click="closeDialog">{{ t('common.cancel') }}</button>
          <button class="btn-primary" @click="saveServer" :disabled="!isFormValid">
            {{ editingServer ? t('mcp.saveChanges') : t('mcp.addServer') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="serverToDelete" class="dialog-overlay" @click.self="serverToDelete = null">
      <div class="dialog dialog-sm">
        <div class="dialog-header">
          <h3 class="dialog-title">{{ t('mcp.deleteServer') }}</h3>
          <button class="dialog-close" @click="serverToDelete = null">
            <X class="close-icon" />
          </button>
        </div>
        <div class="dialog-content">
          <p class="confirm-text" v-html="t('mcp.confirmDeleteServer', { name: serverToDelete.name })"></p>
        </div>
        <div class="dialog-actions">
          <button class="btn-secondary" @click="serverToDelete = null">{{ t('common.cancel') }}</button>
          <button class="btn-destructive" @click="deleteServer">{{ t('common.delete') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Plus, Copy, Play, Square, Settings, Trash2, FileText, RefreshCw, X, Loader2, AlertCircle, Server } from "lucide-vue-next";
import { useMcpStore, type McpServerWithStatus } from "@/stores/mcp";
import { useI18n } from "@/i18n";

const mcpStore = useMcpStore();
const { t } = useI18n();

const selectedPlatform = ref("Claude Desktop");
const customPath = ref("");
const showAddDialog = ref(false);
const editingServer = ref<McpServerWithStatus | null>(null);
const serverToDelete = ref<McpServerWithStatus | null>(null);

const serverForm = ref({ name: "", command: "", argsText: "", description: "" });

const isFormValid = computed(() => serverForm.value.name.trim() !== "" && serverForm.value.command.trim() !== "");

onMounted(async () => {
  await mcpStore.loadAvailablePlatforms();
  if (mcpStore.availablePlatforms.length > 0) {
    selectedPlatform.value = mcpStore.availablePlatforms[0].name;
    await mcpStore.setPlatform(selectedPlatform.value);
  }
});

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = { running: t('mcp.running'), stopped: t('mcp.stopped'), error: t('mcp.error') };
  return statusMap[status] || status;
};

const onPlatformChange = async () => {
  if (selectedPlatform.value === "custom") return;
  await mcpStore.setPlatform(selectedPlatform.value);
};

const loadCustomPath = async () => {
  if (customPath.value.trim()) await mcpStore.setConfigPath(customPath.value.trim());
};

const copyPath = () => {
  if (mcpStore.configPath) navigator.clipboard.writeText(mcpStore.configPath);
};

const startServer = (name: string) => mcpStore.setServerStatus(name, "running");
const stopServer = (name: string) => mcpStore.setServerStatus(name, "stopped");
const restartServer = (name: string) => mcpStore.setServerStatus(name, "running");
const viewLogs = (name: string) => console.log("View logs for", name);

const editServer = (server: McpServerWithStatus) => {
  editingServer.value = server;
  serverForm.value = { name: server.name, command: server.command, argsText: server.args?.join("\n") || "", description: server.description || "" };
};

const confirmDeleteServer = (server: McpServerWithStatus) => { serverToDelete.value = server; };

const deleteServer = async () => {
  if (serverToDelete.value) {
    await mcpStore.removeServerByName(serverToDelete.value.name);
    serverToDelete.value = null;
  }
};

const closeDialog = () => {
  showAddDialog.value = false;
  editingServer.value = null;
  serverForm.value = { name: "", command: "", argsText: "", description: "" };
};

const saveServer = async () => {
  const args = serverForm.value.argsText.split("\n").map((arg) => arg.trim()).filter((arg) => arg !== "");
  if (editingServer.value) await mcpStore.removeServerByName(editingServer.value.name);
  await mcpStore.addNewServer(serverForm.value.name, { command: serverForm.value.command, args }, serverForm.value.description);
  closeDialog();
};
</script>

<style lang="scss" scoped>
.mcp-panel { display: flex; flex-direction: column; height: 100%; background-color: var(--background); }
.panel-header { padding: var(--space-6); border-bottom: 1px solid var(--border); background-color: var(--card); }
.header-content { display: flex; align-items: flex-start; justify-content: space-between; }
.header-title { font-size: 18px; font-weight: 600; color: var(--foreground); margin: 0; }
.header-subtitle { font-size: 14px; color: var(--muted-foreground); margin: var(--space-1) 0 0; }

.btn-add {
  display: inline-flex; align-items: center; gap: var(--space-2); padding: 0 var(--space-4); height: 40px;
  background-color: var(--primary); color: var(--primary-foreground); border: none; border-radius: var(--radius-lg);
  font-size: 14px; font-weight: 500; cursor: pointer; transition: opacity var(--duration-fast) var(--ease-default);
  &:hover { opacity: 0.9; }
  .btn-icon { width: 16px; height: 16px; }
}

.header-toolbar { display: flex; align-items: center; gap: var(--space-4); margin-top: var(--space-4); }
.platform-selector { display: flex; align-items: center; gap: var(--space-2); }
.selector-label { font-size: 14px; color: var(--muted-foreground); }
.platform-select {
  height: 36px; padding: 0 var(--space-3); background-color: var(--background); border: 1px solid var(--border);
  border-radius: var(--radius-lg); font-size: 14px; color: var(--foreground); cursor: pointer;
  &:focus { outline: none; border-color: var(--ring); }
}

.config-path { display: flex; align-items: center; gap: var(--space-2); flex: 1; }
.path-input {
  flex: 1; height: 32px; padding: 0 var(--space-3); background-color: var(--background); border: 1px solid var(--border);
  border-radius: var(--radius-lg); font-size: 12px; font-family: var(--font-mono); color: var(--foreground);
  &::placeholder { color: var(--muted-foreground); }
  &:focus { outline: none; border-color: var(--ring); }
}
.load-btn {
  padding: 0 var(--space-3); height: 32px; background-color: var(--primary); color: var(--primary-foreground);
  border: none; border-radius: var(--radius-lg); font-size: 12px; cursor: pointer;
  &:hover { opacity: 0.9; }
}
.path-text { font-size: 12px; color: var(--muted-foreground); font-family: var(--font-mono); }
.copy-btn {
  display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: transparent;
  border: none; border-radius: var(--radius-sm); cursor: pointer; color: var(--muted-foreground);
  transition: all var(--duration-fast) var(--ease-default);
  &:hover:not(:disabled) { background-color: var(--accent); color: var(--foreground); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  .copy-icon { width: 12px; height: 12px; }
}

.loading-state {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--space-3); color: var(--muted-foreground);
  .loading-icon { width: 32px; height: 32px; animation: spin 1s linear infinite; }
}
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.error-state {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--space-3); color: var(--destructive);
  .error-icon { width: 32px; height: 32px; }
}
.btn-retry {
  padding: var(--space-2) var(--space-4); background-color: var(--primary); color: var(--primary-foreground);
  border: none; border-radius: var(--radius-lg); font-size: 14px; cursor: pointer;
  &:hover { opacity: 0.9; }
}

.empty-state {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: var(--space-6);
  .empty-icon { width: 64px; height: 64px; color: var(--muted-foreground); margin-bottom: var(--space-4); }
  .empty-title { font-size: 18px; font-weight: 500; color: var(--foreground); margin: 0 0 var(--space-2); }
  .empty-description { font-size: 14px; color: var(--muted-foreground); margin: 0 0 var(--space-4); }
}
.btn-add-empty {
  display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4);
  background-color: var(--primary); color: var(--primary-foreground); border: none; border-radius: var(--radius-lg);
  font-size: 14px; font-weight: 500; cursor: pointer;
  &:hover { opacity: 0.9; }
  .btn-icon { width: 16px; height: 16px; }
}

.servers-container { flex: 1; overflow-y: auto; padding: var(--space-6); }
.servers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: var(--space-4); }
.server-card {
  background-color: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg);
  padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4);
  transition: border-color var(--duration-fast) var(--ease-default);
  &:hover { border-color: oklch(0.65 0.22 270 / 0.5); }
}
.card-header { display: flex; align-items: flex-start; justify-content: space-between; }
.server-info { display: flex; align-items: center; gap: var(--space-2); }
.server-name { font-size: 16px; font-weight: 600; color: var(--foreground); margin: 0; }
.server-type {
  display: inline-flex; padding: 2px 8px; background-color: var(--secondary); border-radius: var(--radius-full);
  font-size: 12px; font-family: var(--font-mono); color: var(--secondary-foreground);
}
.server-description { font-size: 14px; color: var(--muted-foreground); margin: 0; }
.server-status { display: flex; align-items: center; gap: var(--space-2); }
.status-dot {
  width: 8px; height: 8px; border-radius: var(--radius-full); animation: pulse 2s infinite;
  &.running { background-color: var(--success); }
  &.stopped { background-color: var(--muted-foreground); animation: none; }
  &.error { background-color: var(--destructive); }
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.status-text { font-size: 14px; font-weight: 500; color: var(--foreground); }
.server-command {
  background-color: oklch(0.22 0 0 / 0.5); border-radius: var(--radius-md); padding: var(--space-3);
  code { font-size: 12px; font-family: var(--font-mono); color: var(--muted-foreground); word-break: break-all; }
}
.card-actions { display: flex; align-items: center; gap: var(--space-2); padding-top: var(--space-2); }
.action-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); padding: 0 var(--space-3);
  height: 32px; background: transparent; border: 1px solid var(--border); border-radius: var(--radius-lg);
  font-size: 13px; color: var(--foreground); cursor: pointer; transition: all var(--duration-fast) var(--ease-default);
  &:hover { background-color: var(--accent); border-color: var(--accent); }
  &.primary { background-color: var(--primary); border-color: var(--primary); color: var(--primary-foreground); &:hover { opacity: 0.9; } }
  &.icon { width: 32px; padding: 0; }
  &.destructive { color: var(--destructive); &:hover { background-color: oklch(0.55 0.22 25 / 0.1); border-color: var(--destructive); } }
  .action-icon { width: 14px; height: 14px; }
}
.flex-1 { flex: 1; }

.dialog-overlay { position: fixed; inset: 0; background-color: oklch(0 0 0 / 0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.dialog {
  background-color: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg);
  width: 100%; max-width: 480px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;
  &.dialog-sm { max-width: 400px; }
}
.dialog-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--border); }
.dialog-title { font-size: 16px; font-weight: 600; color: var(--foreground); margin: 0; }
.dialog-close {
  display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: transparent;
  border: none; border-radius: var(--radius-md); cursor: pointer; color: var(--muted-foreground);
  &:hover { background-color: var(--accent); color: var(--foreground); }
  .close-icon { width: 16px; height: 16px; }
}
.dialog-content { padding: var(--space-6); overflow-y: auto; }
.form-group { margin-bottom: var(--space-4); &:last-child { margin-bottom: 0; } }
.form-label { display: block; font-size: 14px; font-weight: 500; color: var(--foreground); margin-bottom: var(--space-2); }
.form-input, .form-textarea {
  width: 100%; padding: var(--space-2) var(--space-3); background-color: var(--background); border: 1px solid var(--border);
  border-radius: var(--radius-lg); font-size: 14px; color: var(--foreground);
  &::placeholder { color: var(--muted-foreground); }
  &:focus { outline: none; border-color: var(--ring); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.form-input { height: 40px; }
.form-textarea { resize: vertical; font-family: var(--font-mono); }
.dialog-actions { display: flex; justify-content: flex-end; gap: var(--space-2); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--border); }

.btn-primary, .btn-secondary, .btn-destructive {
  display: inline-flex; align-items: center; justify-content: center; padding: 0 var(--space-4); height: 36px;
  border-radius: var(--radius-lg); font-size: 14px; font-weight: 500; cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}
.btn-primary { background-color: var(--primary); color: var(--primary-foreground); border: none; &:hover:not(:disabled) { opacity: 0.9; } &:disabled { opacity: 0.5; cursor: not-allowed; } }
.btn-secondary { background: transparent; color: var(--foreground); border: 1px solid var(--border); &:hover { background-color: var(--accent); border-color: var(--accent); } }
.btn-destructive { background-color: var(--destructive); color: white; border: none; &:hover { opacity: 0.9; } }
.confirm-text { font-size: 14px; color: var(--foreground); margin: 0; line-height: 1.5; strong { font-weight: 600; } }
</style>
