import { AuditService, AuditLogEntry } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(() => {
    service = new AuditService();
  });

  describe('logApiCall', () => {
    it('should create an audit log entry with metadata only', () => {
      const entry = service.logApiCall({
        userId: 'user-1',
        model: 'gpt-4o',
        provider: 'openai',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        directMode: false,
        durationMs: 320,
        responseType: 'json',
      });

      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeDefined();
      expect(entry.userId).toBe('user-1');
      expect(entry.model).toBe('gpt-4o');
      expect(entry.totalTokens).toBe(150);
      expect(entry.directMode).toBe(false);
    });

    it('should not contain any message content fields', () => {
      const entry = service.logApiCall({
        userId: 'user-1',
        model: 'claude-3.5-sonnet',
        provider: 'anthropic',
        promptTokens: 200,
        completionTokens: 100,
        totalTokens: 300,
        directMode: true,
        durationMs: 500,
        responseType: 'stream',
      });

      // Verify no content/messages fields exist
      const keys = Object.keys(entry);
      expect(keys).not.toContain('messages');
      expect(keys).not.toContain('content');
      expect(keys).not.toContain('prompt');
    });
  });

  describe('getAuditLogs', () => {
    beforeEach(() => {
      // Add some logs
      service.logApiCall({
        userId: 'user-1',
        model: 'gpt-4o',
        provider: 'openai',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        directMode: false,
        durationMs: 200,
        responseType: 'json',
      });
      service.logApiCall({
        userId: 'user-2',
        model: 'claude-3.5-sonnet',
        provider: 'anthropic',
        promptTokens: 200,
        completionTokens: 100,
        totalTokens: 300,
        directMode: false,
        durationMs: 400,
        responseType: 'json',
      });
    });

    it('should filter logs by userId', () => {
      const logs = service.getAuditLogs('user-1');
      expect(logs).toHaveLength(1);
      expect(logs[0].model).toBe('gpt-4o');
    });

    it('should return empty array for unknown user', () => {
      const logs = service.getAuditLogs('unknown');
      expect(logs).toHaveLength(0);
    });
  });
});
