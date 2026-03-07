import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import type { AdminRole } from '@/stores/auth';
import { authGuard } from './guards';

// Extend RouteMeta to include roles
declare module 'vue-router' {
  interface RouteMeta {
    roles?: AdminRole[];
    title?: string;
    icon?: string;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/callback',
    name: 'loginCallback',
    component: () => import('@/views/LoginCallbackView.vue'),
  },
  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('@/views/ForbiddenView.vue'),
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: {
          roles: ['admin', 'support_agent', 'trainer'],
          title: 'sidebar.dashboard',
          icon: 'Odometer',
        },
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/UsersView.vue'),
        meta: {
          roles: ['admin'],
          title: 'sidebar.users',
          icon: 'User',
        },
      },
      {
        path: 'orders',
        name: 'orders',
        component: () => import('@/views/OrdersView.vue'),
        meta: {
          roles: ['admin', 'support_agent'],
          title: 'sidebar.orders',
          icon: 'Document',
        },
      },
      {
        path: 'services',
        name: 'services',
        component: () => import('@/views/ServicesView.vue'),
        meta: {
          roles: ['admin', 'support_agent'],
          title: 'sidebar.services',
          icon: 'SetUp',
        },
      },
      {
        path: 'tickets',
        name: 'tickets',
        component: () => import('@/views/TicketsView.vue'),
        meta: {
          roles: ['admin', 'support_agent'],
          title: 'sidebar.tickets',
          icon: 'ChatDotRound',
        },
      },
      {
        path: 'partners',
        name: 'partners',
        component: () => import('@/views/PartnersView.vue'),
        meta: {
          roles: ['admin'],
          title: 'sidebar.partners',
          icon: 'Connection',
        },
      },
      {
        path: 'training',
        name: 'training',
        component: () => import('@/views/TrainingView.vue'),
        meta: {
          roles: ['admin', 'trainer'],
          title: 'sidebar.training',
          icon: 'Reading',
        },
      },
      {
        path: 'hardware',
        name: 'hardware',
        component: () => import('@/views/HardwareView.vue'),
        meta: {
          roles: ['admin'],
          title: 'sidebar.hardware',
          icon: 'Monitor',
        },
      },
      {
        path: 'analytics',
        name: 'analytics',
        component: () => import('@/views/AnalyticsView.vue'),
        meta: {
          roles: ['admin'],
          title: 'sidebar.analytics',
          icon: 'DataAnalysis',
        },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/SettingsView.vue'),
        meta: {
          roles: ['admin'],
          title: 'sidebar.settings',
          icon: 'Setting',
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory('/admin'),
  routes,
});

router.beforeEach(authGuard);

export default router;
