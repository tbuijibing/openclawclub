import { useAdminAuthStore, type AdminUserInfo } from '@/stores/auth';

/**
 * Logto auth composable for admin panel.
 * Wraps the admin auth store and provides methods that integrate
 * with @logto/vue SDK for Admin/Support_Agent/Trainer role login.
 */
export function useAuth() {
  const store = useAdminAuthStore();

  /** Call after Logto confirms authentication to sync admin user into Pinia */
  function handleSignInCallback(userInfo: AdminUserInfo): void {
    store.setUser(userInfo);
  }

  /** Trigger sign-in via Logto redirect */
  async function signIn(redirectUri: string): Promise<void> {
    store.setLoading(true);
    try {
      // In real integration: logtoClient.signIn(redirectUri)
      console.info('[admin-auth] signIn redirect to Logto, callback:', redirectUri);
    } finally {
      store.setLoading(false);
    }
  }

  /** Trigger sign-out via Logto */
  async function signOut(postLogoutRedirectUri?: string): Promise<void> {
    store.setLoading(true);
    try {
      // In real integration: logtoClient.signOut(postLogoutRedirectUri)
      console.info('[admin-auth] signOut, redirect:', postLogoutRedirectUri);
      store.clearUser();
    } finally {
      store.setLoading(false);
    }
  }

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    displayName: store.displayName,
    roles: store.roles,
    isAdmin: store.isAdmin,
    isSupportAgent: store.isSupportAgent,
    isTrainer: store.isTrainer,
    hasRole: store.hasRole,
    hasAnyRole: store.hasAnyRole,
    handleSignInCallback,
    signIn,
    signOut,
  };
}
