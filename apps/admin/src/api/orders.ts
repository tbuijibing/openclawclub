import { get, post, patch } from './client';

export const ordersApi = {
  list: (userId?: string) => get<any[]>('/orders', userId ? { userId } : undefined),
  get: (id: string) => get<any>(`/orders/${id}`),
  updateStatus: (id: string, status: string) => patch<any>(`/orders/${id}/status`, { status }),
  requestRefund: (orderId: string, reason: string) => post<any>('/orders/refunds', { orderId, reason }),
  settleOrder: (orderId: string, engineerId: string) => post<any>('/orders/payments/settle', { orderId, engineerId }),
};
