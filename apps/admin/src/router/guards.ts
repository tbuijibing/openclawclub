import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAdminAuthStore, type AdminRole } from '@/stores/auth';

/**
 * Route guard that checks:
 * 1. User is authenticated
 * 2. User has at least one of the required roles defined in route meta
 */
export function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
): void {
  const authStore = useAdminAuthStore();
  authStore.init();

  // Allow login and callback routes without auth
  if (to.name === 'login' || to.name === 'loginCallback') {
    next();
    return;
  }

  // Check authentication
  if (!authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  // Check role-based access
  const requiredRoles = to.meta.roles as AdminRole[] | undefined;
  if (requiredRoles && requiredRoles.length > 0) {
    if (!authStore.hasAnyRole(requiredRoles)) {
      next({ name: 'forbidden' });
      return;
    }
  }

  next();
}
