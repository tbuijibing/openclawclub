// ─── Analytics & Reporting Types ───
// Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6

/** Supported report periods (Req 12.2) */
export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

/** Export formats (Req 12.3) */
export type ExportFormat = 'csv' | 'pdf';

/** Regions for regional stats (Req 12.4) */
export type AnalyticsRegion = 'apac' | 'na' | 'eu';

/** Conversion funnel stages (Req 12.5) */
export type FunnelStage = 'registered' | 'trial' | 'paid' | 'renewed';

/** Dashboard KPI keys (Req 12.1) */
export type DashboardMetric = 'active_users' | 'orders' | 'revenue' | 'satisfaction';

/** Anomaly detection threshold — 30% deviation from 7-day average (Req 12.6) */
export const ANOMALY_DEVIATION_THRESHOLD = 0.3;

/** Rolling window for anomaly baseline (Req 12.6) */
export const ANOMALY_ROLLING_WINDOW_DAYS = 7;

/** All supported funnel stages in order */
export const FUNNEL_STAGES: FunnelStage[] = ['registered', 'trial', 'paid', 'renewed'];
