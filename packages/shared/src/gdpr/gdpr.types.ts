// ─── GDPR Compliance & Data Management Types ───
// Requirements: 13.4, 13.5, 13.7, 13.8, 8.5

/** Data deletion request status (Req 13.4) */
export type DataDeletionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

/** Cookie consent category (Req 13.7) */
export type CookieCategory =
  | 'essential'
  | 'analytics'
  | 'marketing'
  | 'preferences';

/** Data region for isolation (Req 8.5) */
export type DataRegion = 'eu' | 'apac' | 'na';

/** Vulnerability severity (Req 13.5) */
export type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low';

/** Vulnerability scan status */
export type ScanStatus = 'scheduled' | 'running' | 'completed' | 'failed';

/** Remediation status for vulnerabilities (Req 13.5) */
export type RemediationStatus =
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'overdue';

/** Maximum days to complete data deletion (Req 13.4) */
export const DATA_DELETION_MAX_DAYS = 30;

/** Critical vulnerability remediation SLA in hours (Req 13.5) */
export const CRITICAL_REMEDIATION_SLA_HOURS = 48;

/** Quarterly scan interval in days */
export const QUARTERLY_SCAN_INTERVAL_DAYS = 90;

/** EU country codes for GDPR applicability */
export const EU_COUNTRY_CODES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
] as const;

export type EUCountryCode = typeof EU_COUNTRY_CODES[number];
