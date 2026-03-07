<template>
  <div class="callback-view">
    <el-icon class="is-loading" :size="32"><Loading /></el-icon>
    <p>{{ t('common.loading') }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Loading } from '@element-plus/icons-vue';

const { t } = useI18n();
const router = useRouter();

onMounted(() => {
  // In production: handle Logto callback, extract tokens, set user
  // Placeholder: redirect to dashboard
  router.replace('/');
});
</script>

<style scoped>
.callback-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--el-text-color-secondary);
}
</style>
