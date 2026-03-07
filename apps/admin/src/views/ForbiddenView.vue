<template>
  <div class="forbidden-view">
    <h1 class="sr-only">{{ t('common.forbidden') }}</h1>
    <el-result icon="warning" :title="t('common.forbidden')" :sub-title="t('auth.noPermission')">
      <template #extra>
        <el-button type="primary" @click="router.push('/')">{{ t('common.back') }}</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const router = useRouter();
</script>

<style scoped>
.forbidden-view {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
