import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type AdminRole = 'admin' | 'support_agent' | 'trainer';

export interface AdminUserInfo {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  roles: AdminRole[];
}

export const useAdminAuthStore = defineStore('admin-auth', () => {
  const user = ref<AdminUserInfo | null>(null);
  const isAuthenticated = ref(false);
  const isLoading = ref(false);

  const displayName = computed(() => user.value?.name || user.value?.email || '');
  const userId = computed(() => user.value?.sub || '');
  const roles = computed<AdminRole[]>(() => user.value?.roles || []);

  const isAdmin = computed(() => roles.value.includes('admin'));
  const isSupportAgent = computed(() => roles.value.includes('support_agent'));
  const isTrainer = computed(() => roles.value.includes('trainer'));

  function hasRole(role: AdminRole): boolean {
    return roles.value.includes(role);
  }

  function hasAnyRole(requiredRoles: AdminRole[]): boolean {
    return requiredRoles.some((r) => roles.value.includes(r));
  }

  function init(): void {
    const savedToken = localStorage.getItem('oc_admin_token');
    const savedUser = localStorage.getItem('oc_admin_user');
    if (savedToken && savedUser) {
      try {
        const u = JSON.parse(savedUser);
        user.value = { sub: u.id, name: u.displayName, roles: [u.role] };
        isAuthenticated.value = true;
      } catch { /* ignore */ }
    }
  }

  function setUser(userInfo: AdminUserInfo | null): void {
    user.value = userInfo;
    isAuthenticated.value = !!userInfo;
  }

  function setLoading(loading: boolean): void {
    isLoading.value = loading;
  }

  function clearUser(): void {
    user.value = null;
    isAuthenticated.value = false;
    localStorage.removeItem('oc_admin_token');
    localStorage.removeItem('oc_admin_user');
  }

  return {
    user, isAuthenticated, isLoading, displayName, userId, roles,
    isAdmin, isSupportAgent, isTrainer,
    hasRole, hasAnyRole, init, setUser, setLoading, clearUser,
  };
});
