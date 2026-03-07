import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { logtoConfig } from '../config/logto.config';
import { RoleType } from '@openclaw-club/shared';

interface LogtoM2MToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface LogtoUser {
  id: string;
  username?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  name?: string;
  avatar?: string;
  identities?: Record<string, unknown>;
  customData?: Record<string, unknown>;
}

interface LogtoRole {
  id: string;
  name: string;
  description?: string;
}

interface LogtoOrganization {
  id: string;
  name: string;
  description?: string;
}

@Injectable()
export class LogtoService implements OnModuleInit {
  private readonly logger = new Logger(LogtoService.name);
  private m2mToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(
    @Inject(logtoConfig.KEY)
    private readonly config: ConfigType<typeof logtoConfig>,
  ) {}

  async onModuleInit() {
    await this.ensureM2MToken();
  }

  /** Get or refresh M2M access token for Logto Management API */
  private async ensureM2MToken(): Promise<string> {
    if (this.m2mToken && Date.now() < this.tokenExpiresAt - 60_000) {
      return this.m2mToken;
    }

    const tokenEndpoint = `${this.config.endpoint}/oidc/token`;
    const credentials = Buffer.from(
      `${this.config.m2mAppId}:${this.config.m2mAppSecret}`,
    ).toString('base64');

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        resource: `${this.config.endpoint}/api`,
        scope: 'all',
      }),
    });

    if (!response.ok) {
      this.logger.error(`Failed to get M2M token: ${response.status}`);
      throw new Error('Failed to obtain Logto M2M token');
    }

    const data = (await response.json()) as LogtoM2MToken;
    this.m2mToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return this.m2mToken;
  }

  /** Call Logto Management API */
  private async managementApi<T = unknown>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.ensureM2MToken();
    const url = `${this.config.endpoint}/api${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Logto API error: ${response.status} ${body}`);
      throw new Error(`Logto API error: ${response.status}`);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  /** Get user info from Logto */
  async getUser(logtoUserId: string): Promise<LogtoUser> {
    return this.managementApi<LogtoUser>(`/users/${logtoUserId}`);
  }

  /** Verify OIDC access token via introspection */
  async verifyToken(token: string): Promise<Record<string, unknown> | null> {
    const credentials = Buffer.from(
      `${this.config.appId}:${this.config.appSecret}`,
    ).toString('base64');

    const response = await fetch(`${this.config.endpoint}/oidc/token/introspection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({ token }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as Record<string, unknown>;
    return data.active ? data : null;
  }

  // ---- Role Management (RBAC) ----

  /** Get all roles defined in Logto */
  async getRoles(): Promise<LogtoRole[]> {
    return this.managementApi<LogtoRole[]>('/roles');
  }

  /** Create a role in Logto */
  async createRole(name: string, description?: string): Promise<LogtoRole> {
    return this.managementApi<LogtoRole>('/roles', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  /** Assign a role to a user */
  async assignRoleToUser(logtoUserId: string, roleId: string): Promise<void> {
    await this.managementApi(`/users/${logtoUserId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleIds: [roleId] }),
    });
  }

  /** Remove a role from a user */
  async removeRoleFromUser(logtoUserId: string, roleId: string): Promise<void> {
    await this.managementApi(`/users/${logtoUserId}/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  /** Get roles assigned to a user */
  async getUserRoles(logtoUserId: string): Promise<LogtoRole[]> {
    return this.managementApi<LogtoRole[]>(`/users/${logtoUserId}/roles`);
  }

  // ---- Organization Management ----

  /** Create an organization */
  async createOrganization(name: string, description?: string): Promise<LogtoOrganization> {
    return this.managementApi<LogtoOrganization>('/organizations', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  /** Add a user to an organization */
  async addUserToOrganization(orgId: string, logtoUserId: string): Promise<void> {
    await this.managementApi(`/organizations/${orgId}/users`, {
      method: 'POST',
      body: JSON.stringify({ userIds: [logtoUserId] }),
    });
  }

  /** Assign organization roles to a user */
  async assignOrgRoles(
    orgId: string,
    logtoUserId: string,
    roleIds: string[],
  ): Promise<void> {
    await this.managementApi(`/organizations/${orgId}/users/${logtoUserId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ organizationRoleIds: roleIds }),
    });
  }

  /** Get organization members */
  async getOrganizationMembers(orgId: string): Promise<LogtoUser[]> {
    return this.managementApi<LogtoUser[]>(`/organizations/${orgId}/users`);
  }

  // ---- Social Login & Account Linking ----

  /** Get user identities (social connections) */
  async getUserIdentities(logtoUserId: string): Promise<Record<string, unknown>> {
    const user = await this.getUser(logtoUserId);
    return user.identities || {};
  }

  /** Link a social identity to a user */
  async linkSocialIdentity(
    logtoUserId: string,
    connectorId: string,
    connectorData: Record<string, unknown>,
  ): Promise<void> {
    await this.managementApi(`/users/${logtoUserId}/identities`, {
      method: 'POST',
      body: JSON.stringify({ connectorId, connectorData }),
    });
  }

  // ---- MFA Configuration ----

  /** Check if MFA is enabled for a user */
  async getUserMfaStatus(logtoUserId: string): Promise<boolean> {
    const user = await this.getUser(logtoUserId);
    const mfaFactors = (user.customData as any)?.mfaVerifications;
    return Array.isArray(mfaFactors) && mfaFactors.length > 0;
  }

  /** Get Logto endpoint for client-side OIDC flows */
  getOidcConfig() {
    return {
      endpoint: this.config.endpoint,
      appId: this.config.appId,
    };
  }

  /** Verify webhook signature */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) return true;
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  }
}
