import { get, post } from './client';

export const analyticsApi = {
  getDashboard: (region?: string) => get<any>('/analytics/dashboard', region ? { region } : undefined),
  generateReport: (body: any) => post<any>('/analytics/reports', body),
  getReport: (id: string) => get<any>(`/analytics/reports/${id}`),
  getRegionalStats: () => get<any[]>('/analytics/regions'),
  getConversionFunnel: (params?: { region?: string; startDate?: string; endDate?: string }) =>
    get<any>('/analytics/funnel', params as Record<string, string>),
  getAnomalyAlerts: () => get<any[]>('/analytics/anomalies'),
};
