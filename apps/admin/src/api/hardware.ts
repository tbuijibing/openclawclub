import { get, post } from './client';

export const hardwareApi = {
  listProducts: (params?: { category?: string; region?: string }) =>
    get<any[]>('/hardware/products', params as Record<string, string>),
  getProduct: (id: string) => get<any>(`/hardware/products/${id}`),
  getOrder: (id: string) => get<any>(`/hardware/orders/${id}`),
  getShippingStatus: (orderId: string) => get<any>(`/hardware/orders/${orderId}/shipping`),
  requestAfterSales: (orderId: string, type: string, reason?: string) =>
    post<any>(`/hardware/orders/${orderId}/after-sales`, { type, reason }),
};
