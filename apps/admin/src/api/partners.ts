import { get, post, patch } from './client';

export const partnersApi = {
  listApplications: (userId?: string) => get<any[]>('/partners/applications', userId ? { userId } : undefined),
  getApplication: (id: string) => get<any>(`/partners/applications/${id}`),
  reviewApplication: (id: string, body: { approved: boolean; reviewNotes?: string }) =>
    post<any>(`/partners/applications/${id}/review`, body),
  getDashboard: (partnerId: string) => get<any>(`/partners/dashboard/${partnerId}`),
  listVendors: () => get<any[]>('/partners/vendors'),
  getVendor: (id: string) => get<any>(`/partners/vendors/${id}`),
  convertVendor: (vendorId: string) => post<any>(`/partners/vendors/${vendorId}/convert`),
  settleMonthly: (body: any) => post<any>('/partners/earnings/settle', body),
};
