<template>
  <el-container class="admin-layout">
    <!-- Sidebar -->
    <el-aside :width="sidebarStore.isCollapsed ? '64px' : '220px'" class="admin-sidebar">
      <div class="admin-sidebar__logo">
        <span v-if="!sidebarStore.isCollapsed" class="admin-sidebar__logo-text">OC Admin</span>
        <span v-else class="admin-sidebar__logo-icon">OC</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="sidebarStore.isCollapsed"
        :collapse-transition="false"
        router
        class="admin-sidebar__menu"
      >
        <template v-for="item in visibleMenuItems" :key="item.name">
          <el-menu-item :index="item.path">
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ t(item.title) }}</template>
          </el-menu-item>
        </template>
      </el-menu>

      <div class="admin-sidebar__footer">
        <el-button
          :icon="sidebarStore.isCollapsed ? Expand : Fold"
          text
          :aria-label="t('sidebar.collapse')"
          @click="sidebarStore.toggle()"
        />
      </div>
    </el-aside>

    <!-- Main area -->
    <el-container>
      <!-- Header -->
      <el-header class="admin-header" height="56px">
        <div class="admin-header__left">
          <el-button
            :icon="sidebarStore.isCollapsed ? Expand : Fold"
            text
            class="admin-header__collapse-btn"
            :aria-label="t('sidebar.collapse')"
            @click="sidebarStore.toggle()"
          />
        </div>

        <div class="admin-header__right">
          <!-- Language selector -->
          <el-select
            :model-value="currentLocale"
            size="small"
            style="width: 120px"
            :aria-label="t('common.language')"
            @change="onLocaleChange"
          >
            <el-option
              v-for="l in SUPPORTED_LOCALES"
              :key="l.code"
              :label="l.label"
              :value="l.code"
            />
          </el-select>

          <!-- User dropdown -->
          <el-dropdown trigger="click">
            <span class="admin-header__user">
              <el-avatar :size="28">{{ avatarText }}</el-avatar>
              <span class="admin-header__user-name">{{ authStore.displayName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  {{ roleLabel }}
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  {{ t('header.logout') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- Content -->
      <el-main class="admin-main">
        <router-view v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  Odometer,
  User,
  Document,
  SetUp,
  ChatDotRound,
  Connection,
  Reading,
  Monitor,
  DataAnalysis,
  Setting,
  Fold,
  Expand,
  ArrowDown,
  SwitchButton,
} from '@element-plus/icons-vue';
import { useAdminAuthStore, type AdminRole } from '@/stores/auth';
import { useSidebarStore } from '@/stores/sidebar';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n';
import i18n from '@/i18n';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAdminAuthStore();
const sidebarStore = useSidebarStore();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const currentLocale = computed(() => (i18n.global.locale as any).value as string);

// Menu items with role requirements
const menuItems = [
  { name: 'dashboard', path: '/', title: 'sidebar.dashboard', icon: Odometer, roles: ['admin', 'support_agent', 'trainer'] as AdminRole[] },
  { name: 'users', path: '/users', title: 'sidebar.users', icon: User, roles: ['admin'] as AdminRole[] },
  { name: 'orders', path: '/orders', title: 'sidebar.orders', icon: Document, roles: ['admin', 'support_agent'] as AdminRole[] },
  { name: 'services', path: '/services', title: 'sidebar.services', icon: SetUp, roles: ['admin', 'support_agent'] as AdminRole[] },
  { name: 'tickets', path: '/tickets', title: 'sidebar.tickets', icon: ChatDotRound, roles: ['admin', 'support_agent'] as AdminRole[] },
  { name: 'partners', path: '/partners', title: 'sidebar.partners', icon: Connection, roles: ['admin'] as AdminRole[] },
  { name: 'training', path: '/training', title: 'sidebar.training', icon: Reading, roles: ['admin', 'trainer'] as AdminRole[] },
  { name: 'hardware', path: '/hardware', title: 'sidebar.hardware', icon: Monitor, roles: ['admin'] as AdminRole[] },
  { name: 'analytics', path: '/analytics', title: 'sidebar.analytics', icon: DataAnalysis, roles: ['admin'] as AdminRole[] },
  { name: 'settings', path: '/settings', title: 'sidebar.settings', icon: Setting, roles: ['admin'] as AdminRole[] },
];

// Filter menu items based on user roles
const visibleMenuItems = computed(() =>
  menuItems.filter((item) => authStore.hasAnyRole(item.roles)),
);

const activeMenu = computed(() => route.path);

const avatarText = computed(() => {
  const name = authStore.displayName;
  return name ? name.charAt(0).toUpperCase() : 'A';
});

const roleLabel = computed(() => {
  const roles = authStore.roles;
  if (roles.includes('admin')) return 'Admin';
  if (roles.includes('support_agent')) return 'Support Agent';
  if (roles.includes('trainer')) return 'Trainer';
  return '';
});

function onLocaleChange(val: string): void {
  const newLocale = val as SupportedLocale;
  localStorage.setItem('oc-admin-locale', newLocale);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (i18n.global.locale as any).value = newLocale;
}

function handleLogout(): void {
  authStore.clearUser();
  router.push({ name: 'login' });
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

/* Sidebar */
.admin-sidebar {
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  overflow: hidden;
}

.admin-sidebar__logo {
  height: var(--admin-header-height);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-weight: 700;
  font-size: 16px;
  color: var(--oc-primary);
  white-space: nowrap;
}

.admin-sidebar__logo-icon {
  font-size: 18px;
  font-weight: 700;
}

.admin-sidebar__menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
}

.admin-sidebar__footer {
  padding: 8px;
  display: flex;
  justify-content: center;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* Header */
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 0 16px;
}

.admin-header__left {
  display: flex;
  align-items: center;
}

.admin-header__collapse-btn {
  display: none;
}

.admin-header__right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-header__user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.admin-header__user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Main content */
.admin-main {
  background: var(--el-fill-color-blank);
}

/* Responsive: show collapse button in header on small screens */
@media (max-width: 768px) {
  .admin-header__collapse-btn {
    display: inline-flex;
  }

  .admin-sidebar__footer {
    display: none;
  }
}
</style>
