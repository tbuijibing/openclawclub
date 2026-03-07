import { IntegrationService } from './integration.service';
import {
  INTEGRATION_ERROR_CODES,
  OAUTH_PROVIDERS,
  SUPPORTED_TOOLS,
} from '@openclaw-club/shared';

describe('IntegrationService', () => {
  let service: IntegrationService;

  beforeEach(() => {
    service = new IntegrationService();
  });

  // ─── OAuth 2.0 Connection (Req 7.1, 7.2) ───

  describe('connectTool', () => {
    it('should connect GitHub via OAuth', () => {
      const result = service.connectTool({
        userId: 'user-1',
        tool: 'github',
        oauthCode: 'valid_code_abc123',
      });

      expect(result.id).toBeDefined();
      expect(result.userId).toBe('user-1');
      expect(result.tool).toBe('github');
      expect(result.status).toBe('connected');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.tokenExpiresAt).toBeInstanceOf(Date);
      expect(result.externalAccountId).toBeDefined();
      expect(result.connectedAt).toBeInstanceOf(Date);
    });

    it('should connect Feishu via OAuth', () => {
      const result = service.connectTool({
        userId: 'user-1',
        tool: 'feishu',
        oauthCode: 'valid_feishu_code',
      });

      expect(result.tool).toBe('feishu');
      expect(result.status).toBe('connected');
    });

    it('should connect DingTalk via OAuth', () => {
      const result = service.connectTool({
        userId: 'user-1',
        tool: 'dingtalk',
        oauthCode: 'valid_dingtalk_code',
      });

      expect(result.tool).toBe('dingtalk');
      expect(result.status).toBe('connected');
    });

    it('should return error status for invalid oauth code', () => {
      const result = service.connectTool({
        userId: 'user-1',
        tool: 'github',
        oauthCode: 'invalid_code',
      });

      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('OAUTH_INVALID_CODE');
      expect(result.errorMessage).toBe(INTEGRATION_ERROR_CODES['OAUTH_INVALID_CODE'].message);
    });

    it('should return error status for denied scope', () => {
      const result = service.connectTool({
        userId: 'user-1',
        tool: 'github',
        oauthCode: 'denied_scope',
      });

      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('OAUTH_SCOPE_DENIED');
    });

    it('should throw if tool is already connected', () => {
      service.connectTool({ userId: 'user-1', tool: 'github', oauthCode: 'code1' });

      expect(() =>
        service.connectTool({ userId: 'user-1', tool: 'github', oauthCode: 'code2' }),
      ).toThrow(/already connected/);
    });

    it('should allow connecting different tools for same user', () => {
      const gh = service.connectTool({ userId: 'user-1', tool: 'github', oauthCode: 'code1' });
      const fs = service.connectTool({ userId: 'user-1', tool: 'feishu', oauthCode: 'code2' });

      expect(gh.tool).toBe('github');
      expect(fs.tool).toBe('feishu');
    });

    it('should allow same tool for different users', () => {
      const u1 = service.connectTool({ userId: 'user-1', tool: 'github', oauthCode: 'code1' });
      const u2 = service.connectTool({ userId: 'user-2', tool: 'github', oauthCode: 'code2' });

      expect(u1.userId).toBe('user-1');
      expect(u2.userId).toBe('user-2');
    });

    it('should throw for empty userId', () => {
      expect(() =>
        service.connectTool({ userId: '', tool: 'github', oauthCode: 'code' }),
      ).toThrow(/userId is required/);
    });

    it('should throw for empty oauthCode', () => {
      expect(() =>
        service.connectTool({ userId: 'user-1', tool: 'github', oauthCode: '' }),
      ).toThrow(/oauthCode is required/);
    });

    it('should throw for unsupported tool', () => {
      expect(() =>
        service.connectTool({ userId: 'user-1', tool: 'slack' as any, oauthCode: 'code' }),
      ).toThrow(/Unsupported tool/);
    });
  });

  // ─── Disconnect Tool (Req 7.3) ───

  describe('disconnectTool', () => {
    let connectionId: string;

    beforeEach(() => {
      const conn = service.connectTool({
        userId: 'user-1',
        tool: 'github',
        oauthCode: 'valid_code',
      });
      connectionId = conn.id;
    });

    it('should disconnect an active integration', () => {
      const result = service.disconnectTool({ userId: 'user-1', toolId: connectionId });

      expect(result.status).toBe('disconnected');
      expect(result.accessToken).toBeUndefined();
      expect(result.refreshToken).toBeUndefined();
      expect(result.disconnectedAt).toBeInstanceOf(Date);
    });

    it('should throw for non-existent integration', () => {
      expect(() =>
        service.disconnectTool({ userId: 'user-1', toolId: 'non-existent' }),
      ).toThrow(/not found/);
    });

    it('should throw if integration belongs to another user', () => {
      expect(() =>
        service.disconnectTool({ userId: 'user-2', toolId: connectionId }),
      ).toThrow(/does not belong/);
    });

    it('should throw if already disconnected', () => {
      service.disconnectTool({ userId: 'user-1', toolId: connectionId });

      expect(() =>
        service.disconnectTool({ userId: 'user-1', toolId: connectionId }),
      ).toThrow(/already disconnected/);
    });

    it('should throw for empty userId', () => {
      expect(() =>
        service.disconnectTool({ userId: '', toolId: connectionId }),
      ).toThrow(/userId is required/);
    });

    it('should throw for empty toolId', () => {
      expect(() =>
        service.disconnectTool({ userId: 'user-1', toolId: '' }),
      ).toThrow(/toolId is required/);
    });
  });

  // ─── Integration Status (Req 7.3) ───

  describe('getIntegrationStatus', () => {
    it('should return all integrations for a user', () => {
      service.connectTool({ userId: 'user-1', tool: 'github', oauthCode: 'code1' });
      service.connectTool({ userId: 'user-1', tool: 'feishu', oauthCode: 'code2' });
      service.connectTool({ userId: 'user-2', tool: 'dingtalk', oauthCode: 'code3' });

      const result = service.getIntegrationStatus({ userId: 'user-1' });
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.tool).sort()).toEqual(['feishu', 'github']);
    });

    it('should return empty array for user with no integrations', () => {
      const result = service.getIntegrationStatus({ userId: 'no-user' });
      expect(result).toHaveLength(0);
    });

    it('should throw for empty userId', () => {
      expect(() => service.getIntegrationStatus({ userId: '' })).toThrow(/userId is required/);
    });
  });

  // ─── Connection Validation (Req 7.3, 7.4) ───

  describe('validateConnection', () => {
    it('should validate a connected integration successfully', () => {
      const conn = service.connectTool({
        userId: 'user-1',
        tool: 'github',
        oauthCode: 'valid_code',
      });

      const result = service.validateConnection({ integrationId: conn.id });
      expect(result.status).toBe('connected');
      expect(result.errorCode).toBeUndefined();
    });

    it('should mark as error when token is expired', () => {
      const conn = service.connectTool({
        userId: 'user-1',
        tool: 'github',
        oauthCode: 'valid_code',
      });
      // Manually expire the token
      conn.tokenExpiresAt = new Date(Date.now() - 1000);

      const result = service.validateConnection({ integrationId: conn.id });
      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('TOKEN_EXPIRED');
    });

    it('should throw for disconnected integration', () => {
      const conn = service.connectTool({
        userId: 'user-1',
        tool: 'github',
        oauthCode: 'valid_code',
      });
      service.disconnectTool({ userId: 'user-1', toolId: conn.id });

      expect(() =>
        service.validateConnection({ integrationId: conn.id }),
      ).toThrow(/Cannot validate a disconnected/);
    });

    it('should throw for non-existent integration', () => {
      expect(() =>
        service.validateConnection({ integrationId: 'non-existent' }),
      ).toThrow(/not found/);
    });

    it('should throw for empty integrationId', () => {
      expect(() =>
        service.validateConnection({ integrationId: '' }),
      ).toThrow(/integrationId is required/);
    });
  });

  // ─── Error Guide (Req 7.4) ───

  describe('getErrorGuide', () => {
    it('should return guide for known error code', () => {
      const result = service.getErrorGuide('OAUTH_INVALID_CODE');
      expect(result).not.toBeNull();
      expect(result!.errorCode).toBe('OAUTH_INVALID_CODE');
      expect(result!.message).toBeDefined();
      expect(result!.guide).toBeDefined();
    });

    it('should return guide for TOKEN_EXPIRED', () => {
      const result = service.getErrorGuide('TOKEN_EXPIRED');
      expect(result).not.toBeNull();
      expect(result!.guide).toContain('reconnect');
    });

    it('should return null for unknown error code', () => {
      const result = service.getErrorGuide('UNKNOWN_ERROR');
      expect(result).toBeNull();
    });
  });

  // ─── Private Model Configuration (Req 7.5) ───

  describe('configurePrivateModel', () => {
    it('should configure a private model for enterprise user', () => {
      const result = service.configurePrivateModel({
        enterpriseUserId: 'ent-1',
        modelName: 'Custom GPT',
        provider: 'openai',
        apiEndpoint: 'https://api.custom.com/v1',
        apiKey: 'sk-test-key',
      });

      expect(result.id).toBeDefined();
      expect(result.enterpriseUserId).toBe('ent-1');
      expect(result.modelName).toBe('Custom GPT');
      expect(result.provider).toBe('openai');
      expect(result.apiEndpoint).toBe('https://api.custom.com/v1');
      expect(result.apiKeyEncrypted).toContain('enc_');
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should throw for invalid API endpoint', () => {
      expect(() =>
        service.configurePrivateModel({
          enterpriseUserId: 'ent-1',
          modelName: 'Model',
          provider: 'custom',
          apiEndpoint: 'not-a-url',
          apiKey: 'key',
        }),
      ).toThrow(/invalid or unreachable/);
    });

    it('should throw for empty enterpriseUserId', () => {
      expect(() =>
        service.configurePrivateModel({
          enterpriseUserId: '',
          modelName: 'Model',
          provider: 'custom',
          apiEndpoint: 'https://api.test.com',
          apiKey: 'key',
        }),
      ).toThrow(/enterpriseUserId is required/);
    });

    it('should throw for empty modelName', () => {
      expect(() =>
        service.configurePrivateModel({
          enterpriseUserId: 'ent-1',
          modelName: '',
          provider: 'custom',
          apiEndpoint: 'https://api.test.com',
          apiKey: 'key',
        }),
      ).toThrow(/modelName is required/);
    });

    it('should throw for empty apiKey', () => {
      expect(() =>
        service.configurePrivateModel({
          enterpriseUserId: 'ent-1',
          modelName: 'Model',
          provider: 'custom',
          apiEndpoint: 'https://api.test.com',
          apiKey: '',
        }),
      ).toThrow(/apiKey is required/);
    });
  });

  describe('updatePrivateModel', () => {
    let modelId: string;

    beforeEach(() => {
      const model = service.configurePrivateModel({
        enterpriseUserId: 'ent-1',
        modelName: 'Custom GPT',
        provider: 'openai',
        apiEndpoint: 'https://api.custom.com/v1',
        apiKey: 'sk-test-key',
      });
      modelId = model.id;
    });

    it('should update model name', () => {
      const result = service.updatePrivateModel({
        modelId,
        enterpriseUserId: 'ent-1',
        modelName: 'Updated GPT',
      });
      expect(result.modelName).toBe('Updated GPT');
    });

    it('should update API endpoint', () => {
      const result = service.updatePrivateModel({
        modelId,
        enterpriseUserId: 'ent-1',
        apiEndpoint: 'https://new-api.com/v2',
      });
      expect(result.apiEndpoint).toBe('https://new-api.com/v2');
    });

    it('should deactivate a model', () => {
      const result = service.updatePrivateModel({
        modelId,
        enterpriseUserId: 'ent-1',
        isActive: false,
      });
      expect(result.isActive).toBe(false);
    });

    it('should throw for invalid API endpoint on update', () => {
      expect(() =>
        service.updatePrivateModel({
          modelId,
          enterpriseUserId: 'ent-1',
          apiEndpoint: 'bad-url',
        }),
      ).toThrow(/invalid or unreachable/);
    });

    it('should throw if model belongs to another enterprise user', () => {
      expect(() =>
        service.updatePrivateModel({
          modelId,
          enterpriseUserId: 'ent-2',
          modelName: 'Hacked',
        }),
      ).toThrow(/does not belong/);
    });

    it('should throw for non-existent model', () => {
      expect(() =>
        service.updatePrivateModel({
          modelId: 'non-existent',
          enterpriseUserId: 'ent-1',
        }),
      ).toThrow(/not found/);
    });
  });

  describe('getPrivateModels', () => {
    it('should return models for an enterprise user', () => {
      service.configurePrivateModel({
        enterpriseUserId: 'ent-1',
        modelName: 'Model A',
        provider: 'openai',
        apiEndpoint: 'https://a.com',
        apiKey: 'key-a',
      });
      service.configurePrivateModel({
        enterpriseUserId: 'ent-1',
        modelName: 'Model B',
        provider: 'anthropic',
        apiEndpoint: 'https://b.com',
        apiKey: 'key-b',
      });
      service.configurePrivateModel({
        enterpriseUserId: 'ent-2',
        modelName: 'Model C',
        provider: 'google',
        apiEndpoint: 'https://c.com',
        apiKey: 'key-c',
      });

      const result = service.getPrivateModels({ enterpriseUserId: 'ent-1' });
      expect(result).toHaveLength(2);
      expect(result.map((m) => m.modelName).sort()).toEqual(['Model A', 'Model B']);
    });

    it('should return empty array for user with no models', () => {
      const result = service.getPrivateModels({ enterpriseUserId: 'no-user' });
      expect(result).toHaveLength(0);
    });

    it('should throw for empty enterpriseUserId', () => {
      expect(() => service.getPrivateModels({ enterpriseUserId: '' })).toThrow(
        /enterpriseUserId is required/,
      );
    });
  });

  // ─── API Documentation (Req 7.6) ───

  describe('getApiDocumentation', () => {
    it('should return API documentation endpoints', () => {
      const docs = service.getApiDocumentation();
      expect(docs.length).toBeGreaterThan(0);
      expect(docs.every((d) => d.method && d.path && d.description && d.authentication)).toBe(true);
    });

    it('should include connect endpoint', () => {
      const docs = service.getApiDocumentation();
      const connectDoc = docs.find((d) => d.path === '/integrations/connect');
      expect(connectDoc).toBeDefined();
      expect(connectDoc!.method).toBe('POST');
    });

    it('should include private-models endpoint', () => {
      const docs = service.getApiDocumentation();
      const modelDoc = docs.find((d) => d.path === '/integrations/private-models' && d.method === 'POST');
      expect(modelDoc).toBeDefined();
    });
  });
});
