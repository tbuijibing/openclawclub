import type {
  ReportPeriod,
  ExportFormat,
  AnalyticsRegion,
  DashboardMetric,
} from '@openclaw-club/shared';

// ─── Dashboard (Req 12.1) ───

export interface GetDashboardDto {
  region?: AnalyticsRegion;
}

// ─── Reports (Req 12.2, 12.3) ───

export interface GenerateReportDto {
  period: ReportPeriod;
  region?: AnalyticsRegion;
  startDate: string; // ISO date
  endDate: string;   // ISO date
}

export interface ExportReportDto {
  reportId: string;
  format: ExportFormat;
}

// ─── Regional Stats (Req 12.4) ───

export interface GetRegionalStatsDto {
  region: AnalyticsRegion;
  period?: ReportPeriod;
}

// ─── Conversion Funnel (Req 12.5) ───

export interface GetConversionFunnelDto {
  startDate?: string;
  endDate?: string;
  region?: AnalyticsRegion;
}

// ─── Anomaly Alerts (Req 12.6) ───

export interface RecordMetricDto {
  metric: DashboardMetric;
  value: number;
  region?: AnalyticsRegion;
  date: string; // ISO date
}

export interface CheckAnomaliesDto {
  date: string; // ISO date
}
