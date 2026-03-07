import { UserKeyService } from './user-key.service';

describe('UserKeyService', () => {
  let service: UserKeyService;

  beforeEach(() => {
    service = new UserKeyService();
  });

  describe('addApiKey', () => {
    it('should store a user API key and return masked version', () => {
      const result = service.addApiKey('user-1', 'openai', 'sk-abcdefghijklmnop');
      expect(result.userId).toBe('user-1');
      expect(result.provider).toBe('openai');
      expect(result.maskedKey).toBe('sk-...nop');
      expect(result.isActive).toBe(true);
    });

    it('should deactivate previous key for same provider', () => {
      service.addApiKey('user-1', 'openai', 'sk-first-key-12345');
      service.addApiKey('user-1', 'openai', 'sk-second-key-6789');

      const keys = service.listApiKeys('user-1');
      const activeKeys = keys.filter((k) => k.isActive);
      expect(activeKeys).toHaveLength(1);
      expect(activeKeys[0].maskedKey).toBe('sk-...789');
    });

    it('should reject keys shorter than 8 characters', () => {
      expect(() => service.addApiKey('user-1', 'openai', 'short')).toThrow('Invalid API key');
    });
  });

  describe('listApiKeys', () => {
    it('should not expose the encrypted key', () => {
      service.addApiKey('user-1', 'openai', 'sk-abcdefghijklmnop');
      const keys = service.listApiKeys('user-1');
      expect(keys).toHaveLength(1);
      expect((keys[0] as any).encryptedKey).toBeUndefined();
    });
  });

  describe('removeApiKey', () => {
    it('should remove a key by id', () => {
      const key = service.addApiKey('user-1', 'openai', 'sk-abcdefghijklmnop');
      service.removeApiKey('user-1', key.id);
      expect(service.listApiKeys('user-1')).toHaveLength(0);
    });

    it('should throw when key not found', () => {
      expect(() => service.removeApiKey('user-1', 'nonexistent')).toThrow('API key not found');
    });
  });

  describe('switchMode', () => {
    it('should default to token_hub mode', () => {
      expect(service.getMode('user-1')).toBe('token_hub');
    });

    it('should switch to direct mode when user has active key', () => {
      service.addApiKey('user-1', 'openai', 'sk-abcdefghijklmnop');
      const result = service.switchMode('user-1', 'direct');
      expect(result.mode).toBe('direct');
      expect(service.getMode('user-1')).toBe('direct');
    });

    it('should reject direct mode when no active key exists', () => {
      expect(() => service.switchMode('user-1', 'direct')).toThrow(
        'Cannot switch to direct mode',
      );
    });

    it('should allow switching back to token_hub mode', () => {
      service.addApiKey('user-1', 'openai', 'sk-abcdefghijklmnop');
      service.switchMode('user-1', 'direct');
      const result = service.switchMode('user-1', 'token_hub');
      expect(result.mode).toBe('token_hub');
    });
  });

  describe('getActiveKey', () => {
    it('should return the active key for a provider', () => {
      service.addApiKey('user-1', 'openai', 'sk-abcdefghijklmnop');
      const key = service.getActiveKey('user-1', 'openai');
      expect(key).toBe('sk-abcdefghijklmnop');
    });

    it('should return null when no key exists', () => {
      expect(service.getActiveKey('user-1', 'openai')).toBeNull();
    });
  });
});
