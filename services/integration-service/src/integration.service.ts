import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  IntegrationTool,
  ToolIntegrationStatus,
  IntegrationConnection,
  PrivateModelConfig,
  INTEGRATION_ERROR_CODES,
  OAUTH_PROVIDERS,
  SUPPORTED_TOOLS,
  ApiDocEndpoint,
} from '@openclaw-club/shared';
import {
  ConnectToolDto,
  DisconnectToolDto,
  GetIntegrationStatusDto,
  ValidateConnectionDto,
  ConfigurePrivateModelDto,
  UpdatePrivateModelDto,
  GetPrivateModelsDto,
} from './dto/integration.dto';

@Injectable()
export class IntegrationService {
  private connections = new Map<string, IntegrationConnection>();
  private privateModels = new Map<string, PrivateModelConfig>();

  // ─── OAuth 2.0 Connection (Req 7.1, 7.2) ───

  connectTool(dto: ConnectToolDto): IntegrationConnection {
    if (!dto.userId) throw new BadRequestException('userId is required');
    if (!dto.tool) throw new BadRequestException('tool is required');
    if (!dto.oauthCode) throw new BadRequestException('oauthCode is required');

    if (!SUPPORTED_TOOLS.includes(dto.tool)) {
      throw new BadRequestException(`Unsupported tool: ${dto.tool}. Supported: ${SUPPORTED_TOOLS.join(', ')}`);
    }

    // Check for existing active connection for same user+tool
    const existing = this.findConnectionByUserAndTool(dto.userId, dto.tool);
    if (existing && existing.status === 'connected') {
      throw new BadRequestException(`Tool ${dto.tool} is already connected for this user`);
    }

    // Simulate OAuth token exchange
    const provider = OAUTH_PROVIDERS[dto.tool];
    if (!provider) {
      throw new BadRequestException(`No OAuth provider config for tool: ${dto.tool}`);
    }

    // Simulate: if oauthCode starts with 'invalid', treat as failed
    if (dto.oauthCode.startsWith('invalid')) {
      const errorInfo = INTEGRATION_ERROR_CODES['OAUTH_INVALID_CODE'];
      const connection = this.createConnection(dto.userId, dto.tool, 'error');
      connection.errorCode = 'OAUTH_INVALID_CODE';
      connection.errorMessage = errorInfo.message;
      return connection;
    }

    // Simulate: if oauthCode starts with 'denied', treat as scope denied
    if (dto.oauthCode.startsWith('denied')) {
      const errorInfo = INTEGRATION_ERROR_CODES['OAUTH_SCOPE_DENIED'];
      const connection = this.createConnection(dto.userId, dto.tool, 'error');
      connection.errorCode = 'OAUTH_SCOPE_DENIED';
      connection.errorMessage = errorInfo.message;
      return connection;
    }

    // Successful connection
    const connection = this.createConnection(dto.userId, dto.tool, 'connected');
    connection.accessToken = `at_${dto.tool}_${crypto.randomUUID().slice(0, 8)}`;
    connection.refreshToken = `rt_${dto.tool}_${crypto.randomUUID().slice(0, 8)}`;
    connection.tokenExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
    connection.externalAccountId = `ext_${dto.oauthCode.slice(0, 8)}`;
    connection.connectedAt = new Date();

    return connection;
  }

  // ─── Disconnect Tool (Req 7.3) ───

  disconnectTool(dto: DisconnectToolDto): IntegrationConnection {
    if (!dto.userId) throw new BadRequestException('userId is required');
    if (!dto.toolId) throw new BadRequestException('toolId is required');

    const connection = this.connections.get(dto.toolId);
    if (!connection) throw new NotFoundException(`Integration ${dto.toolId} not found`);

    if (connection.userId !== dto.userId) {
      throw new BadRequestException('Integration does not belong to this user');
    }

    if (connection.status === 'disconnected') {
      throw new BadRequestException('Integration is already disconnected');
    }

    connection.status = 'disconnected';
    connection.accessToken = undefined;
    connection.refreshToken = undefined;
    connection.tokenExpiresAt = undefined;
    connection.disconnectedAt = new Date();
    connection.updatedAt = new Date();

    return connection;
  }

