import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import type { AIProvider } from '@openclaw-club/shared';

/**
 * Stored user API key record.
 * Per requirement 15.9: users can switch to their own API keys for direct mode.
 */
export interface UserApiKeyRecord {
  id: string;
  userId: string;
  provider: AIProvider;
  /** Masked key for display (e.g., "sk-...abc") */
  maskedKey: string;
  /** The actual key — in production, encrypt at rest */
  encryptedKey: string;
  isActive: boolean;
  createdAt: string;
}

export type KeyMode = 'token_hub' | 'direct';

export interface UserKeyConfig {
  userId: string;
  mode: KeyMode;
}

@Injectable()
export class UserKeyService {
  private readonly logger = new Logger(UserKeyService.name);

  // In-memory stores (replace with DB in production)
  private keys: UserApiKeyRecord[] = [];
  private userModes = new Map<string, KeyMode>();
  private idCounter = 0;

  /**
   * Store a user's own API key for a provider.
   * In production, the key should be encrypted before storage.
   */
  addApiKey(userId: string, provider: AIProvider, apiKey: string): UserApiKeyRecord {
    if (!apiKey || apiKey.length < 8) {
      throw new BadRequestException('Invalid API key');
    }

    // Deactivate existing key for same provider
    for (const k of this.keys) {
      if (k.userId === userId && k.provider === provider) {
        k.isActive = false;
      }
    }

    const record: UserApiKeyRecord = {
      id: `ukey-${++this.idCounter}`,
      userId,
      provider,
      maskedKey: this.maskKey(apiKey),
      encryptedKey: apiKey, // In production: encrypt(apiKey)
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.keys.push(record);
    this.logger.log(`User ${userId} added API key for ${provider}`);
    return record;
  }

  /**
   * Remove a user's API key.
   */
  removeApiKey(userId: string, keyId: string): void {
    const idx = this.keys.findIndex((k) => k.id === keyId && k.userId === userId);
    if (idx === -1) throw new NotFoundException('API key not found');
    this.keys.splice(idx, 1);
  }

  /**
   * List a user's stored API keys (masked).
   */
  listApiKeys(userId: string): Omit<UserApiKeyRecord, 'encryptedKey'>[] {
    return this.keys
      .filter((k) => k.userId === userId)
      .map(({ encryptedKey, ...rest }) => rest);
  }

  /**
   * Switch between Token_Hub mode and direct (user's own key) mode.
   * When switching to direct mode, user must have at least one active key.
   */
  switchMode(userId: string, mode: KeyMode): UserKeyConfig {
    if (mode === 'direct') {
      const hasActiveKey = this.keys.some((k) => k.userId === userId && k.isActive);
      if (!hasActiveKey) {
        throw new BadRequestException(
          'Cannot switch to direct mode: no active API key configured. ' +
          'Please add an API key first.',
        );
      }
    }
    this.userModes.set(userId, mode);
    this.logger.log(`User ${userId} switched to ${mode} mode`);
    return { userId, mode };
  }

  /**
   * Get the current mode for a user (defaults to token_hub).
   */
  getMode(userId: string): KeyMode {
    return this.userModes.get(userId) ?? 'token_hub';
  }

  /**
   * Get the active API key for a user+provider (for direct mode routing).
   * Returns null if no active key exists.
   */
  getActiveKey(userId: string, provider: AIProvider): string | null {
    const record = this.keys.find(
      (k) => k.userId === userId && k.provider === provider && k.isActive,
    );
    return record?.encryptedKey ?? null;
  }

  private maskKey(key: string): string {
    if (key.length <= 8) return '****';
    return key.slice(0, 3) + '...' + key.slice(-3);
  }
}
