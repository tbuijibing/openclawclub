import { get, post, patch } from './client';

export const installationsApi = {
  getTiers: () => get<any[]>('/installations/tiers'),
  listOrders: (params?: { userId?: string; engineerId?: string }) =>
    get<any[]>('/installations/orders', params as Record<string, string>),
  getOrder: (id: string) => get<any>(`/installations/orders/${id}`),
  updateProgress: (id: string, status: string) => patch<any>(`/installations/orders/${id}/progress`, { status }),
  dispatchOrder: (id: string, userTimezone?: string) => post<any>(`/installations/orders/${id}/dispatch`, { userTimezone }),
};
