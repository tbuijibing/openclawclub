// ─── Enterprise Service Management Types ───
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7

/** Custom development request status */
export type CustomDevRequestStatus =
  | 'submitted'
  | 'under_review'
  | 'quoted'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/** Project status */
export type ProjectStatus =
  | 'created'
  | 'team_assigned'
  | 'in_progress'
  | 'delivered'
  | 'accepted';

/** Managed service type */
export type ManagedServiceType =
  | 'monitoring'
  | 'performance_optimization'
  | 'security_update'
  | 'data_backup';

/** Managed service status */
export type ManagedServiceStatus = 'active' | 'suspended' | 'terminated';

/** Consulting service type */
export type ConsultingServiceType =
  | 'strategic_planning'
  | 'roi_analysis'
  | 'implementation_roadmap';

/** Consulting engagement status */
export type ConsultingStatus = 'requested' | 'scheduled' | 'in_progress' | 'delivered';

/** Integration target system */
export type IntegrationTarget = 'ERP' | 'CRM' | 'OA';

/** Integration status */
export type IntegrationStatus = 'pending' | 'connected' | 'failed' | 'disconnected';

/** SLA compensation status */
export type SlaCompensationStatus = 'pending' | 'approved' | 'paid' | 'rejected';

/** SLA tier with availability target */
export interface SlaTier {
  availabilityTarget: number; // e.g. 99.9
  responseTimeHours: number;
  compensationPercentage: number; // % of monthly fee per 0.1% below target
}

/** Default SLA: 99.9% availability */
export const DEFAULT_SLA: SlaTier = {
  availabilityTarget: 99.9,
  responseTimeHours: 1,
  compensationPercentage: 10, // 10% per 0.1% below target
};

/** Monthly ops report content */
export interface OpsReportContent {
  availabilityPercentage: number;
  performanceMetrics: {
    avgResponseTimeMs: number;
    p99ResponseTimeMs: number;
    errorRate: number;
  };
  securityEventSummary: {
    totalEvents: number;
    criticalEvents: number;
    resolvedEvents: number;
  };
}

/** Quote assessment deadline in business days */
export const QUOTE_DEADLINE_BUSINESS_DAYS = 2;
