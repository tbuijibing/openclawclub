import type {
  CookieCategory,
  DataRegion,
  VulnerabilitySeverity,
} from '@openclaw-club/shared';

// ─── Data Deletion (Req 13.4) ───

export interface RequestDataDeletionDto {
  userId: string;
  reason?: string;
}

export interface ProcessDataDeletionDto {
  requestId: string;
}

export interface GetDataDeletionStatusDto {
  requestId: string;
}

// ─── Cookie Consent (Req 13.7) ───

export interface RecordCookieConsentDto {
  userId: string;
  countryCode: string;
  categories: CookieCategory[];
}

export interface GetCookieConsentDto {
  userId: string;
}

export interface UpdateCookieConsentDto {
  userId: string;
  categories: CookieCategory[];
}

// ─── Data Isolation (Req 8.5) ───

export interface GetDataRegionDto {
  countryCode: string;
}

export interface ValidateDataResidencyDto {
  userId: string;
  targetRegion: DataRegion;
}

// ─── Vulnerability Scanning (Req 13.5) ───

export interface ScheduleQuarterlyScanDto {
  scheduledDate: string; // ISO date
}

export interface ReportVulnerabilityDto {
  scanId: string;
  title: string;
  severity: VulnerabilitySeverity;
  description: string;
  affectedComponent: string;
}

export interface TrackRemediationDto {
  vulnerabilityId: string;
  status: 'in_progress' | 'resolved';
  notes?: string;
}
