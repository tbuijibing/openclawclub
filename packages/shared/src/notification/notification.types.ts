import type { SupportedLanguage } from '../types';

export type NotificationChannel = 'email' | 'in_app';

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  language: SupportedLanguage;
  templateId?: string;
  templateData?: Record<string, unknown>;
}

export interface InAppNotification {
  userId: string;
  title: string;
  message: string;
  language: SupportedLanguage;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
}
