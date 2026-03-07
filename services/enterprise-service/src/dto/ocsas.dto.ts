import type { OcsasLevel } from '@openclaw-club/shared';

export interface ApplySecurityConfigDto {
  instanceId: string;
  ocsasLevel: OcsasLevel;
}

export interface GenerateAuditReportDto {
  instanceId: string;
  ocsasLevel: OcsasLevel;
}

export interface ScanVulnerabilitiesDto {
  instanceId: string;
}
