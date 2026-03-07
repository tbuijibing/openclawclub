// ─── Ticket Service Types ───
// Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7

/** Ticket priority levels (Req 11.1) */
export type TicketPriority = 'standard' | 'priority' | 'urgent';

/** Ticket status (Req 11.5) */
export type TicketStatus = 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed';

/** SLA response times in hours by priority (Req 11.2, 11.3, 11.4) */
export const SLA_RESPONSE_HOURS: Record<TicketPriority, number> = {
  standard: 24,
  priority: 4,
  urgent: 1, // 7x24 enterprise — 1h target within continuous support
};

/** Service level to default ticket priority mapping (Req 11.1) */
export const SERVICE_LEVEL_PRIORITY: Record<string, TicketPriority> = {
  individual: 'standard',
  enterprise_standard: 'priority',
  enterprise_sla: 'urgent',
};

/** Satisfaction rating range (Req 11.6) */
export const MIN_SATISFACTION_RATING = 1;
export const MAX_SATISFACTION_RATING = 5;

/** Ticket number prefix */
export const TICKET_NUMBER_PREFIX = 'TK';