  // ─── Integration Status (Req 7.3) ───

  getIntegrationStatus(dto: GetIntegrationStatusDto): IntegrationConnection[] {
    if (!dto.userId) throw new BadRequestException('userId is required');

    return Array.from(this.connections.values()).filter(
      (c) => c.userId === dto.userId,
    );
  }

  // ─── Connection Validation (Req 7.3, 7.4) ───

  validateConnection(dto: ValidateConnectionDto): IntegrationConnection {
    if (!dto.integrationId) throw new BadRequestException('integrationId is required');

    const connection = this.connections.get(dto.integrationId);
    if (!connection) throw new NotFoundException(`Integration ${dto.integrationId} not found`);

    if (connection.status === 'disconnected') {
      throw new BadRequestException('Cannot validate a disconnected integration');
    }

    // Check token expiry
    if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
      const errorInfo = INTEGRATION_ERROR_CODES['TOKEN_EXPIRED'];
      connection.status = 'error';
      connection.errorCode = 'TOKEN_EXPIRED';
      connection.errorMessage = errorInfo.message;
      connection.updatedAt = new Date();
      return connection;
    }

    // If currently in error, re-validate (simulate success if token is present)
    if (connection.accessToken) {
      connection.status = 'connected';
      connection.errorCode = undefined;
      connection.errorMessage = undefined;
      connection.updatedAt = new Date();
    } else {
      const errorInfo = INTEGRATION_ERROR_CODES['CONNECTION_VALIDATION_FAILED'];
      connection.status = 'error';
      connection.errorCode = 'CONNECTION_VALIDATION_FAILED';
      connection.errorMessage = errorInfo.message;
      connection.updatedAt = new Date();
    }

