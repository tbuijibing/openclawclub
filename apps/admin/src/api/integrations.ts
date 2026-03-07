import { get, post, patch, del } from './client';

export const integrationsApi = {
  getStatus: (userId: string) => get<any>('/integrations/status', { userId }),
  getApiDocs: () => get<any>('/integrations/api-docs'),
  getPrivateModels: (enterpriseUserId: string) => get<any[]>('/integrations/private-models', { enterpriseUserId }),
};
