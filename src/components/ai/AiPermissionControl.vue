<template>
  <div class="permission-control">
    <div class="permission-header">
      <span class="permission-title">{{ t('aiPermission.title') }}</span>
    </div>
    <div class="permission-toggles">
      <div class="permission-item" :title="t('aiPermission.createFolderDesc')">
        <a-switch
          v-model="localPermissions.createFolder"
          size="small"
          @change="(val: string | number | boolean) => handlePermissionChange('createFolder', Boolean(val))"
        />
        <span class="permission-label">{{ t('aiPermission.createFolder') }}</span>
      </div>
      <div class="permission-item" :title="t('aiPermission.createFileDesc')">
        <a-switch
          v-model="localPermissions.createFile"
          size="small"
          @change="(val: string | number | boolean) => handlePermissionChange('createFile', Boolean(val))"
        />
        <span class="permission-label">{{ t('aiPermission.createFile') }}</span>
      </div>
      <div class="permission-item" :title="t('aiPermission.editFileDesc')">
        <a-switch
          v-model="localPermissions.editFile"
          size="small"
          @change="(val: string | number | boolean) => handlePermissionChange('editFile', Boolean(val))"
        />
        <span class="permission-label">{{ t('aiPermission.editFile') }}</span>
      </div>
      <div class="permission-item" :title="t('aiPermission.deleteFileDesc')">
        <a-switch
          v-model="localPermissions.deleteFile"
          size="small"
          @change="(val: string | number | boolean) => handlePermissionChange('deleteFile', Boolean(val))"
        />
        <span class="permission-label">{{ t('aiPermission.deleteFile') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, onMounted } from 'vue';
import { useAiStore, type AiPermissions } from '@/stores/ai';
import { useI18n } from '@/i18n';

const aiStore = useAiStore();
const { t } = useI18n();

// Local reactive copy of permissions for v-model binding
const localPermissions = reactive<AiPermissions>({
  createFolder: false,
  createFile: false,
  editFile: false,
  deleteFile: false,
});

// Emit permission changes to parent
const emit = defineEmits<{
  (e: 'change', permissions: AiPermissions): void;
}>();

// Handle individual permission change
function handlePermissionChange(key: keyof AiPermissions, value: boolean) {
  aiStore.setPermission(key, value);
  emit('change', { ...aiStore.permissions });
}

// Sync local permissions with store on mount
onMounted(() => {
  Object.assign(localPermissions, aiStore.permissions);
});

// Watch store permissions and sync to local
watch(
  () => aiStore.permissions,
  (newPermissions) => {
    Object.assign(localPermissions, newPermissions);
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
.permission-control {
  padding: var(--space-3) var(--space-4);
  background-color: var(--card);
  border-bottom: 1px solid var(--border);
}

.permission-header {
  margin-bottom: var(--space-2);
}

.permission-title {
  font-size: 11px;
  font-weight: 500;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.permission-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.permission-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: default;
}

.permission-label {
  font-size: 12px;
  color: var(--foreground);
  white-space: nowrap;
}
</style>
