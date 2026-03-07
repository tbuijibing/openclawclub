import type { AIProvider } from '@openclaw-club/shared';
import type { KeyMode } from '../user-key.service';

export class AddApiKeyDto {
  provider!: AIProvider;
  apiKey!: string;
}

export class SwitchModeDto {
  mode!: KeyMode;
}

export class AuditLogQueryDto {
  startDate?: string;
  endDate?: string;
}
