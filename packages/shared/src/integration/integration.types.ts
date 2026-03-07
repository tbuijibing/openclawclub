// ─── Integration Service Types ───
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6

/** Supported third-party tools (Req 7.1) */
export type IntegrationTool = 'github' | 'feishu' | 'dingtalk';

/** Integration connection status (Req 7.3, 7.4) */
export type ToolIntegrationStatus = 'connected' | 'disconnected' | 'error';

/** OAuth 2.0 provider configurations */
export interface OAuthProviderConfig {
  tool: IntegrationTool;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
}

/** Integration connection record */
export interface IntegrationConnection {
  id: string;
  userId: string;
  tool: IntegrationTool;
  status: ToolIntegrationStatus;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  externalAccountId?: string;
  errorCode?: string;
  errorMessage?: string;
  connectedAt?: Date;
  disconnectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Private model configuration (Req 7.5) — Enterprise_User only */
export interface PrivateModelConfig {
  id: string;
  enterpriseUserId: string;
  modelName: string;
  provider: string;
  apiEndpoint: string;
  apiKeyEncrypted: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Integration error codes with troubleshooting guides (Req 7.4) */
export const INTEGRATION_ERROR_CODES: Record<string, { message: string; guide: string }> = {
  OAUTH_INVALID_CODE: {
    message: 'The authorization code is invalid or expired',
    guide: 'Please re-initiate the authorization flow from the integrations page.',
  },
  OAUTH_TOKEN_EXCHANGE_FAILED: {
    message: 'Failed to exchange authorization code for access token',
    guide: 'Check that the OAuth app credentials are correctly configured. If the issue persists, try reconnecting.',
  },
  OAUTH_SCOPE_DENIED: {
    message: 'Required permissions were denied during authorization',
    guide: 'Please re-authorize and grant all requested permissions.',
  },
  CONNECTION_VALIDATION_FAILED: {
    message: 'Connection validation failed — the access token may be revoked',
    guide: 'Disconnect and reconnect the integration to obtain a new access token.',
  },
  TOKEN_EXPIRED: {
    message: 'The access token has expired and could not be refreshed',
    guide: 'Disconnect and reconnect the integration to obtain fresh credentials.',
  },
  PROVIDER_UNREACHABLE: {
    message: 'The third-party service is currently unreachable',
    guide: 'Check the service status page of the provider. Try again later.',
  },
  INVALID_API_ENDPOINT: {
    message: 'The provided API endpoint is invalid or unreachable',
    guide: 'Verify the API endpoint URL and ensure it is accessible from the platform network.',
  },
  INVALID_API_KEY: {
    message: 'The provided API key is invalid',
    guide: 'Double-check the API key in your provider dashboard and update the configuration.',
  },
};

/** OAuth provider configurations (Req 7.2) */
export const OAUTH_PROVIDERS: Record<IntegrationTool, OAuthProviderConfig> = {
  github: {
    tool: 'github',
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['read:user', 'repo'],
  },
  feishu: {
    tool: 'feishu',
    authorizationUrl: 'https://open.feishu.cn/open-apis/authen/v1/authorize',
    tokenUrl: 'https://open.feishu.cn/open-apis/authen/v1/oidc/access_token',
    scopes: ['contact:user.base:readonly'],
  },
  dingtalk: {
    tool: 'dingtalk',
    authorizationUrl: 'https://login.dingtalk.com/oauth2/auth',
    tokenUrl: 'https://api.dingtalk.com/v1.0/oauth2/userAccessToken',
    scopes: ['openid'],
  },
};

/** Supported tools list */
export const SUPPORTED_TOOLS: IntegrationTool[] = ['github', 'feishu', 'dingtalk'];

/** API documentation metadata (Req 7.6) */
export interface ApiDocEndpoint {
  method: string;
  path: string;
  description: string;
  authentication: string;
  requestBody?: Record<string, unknown>;
  responseBody?: Record<string, unknown>;
}
