<template>
  <div class="login-view">
    <div class="login-card">
      <h1 class="login-title">{{ t('auth.loginTitle') }}</h1>
      <p class="login-desc">{{ t('auth.loginDesc') }}</p>
      <el-form :model="form" label-position="top">
        <el-form-item :label="t('auth.username')">
          <el-input v-model="form.displayName" :placeholder="t('auth.usernamePlaceholder')" @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item :label="t('auth.password')">
          <el-input v-model="form.password" type="password" show-password :placeholder="t('auth.passwordPlaceholder')" @keyup.enter="handleLogin" />
        </el-form-item>
        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        <el-button type="primary" size="large" :loading="isLoading" style="width:100%" @click="handleLogin">
          {{ t('common.login') }}
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAdminAuthStore } from '@/stores/auth';
import { post } from '@/api/client';

const ADMIN_ROLES = ['admin', 'support_agent', 'trainer'];

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const authStore = useAdminAuthStore();
const isLoading = ref(false);
const errorMsg = ref('');
const form = reactive({ displayName: '', password: '' });

async function handleLogin(): Promise<void> {
  errorMsg.value = '';
  if (!form.displayName || !form.password) {
    errorMsg.value = '请输入用户名和密码';
    return;
  }
  isLoading.value = true;
  try {
    const res = await post<{ token: string; user: any }>('/auth/login', {
      displayName: form.displayName,
      password: form.password,
    });
    if (!ADMIN_ROLES.includes(res.user.role)) {
      errorMsg.value = '权限不足，仅管理员/客服/培训师可登录后台';
      return;
    }
    localStorage.setItem('oc_admin_token', res.token);
    localStorage.setItem('oc_admin_user', JSON.stringify(res.user));
    authStore.setUser({
      sub: res.user.id,
      name: res.user.displayName,
      roles: [res.user.role],
    });
    const redirect = (route.query.redirect as string) || '/';
    router.push(redirect);
  } catch (e: any) {
    errorMsg.value = e?.data?.message || e?.message || '登录失败';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.login-view {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-blank);
}
.login-card {
  text-align: center;
  padding: 48px;
  border-radius: 12px;
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
  max-width: 400px;
  width: 100%;
}
.login-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--oc-primary);
}
.login-desc {
  color: var(--el-text-color-secondary);
  margin-bottom: 32px;
}
.error-msg {
  color: var(--el-color-danger);
  font-size: 13px;
  margin-bottom: 12px;
}
</style>
