import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  TicketPriority,
  TicketStatus,
  SLA_RESPONSE_HOURS,
  SERVICE_LEVEL_PRIORITY,
  MIN_SATISFACTION_RATING,
  MAX_SATISFACTION_RATING,
  TICKET_NUMBER_PREFIX,
} from '@openclaw-club/shared';
import {
  CreateTicketDto,
  AssignTicketDto,
  UpdateTicketStatusDto,
  RateTicketDto,
} from './dto/ticket.dto';

// ─── In-memory record type ───

export interface Ticket {
  id: string;
  ticketNumber: string;
  userId: string;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description?: string;
  assignedAgentId?: string;
  slaResponseDeadline: Date;
  firstRespondedAt?: Date;
  resolvedAt?: Date;
  satisfactionRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketNotification {
  ticketId: string;
  ticketNumber: string;
  userId: string;
  type: 'status_change' | 'assignment' | 'escalation' | 'rating_request';
  oldStatus?: TicketStatus;
  newStatus?: TicketStatus;
  timestamp: Date;
}


/** Valid status transitions */
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ['in_progress', 'closed'],
  in_progress: ['waiting_on_customer', 'resolved', 'closed'],
  waiting_on_customer: ['in_progress', 'resolved', 'closed'],
  resolved: ['closed', 'open'], // reopen allowed
  closed: ['open'], // reopen allowed
};

@Injectable()
export class TicketService {
  private tickets = new Map<string, Ticket>();
  private notifications: TicketNotification[] = [];
  private ticketCounter = 0;

  // ─── Ticket Creation (Req 11.1) ───

  createTicket(dto: CreateTicketDto): Ticket {
    if (!dto.userId) throw new BadRequestException('userId is required');
    if (!dto.subject || dto.subject.trim() === '') {
      throw new BadRequestException('subject is required');
    }

    const priority = this.resolvePriority(dto.priority, dto.serviceLevel);
    const now = new Date();
    const slaHours = SLA_RESPONSE_HOURS[priority];
    const slaResponseDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

    this.ticketCounter++;
    const ticketNumber = `${TICKET_NUMBER_PREFIX}${String(this.ticketCounter).padStart(8, '0')}`;

    const ticket: Ticket = {
      id: crypto.randomUUID(),
      ticketNumber,
      userId: dto.userId,
      priority,
      status: 'open',
      subject: dto.subject.trim(),
      description: dto.description,
      slaResponseDeadline,
      createdAt: now,
      updatedAt: now,
    };

    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  // ─── Ticket Assignment (Req 11.7 — assign to Support_Agent) ───

  assignTicket(dto: AssignTicketDto): Ticket {
    const ticket = this.getTicket(dto.ticketId);
    if (!dto.agentId) throw new BadRequestException('agentId is required');

    ticket.assignedAgentId = dto.agentId;
    ticket.updatedAt = new Date();

    this.emitNotification(ticket, 'assignment');
    return ticket;
  }

  // ─── Ticket Status Update (Req 11.5) ───

  updateTicketStatus(dto: UpdateTicketStatusDto): Ticket {
    const ticket = this.getTicket(dto.ticketId);
    const validNext = VALID_TRANSITIONS[ticket.status];

    if (!validNext || !validNext.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from '${ticket.status}' to '${dto.status}'`,
      );
    }

    const oldStatus = ticket.status;
    ticket.status = dto.status;
    ticket.updatedAt = new Date();

    // Track first response (Req 11.2, 11.3)
    if (dto.status === 'in_progress' && !ticket.firstRespondedAt) {
      ticket.firstRespondedAt = new Date();
    }

    this.emitNotification(ticket, 'status_change', oldStatus, dto.status);
    return ticket;
  }

  // ─── Resolve Ticket ───

  resolveTicket(ticketId: string): Ticket {
    const ticket = this.getTicket(ticketId);
    const result = this.updateTicketStatus({ ticketId, status: 'resolved' });
    result.resolvedAt = new Date();

    // Emit rating request notification (Req 11.6)
    this.emitNotification(result, 'rating_request');
    return result;
  }

  // ─── Ticket Rating (Req 11.6) ───

  rateTicket(dto: RateTicketDto): Ticket {
    const ticket = this.getTicket(dto.ticketId);

    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      throw new BadRequestException('Can only rate resolved or closed tickets');
    }

    if (
      !Number.isInteger(dto.rating) ||
      dto.rating < MIN_SATISFACTION_RATING ||
      dto.rating > MAX_SATISFACTION_RATING
    ) {
      throw new BadRequestException(
        `Rating must be an integer between ${MIN_SATISFACTION_RATING} and ${MAX_SATISFACTION_RATING}`,
      );
    }

    ticket.satisfactionRating = dto.rating;
    ticket.updatedAt = new Date();
    return ticket;
  }

  // ─── SLA Escalation Check (Req 11.7) ───

  checkSlaEscalation(): Ticket[] {
    const now = new Date();
    const escalated: Ticket[] = [];

    for (const ticket of this.tickets.values()) {
      if (
        ticket.status === 'open' &&
        !ticket.firstRespondedAt &&
        now > ticket.slaResponseDeadline
      ) {
        // Auto-escalate priority
        const oldPriority = ticket.priority;
        if (ticket.priority === 'standard') {
          ticket.priority = 'priority';
        } else if (ticket.priority === 'priority') {
          ticket.priority = 'urgent';
        }
        // Recalculate SLA deadline from now with new priority
        const newSlaHours = SLA_RESPONSE_HOURS[ticket.priority];
        ticket.slaResponseDeadline = new Date(now.getTime() + newSlaHours * 60 * 60 * 1000);
        ticket.updatedAt = now;

        this.emitNotification(ticket, 'escalation');
        escalated.push(ticket);
      }
    }

    return escalated;
  }

  // ─── Queries ───

  getTicket(ticketId: string): Ticket {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);
    return ticket;
  }

  getTicketByNumber(ticketNumber: string): Ticket {
    for (const ticket of this.tickets.values()) {
      if (ticket.ticketNumber === ticketNumber) return ticket;
    }
    throw new NotFoundException(`Ticket ${ticketNumber} not found`);
  }

  listTicketsByUser(userId: string): Ticket[] {
    return Array.from(this.tickets.values()).filter((t) => t.userId === userId);
  }

  listTicketsByAgent(agentId: string): Ticket[] {
    return Array.from(this.tickets.values()).filter((t) => t.assignedAgentId === agentId);
  }

  getNotifications(): TicketNotification[] {
    return [...this.notifications];
  }

  // ─── Helpers ───

  private resolvePriority(explicit?: TicketPriority, serviceLevel?: string): TicketPriority {
    if (explicit) {
      const validPriorities: TicketPriority[] = ['standard', 'priority', 'urgent'];
      if (!validPriorities.includes(explicit)) {
        throw new BadRequestException(`Invalid priority: ${explicit}`);
      }
      return explicit;
    }
    if (serviceLevel && SERVICE_LEVEL_PRIORITY[serviceLevel]) {
      return SERVICE_LEVEL_PRIORITY[serviceLevel];
    }
    return 'standard';
  }

  private emitNotification(
    ticket: Ticket,
    type: TicketNotification['type'],
    oldStatus?: TicketStatus,
    newStatus?: TicketStatus,
  ): void {
    this.notifications.push({
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      userId: ticket.userId,
      type,
      oldStatus,
      newStatus,
      timestamp: new Date(),
    });
  }
}
