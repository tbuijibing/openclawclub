import { get, post, patch } from './client';

export const ticketsApi = {
  list: (params?: { userId?: string; agentId?: string }) =>
    get<any[]>('/tickets', params as Record<string, string>),
  get: (id: string) => get<any>(`/tickets/${id}`),
  assign: (ticketId: string, agentId: string) => post<any>(`/tickets/${ticketId}/assign`, { agentId }),
  updateStatus: (ticketId: string, status: string) => patch<any>(`/tickets/${ticketId}/status`, { status }),
  resolve: (ticketId: string) => post<any>(`/tickets/${ticketId}/resolve`),
  checkSla: () => post<any>('/tickets/sla/check'),
};