    return connection;
  }

  // ─── Error Troubleshooting Guide (Req 7.4) ───

  getErrorGuide(errorCode: string): { errorCode: string; message: string; guide: string } | null {
    const info = INTEGRATION_ERROR_CODES[errorCode];
    if (!info) return null;
    return { errorCode, ...info };
  }

  // ─── Private Model Configuration (Req 7.5) ───

  configurePrivateModel(dto: ConfigurePrivateModelDto): PrivateModelConfig {
    if (!dto.enterpriseUserId) throw new BadRequestException('enterpriseUserId is required');
    if (!dto.modelName) throw new BadRequestException('modelName is required');
    if (!dto.provider) throw new BadRequestException('provider is required');
    if (!dto.apiEndpoint) throw new BadRequestException('apiEndpoint is required');
    if (!dto.apiKey) throw new BadRequestException('apiKey is required');

    // Validate API endpoint format
    if (!dto.apiEndpoint.startsWith('http://') && !dto.apiEndpoint.startsWith('https://')) {
      const errorInfo = INTEGRATION_ERROR_CODES['INVALID_API_ENDPOINT'];
      throw new BadRequestException(errorInfo.message);
    }

    const now = new Date();
    const model: PrivateModelConfig = {
      id: crypto.randomUUID(),
      enterpriseUserId: dto.enterpriseUserId,
      modelName: dto.modelName,
      provider: dto.provider,
      apiEndpoint: dto.apiEndpoint,
      apiKeyEncrypted: `enc_${dto.apiKey}`, // Simulated encryption
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.privateModels.set(model.id, model);
    return model;
  }

  updatePrivateModel(dto: UpdatePrivateModelDto): PrivateModelConfig {
    if (!dto.modelId) throw new BadRequestException('modelId is required');
    if (!dto.enterpriseUserId) throw new BadRequestException('enterpriseUserId is required');

    const model = this.privateModels.get(dto.modelId);
    if (!model) throw new NotFoundException(`Private model ${dto.modelId} not found`);

    if (model.enterpriseUserId !== dto.enterpriseUserId) {
      throw new BadRequestException('Private model does not belong to this enterprise user');
    }

    if (dto.modelName !== undefined) model.modelName = dto.modelName;
    if (dto.apiEndpoint !== undefined) {
      if (!dto.apiEndpoint.startsWith('http://') && !dto.apiEndpoint.startsWith('https://')) {
        throw new BadRequestException(INTEGRATION_ERROR_CODES['INVALID_API_ENDPOINT'].message);
      }
      model.apiEndpoint = dto.apiEndpoint;
    }
    if (dto.apiKey !== undefined) model.apiKeyEncrypted = `enc_${dto.apiKey}`;
    if (dto.isActive !== undefined) model.isActive = dto.isActive;
    model.updatedAt = new Date();

    return model;
  }

  getPrivateModels(dto: GetPrivateModelsDto): PrivateModelConfig[] {
    if (!dto.enterpriseUserId) throw new BadRequestException('enterpriseUserId is required');

    return Array.from(this.privateModels.values()).filter(
      (m) => m.enterpriseUserId === dto.enterpriseUserId,
    );
  }

  // ─── API Documentation (Req 7.6) ───

  getApiDocumentation(): ApiDocEndpoint[] {
    return [
      {
        method: 'POST',
        path: '/integrations/connect',
        description: 'Connect a third-party tool via OAuth 2.0',
        authentication: 'Bearer token (JWT)',
        requestBody: { userId: 'string', tool: 'github | feishu | dingtalk', oauthCode: 'string' },
        responseBody: { id: 'string', status: 'connected | error', tool: 'string' },
      },
      {
        method: 'DELETE',
        path: '/integrations/:id',
        description: 'Disconnect a third-party tool integration',
        authentication: 'Bearer token (JWT)',
        responseBody: { id: 'string', status: 'disconnected' },
      },
      {
        method: 'GET',
        path: '/integrations/status',
        description: 'Get all integration statuses for the current user',
        authentication: 'Bearer token (JWT)',
        responseBody: { integrations: '[IntegrationConnection]' },
      },
      {
        method: 'POST',
        path: '/integrations/:id/validate',
        description: 'Validate an existing integration connection',
        authentication: 'Bearer token (JWT)',
        responseBody: { id: 'string', status: 'connected | error', errorCode: 'string?' },
      },
      {
        method: 'POST',
        path: '/integrations/private-models',
        description: 'Configure a private AI model (Enterprise_User only)',
        authentication: 'Bearer token (JWT) + Enterprise role',
        requestBody: { modelName: 'string', provider: 'string', apiEndpoint: 'string', apiKey: 'string' },
        responseBody: { id: 'string', modelName: 'string', isActive: 'boolean' },
      },
      {
        method: 'GET',
        path: '/integrations/private-models',
        description: 'List private AI models for the enterprise user',
        authentication: 'Bearer token (JWT) + Enterprise role',
        responseBody: { models: '[PrivateModelConfig]' },
      },
    ];
  }

  // ─── Helpers ───

  private createConnection(
    userId: string,
    tool: IntegrationTool,
    status: ToolIntegrationStatus,
  ): IntegrationConnection {
    const now = new Date();
    const connection: IntegrationConnection = {
      id: crypto.randomUUID(),
      userId,
      tool,
      status,
      createdAt: now,
      updatedAt: now,
    };
    this.connections.set(connection.id, connection);
    return connection;
  }

  private findConnectionByUserAndTool(
    userId: string,
    tool: IntegrationTool,
  ): IntegrationConnection | undefined {
    return Array.from(this.connections.values()).find(
      (c) => c.userId === userId && c.tool === tool && c.status === 'connected',
    );
  }
}
