import { registerAs } from '@nestjs/config';

export const logtoConfig = registerAs('logto', () => ({
  endpoint: process.env.LOGTO_ENDPOINT || 'http://localhost:3001',
  appId: process.env.LOGTO_APP_ID || '',
  appSecret: process.env.LOGTO_APP_SECRET || '',
  m2mAppId: process.env.LOGTO_M2M_APP_ID || '',
  m2mAppSecret: process.env.LOGTO_M2M_APP_SECRET || '',
  webhookSecret: process.env.LOGTO_WEBHOOK_SECRET || '',
}));
