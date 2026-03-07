import type { IntegrationTool } from '@openclaw-club/shared';

// ─── OAuth Connection (Req 7.1, 7.2) ───

export interface ConnectToolDto {
  userId: string;
  tool: IntegrationTool;
  oauthCode: string;
}

export interface DisconnectToolDto {
  userId: string;
  toolId: string;
}

// ─── Integration Status (Req 7.3) ───

export interface GetIntegrationStatusDto {
  userId: string;
}

// ─── Connection Validation (Req 7.3, 7.4) ───

export interface ValidateConnectionDto {
  integrationId: string;
}

// ─── Private Model Configuration (Req 7.5) ───

export interface ConfigurePrivateModelDto {
  enterpriseUserId: string;
  modelName: string;
  provider: string;
  apiEndpoint: string;
  apiKey: string;
}

export interface UpdatePrivateModelDto {
  modelId: string;
  enterpriseUserId: string;
  modelName?: string;
  apiEndpoint?: string;
  apiKey?: string;
  isActive?: boolean;
}

export interface GetPrivateModelsDto {
  enterpriseUserId: string;
}
