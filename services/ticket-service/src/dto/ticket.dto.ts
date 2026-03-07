import type { TicketPriority, TicketStatus } from '@openclaw-club/shared';

// ─── Ticket Creation (Req 11.1) ───

export interface CreateTicketDto {
  userId: string;
  subject: string;
  description?: string;
  priority?: TicketPriority;
  /** User's service level, used to auto-assign priority if not explicit */
  serviceLevel?: string;
}

// ─── Ticket Assignment (Req 11.7) ───

export interface AssignTicketDto {
  ticketId: string;
  agentId: string;
}

// ─── Ticket Status Update (Req 11.5) ───

export interface UpdateTicketStatusDto {
  ticketId: string;
  status: TicketStatus;
}

// ─── Ticket Rating (Req 11.6) ───

export interface RateTicketDto {
  ticketId: string;
  rating: number;
}
