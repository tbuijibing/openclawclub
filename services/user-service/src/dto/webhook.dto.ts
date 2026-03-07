/** Logto webhook event payload for user registration */
export interface LogtoWebhookPayload {
  event: string;
  createdAt: string;
  userAgent?: string;
  ip?: string;
  data?: {
    id: string;
    username?: string;
    primaryEmail?: string;
    name?: string;
    avatar?: string;
    identities?: Record<string, unknown>;
  };
}
