import { get, post } from './client';

export const complianceApi = {
  health: () => get<any>('/compliance/health'),
  getDataRegion: (countryCode: string) => get<any>('/compliance/data-region', { countryCode }),
  scheduleQuarterlyScan: (body: any) => post<any>('/compliance/scans', body),
  getVulnerabilityReport: (scanId: string) => get<any>(`/compliance/scans/${scanId}/report`),
  getAnomalies: () => get<any[]>('/compliance/vulnerabilities'),
};
