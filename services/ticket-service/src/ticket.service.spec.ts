import { TicketService } from './ticket.service';
import {
  SLA_RESPONSE_HOURS,
  MIN_SATISFACTION_RATING,
  MAX_SATISFACTION_RATING,
  TICKET_NUMBER_PREFIX,
} from '@openclaw-club/shared';

describe('TicketService', () => {
  let service: TicketService;

  beforeEach(() => {
    service = new TicketService();
  });

  // ─── Ticket Creation (Req 11.1) ───

  describe('createTicket', () => {
    it('should create a ticket with unique ticket number', () => {
      const ticket = service.createTicket({
        userId: 'user-1',
        subject: 'Cannot connect to Token_Hub',
      });

      expect(ticket.id).toBeDefined();
      expect(ticket.ticketNumber).toMatch(new RegExp(`^${TICKET_NUMBER_PREFIX}\\d{8}$`));
      expect(ticket.userId).toBe('user-1');
      expect(ticket.subject).toBe('Cannot connect to Token_Hub');
      expect(ticket.status).toBe('open');
      expect(ticket.priority).toBe('standard');
      expect(ticket.createdAt).toBeInstanceOf(Date);
    });

    it('should generate sequential unique ticket numbers', () => {
      const t1 = service.createTicket({ userId: 'u1', subject: 'Issue 1' });
      const t2 = service.createTicket({ userId: 'u2', subject: 'Issue 2' });
      const t3 = service.createTicket({ userId: 'u3', subject: 'Issue 3' });

      expect(t1.ticketNumber).not.toBe(t2.ticketNumber);
      expect(t2.ticketNumber).not.toBe(t3.ticketNumber);
      expect(t1.ticketNumber).toBe(`${TICKET_NUMBER_PREFIX}00000001`);
      expect(t2.ticketNumber).toBe(`${TICKET_NUMBER_PREFIX}00000002`);
    });

    it('should assign priority based on service level', () => {
      const individual = service.createTicket({
        userId: 'u1',
        subject: 'Help',
        serviceLevel: 'individual',
      });
      expect(individual.priority).toBe('standard');

      const enterprise = service.createTicket({
        userId: 'u2',
        subject: 'Help',
        serviceLevel: 'enterprise_standard',
      });
      expect(enterprise.priority).toBe('priority');

      const sla = service.createTicket({
        userId: 'u3',
        subject: 'Help',
        serviceLevel: 'enterprise_sla',
      });
      expect(sla.priority).toBe('urgent');
    });

    it('should use explicit priority over service level', () => {
      const ticket = service.createTicket({
        userId: 'u1',
        subject: 'Urgent issue',
        priority: 'urgent',
        serviceLevel: 'individual',
      });
      expect(ticket.priority).toBe('urgent');
    });

    it('should set SLA deadline based on priority — standard 24h', () => {
      const ticket = service.createTicket({
        userId: 'u1',
        subject: 'Help',
        priority: 'standard',
      });

      const expectedMs = SLA_RESPONSE_HOURS.standard * 60 * 60 * 1000;
      const diff = ticket.slaResponseDeadline.getTime() - ticket.createdAt.getTime();
      expect(diff).toBe(expectedMs);
    });

    it('should set SLA deadline based on priority — priority 4h', () => {
      const ticket = service.createTicket({
        userId: 'u1',
        subject: 'Help',
        priority: 'priority',
      });

      const expectedMs = SLA_RESPONSE_HOURS.priority * 60 * 60 * 1000;
      const diff = ticket.slaResponseDeadline.getTime() - ticket.createdAt.getTime();
      expect(diff).toBe(expectedMs);
    });

    it('should set SLA deadline based on priority — urgent 1h', () => {
      const ticket = service.createTicket({
        userId: 'u1',
        subject: 'Help',
        priority: 'urgent',
      });

      const expectedMs = SLA_RESPONSE_HOURS.urgent * 60 * 60 * 1000;
      const diff = ticket.slaResponseDeadline.getTime() - ticket.createdAt.getTime();
      expect(diff).toBe(expectedMs);
    });

    it('should include description when provided', () => {
      const ticket = service.createTicket({
        userId: 'u1',
        subject: 'Bug',
        description: 'Detailed description of the bug',
      });
      expect(ticket.description).toBe('Detailed description of the bug');
    });

    it('should throw for empty userId', () => {
      expect(() =>
        service.createTicket({ userId: '', subject: 'Help' }),
      ).toThrow(/userId is required/);
    });

    it('should throw for empty subject', () => {
      expect(() =>
        service.createTicket({ userId: 'u1', subject: '' }),
      ).toThrow(/subject is required/);
    });

    it('should throw for whitespace-only subject', () => {
      expect(() =>
        service.createTicket({ userId: 'u1', subject: '   ' }),
      ).toThrow(/subject is required/);
    });
  });

  // ─── Ticket Assignment (Req 11.7) ───

  describe('assignTicket', () => {
    let ticketId: string;

    beforeEach(() => {
      const ticket = service.createTicket({ userId: 'u1', subject: 'Help' });
      ticketId = ticket.id;
    });

    it('should assign a ticket to an agent', () => {
      const result = service.assignTicket({ ticketId, agentId: 'agent-1' });
      expect(result.assignedAgentId).toBe('agent-1');
    });

    it('should emit assignment notification', () => {
      service.assignTicket({ ticketId, agentId: 'agent-1' });
      const notifications = service.getNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('assignment');
      expect(notifications[0].ticketId).toBe(ticketId);
    });

    it('should allow reassignment', () => {
      service.assignTicket({ ticketId, agentId: 'agent-1' });
      const result = service.assignTicket({ ticketId, agentId: 'agent-2' });
      expect(result.assignedAgentId).toBe('agent-2');
    });

    it('should throw for empty agentId', () => {
      expect(() =>
        service.assignTicket({ ticketId, agentId: '' }),
      ).toThrow(/agentId is required/);
    });

    it('should throw for non-existent ticket', () => {
      expect(() =>
        service.assignTicket({ ticketId: 'non-existent', agentId: 'agent-1' }),
      ).toThrow(/not found/);
    });
  });

  // ─── Ticket Status Update (Req 11.5) ───

  describe('updateTicketStatus', () => {
    let ticketId: string;

    beforeEach(() => {
      const ticket = service.createTicket({ userId: 'u1', subject: 'Help' });
      ticketId = ticket.id;
    });

    it('should transition from open to in_progress', () => {
      const result = service.updateTicketStatus({ ticketId, status: 'in_progress' });
      expect(result.status).toBe('in_progress');
    });

    it('should record firstRespondedAt on first in_progress transition', () => {
      const result = service.updateTicketStatus({ ticketId, status: 'in_progress' });
      expect(result.firstRespondedAt).toBeInstanceOf(Date);
    });

    it('should not overwrite firstRespondedAt on subsequent transitions', () => {
      service.updateTicketStatus({ ticketId, status: 'in_progress' });
      const firstResponse = service.getTicket(ticketId).firstRespondedAt;

      service.updateTicketStatus({ ticketId, status: 'waiting_on_customer' });
      service.updateTicketStatus({ ticketId, status: 'in_progress' });

      expect(service.getTicket(ticketId).firstRespondedAt).toBe(firstResponse);
    });

    it('should emit status change notification (email + in-app)', () => {
      service.updateTicketStatus({ ticketId, status: 'in_progress' });
      const notifications = service.getNotifications();
      expect(notifications.length).toBeGreaterThanOrEqual(1);
      const statusNotif = notifications.find((n) => n.type === 'status_change');
      expect(statusNotif).toBeDefined();
      expect(statusNotif!.oldStatus).toBe('open');
      expect(statusNotif!.newStatus).toBe('in_progress');
    });

    it('should reject invalid status transitions', () => {
      expect(() =>
        service.updateTicketStatus({ ticketId, status: 'resolved' }),
      ).toThrow(/Cannot transition/);
    });

    it('should reject transition from open to waiting_on_customer', () => {
      expect(() =>
        service.updateTicketStatus({ ticketId, status: 'waiting_on_customer' }),
      ).toThrow(/Cannot transition/);
    });

    it('should allow reopen from resolved', () => {
      service.updateTicketStatus({ ticketId, status: 'in_progress' });
      service.updateTicketStatus({ ticketId, status: 'resolved' });
      const result = service.updateTicketStatus({ ticketId, status: 'open' });
      expect(result.status).toBe('open');
    });

    it('should throw for non-existent ticket', () => {
      expect(() =>
        service.updateTicketStatus({ ticketId: 'non-existent', status: 'in_progress' }),
      ).toThrow(/not found/);
    });
  });

  // ─── Resolve Ticket ───

  describe('resolveTicket', () => {
    let ticketId: string;

    beforeEach(() => {
      const ticket = service.createTicket({ userId: 'u1', subject: 'Help' });
      ticketId = ticket.id;
      service.updateTicketStatus({ ticketId, status: 'in_progress' });
    });

    it('should resolve a ticket and set resolvedAt', () => {
      const result = service.resolveTicket(ticketId);
      expect(result.status).toBe('resolved');
      expect(result.resolvedAt).toBeInstanceOf(Date);
    });

    it('should emit rating request notification after resolution', () => {
      service.resolveTicket(ticketId);
      const notifications = service.getNotifications();
      const ratingNotif = notifications.find((n) => n.type === 'rating_request');
      expect(ratingNotif).toBeDefined();
    });

    it('should throw if ticket cannot be resolved from current status', () => {
      // Ticket is already in_progress, resolve it, then try to resolve again
      service.resolveTicket(ticketId);
      // resolved -> resolved is not a valid transition
      expect(() => service.resolveTicket(ticketId)).toThrow(/Cannot transition/);
    });
  });

  // ─── Ticket Rating (Req 11.6) ───

  describe('rateTicket', () => {
    let ticketId: string;

    beforeEach(() => {
      const ticket = service.createTicket({ userId: 'u1', subject: 'Help' });
      ticketId = ticket.id;
      service.updateTicketStatus({ ticketId, status: 'in_progress' });
      service.resolveTicket(ticketId);
    });

    it('should rate a resolved ticket with valid rating', () => {
      const result = service.rateTicket({ ticketId, rating: 5 });
      expect(result.satisfactionRating).toBe(5);
    });

    it('should accept minimum rating', () => {
      const result = service.rateTicket({ ticketId, rating: MIN_SATISFACTION_RATING });
      expect(result.satisfactionRating).toBe(MIN_SATISFACTION_RATING);
    });

    it('should accept maximum rating', () => {
      const result = service.rateTicket({ ticketId, rating: MAX_SATISFACTION_RATING });
      expect(result.satisfactionRating).toBe(MAX_SATISFACTION_RATING);
    });

    it('should throw for rating below minimum', () => {
      expect(() =>
        service.rateTicket({ ticketId, rating: 0 }),
      ).toThrow(/Rating must be an integer between/);
    });

    it('should throw for rating above maximum', () => {
      expect(() =>
        service.rateTicket({ ticketId, rating: 6 }),
      ).toThrow(/Rating must be an integer between/);
    });

    it('should throw for non-integer rating', () => {
      expect(() =>
        service.rateTicket({ ticketId, rating: 3.5 }),
      ).toThrow(/Rating must be an integer between/);
    });

    it('should throw for rating an open ticket', () => {
      const openTicket = service.createTicket({ userId: 'u2', subject: 'Open' });
      expect(() =>
        service.rateTicket({ ticketId: openTicket.id, rating: 5 }),
      ).toThrow(/Can only rate resolved or closed tickets/);
    });

    it('should allow rating a closed ticket', () => {
      service.updateTicketStatus({ ticketId, status: 'closed' });
      const result = service.rateTicket({ ticketId, rating: 4 });
      expect(result.satisfactionRating).toBe(4);
    });
  });

  // ─── SLA Escalation (Req 11.7) ───

  describe('checkSlaEscalation', () => {
    it('should escalate standard ticket to priority when SLA exceeded', () => {
      const ticket = service.createTicket({
        userId: 'u1',
        subject: 'Help',
        priority: 'standard',
      });

      // Manually set SLA deadline to the past
      const t = service.getTicket(ticket.id);
      t.slaResponseDeadline = new Date(Date.now() - 1000);

      const escalated = service.checkSlaEscalation();
      expect(escalated).toHaveLength(1);
      expect(escalated[0].priority).toBe('priority');
    });

    it('should escalate priority ticket to urgent when SLA exceeded', () => {
      const ticket = service.createTicket({
        userId: 'u1',
        subject: 'Help',
        priority: 'priority',
      });

      const t = service.getTicket(ticket.id);
      t.slaResponseDeadline = new Date(Date.now() - 1000);

      const escalated = service.checkSlaEscalation();
      expect(escalated).toHaveLength(1);
      expect(escalated[0].priority).toBe('urgent');
    });

    it('should not escalate tickets that have been responded to', () => {
      const ticket = service.createTicket({
        userId: 'u1',
        subject: 'Help',
        priority: 'standard',
      });

      service.updateTicketStatus({ ticketId: ticket.id, status: 'in_progress' });

      const t = service.getTicket(ticket.id);
      t.slaResponseDeadline = new Date(Date.now() - 1000);

      const escalated = service.checkSlaEscalation();
      expect(escalated).toHaveLength(0);
    });

    it('should not escalate tickets within SLA deadline', () => {
      service.createTicket({
        userId: 'u1',
        subject: 'Help',
        priority: 'standard',
      });

      const escalated = service.checkSlaEscalation();
      expect(escalated).toHaveLength(0);
    });

    it('should emit escalation notification', () => {
      const ticket = service.createTicket({
        userId: 'u1',
        subject: 'Help',
        priority: 'standard',
      });

      const t = service.getTicket(ticket.id);
      t.slaResponseDeadline = new Date(Date.now() - 1000);

      service.checkSlaEscalation();
      const notifications = service.getNotifications();
      const escalationNotif = notifications.find((n) => n.type === 'escalation');
      expect(escalationNotif).toBeDefined();
    });

    it('should recalculate SLA deadline after escalation', () => {
      const ticket = service.createTicket({
        userId: 'u1',
        subject: 'Help',
        priority: 'standard',
      });

      const t = service.getTicket(ticket.id);
      t.slaResponseDeadline = new Date(Date.now() - 1000);

      service.checkSlaEscalation();

      const updated = service.getTicket(ticket.id);
      // New deadline should be in the future (priority = 4h from now)
      expect(updated.slaResponseDeadline.getTime()).toBeGreaterThan(Date.now() - 1000);
    });

    it('should not escalate non-open tickets', () => {
      const ticket = service.createTicket({
        userId: 'u1',
        subject: 'Help',
        priority: 'standard',
      });

      service.updateTicketStatus({ ticketId: ticket.id, status: 'in_progress' });
      service.resolveTicket(ticket.id);

      const t = service.getTicket(ticket.id);
      t.slaResponseDeadline = new Date(Date.now() - 1000);

      const escalated = service.checkSlaEscalation();
      expect(escalated).toHaveLength(0);
    });
  });

  // ─── Query Methods ───

  describe('queries', () => {
    it('should get ticket by number', () => {
      const ticket = service.createTicket({ userId: 'u1', subject: 'Help' });
      const found = service.getTicketByNumber(ticket.ticketNumber);
      expect(found.id).toBe(ticket.id);
    });

    it('should throw for non-existent ticket number', () => {
      expect(() => service.getTicketByNumber('TK99999999')).toThrow(/not found/);
    });

    it('should list tickets by user', () => {
      service.createTicket({ userId: 'u1', subject: 'A' });
      service.createTicket({ userId: 'u1', subject: 'B' });
      service.createTicket({ userId: 'u2', subject: 'C' });

      expect(service.listTicketsByUser('u1')).toHaveLength(2);
      expect(service.listTicketsByUser('u2')).toHaveLength(1);
      expect(service.listTicketsByUser('u3')).toHaveLength(0);
    });

    it('should list tickets by agent', () => {
      const t1 = service.createTicket({ userId: 'u1', subject: 'A' });
      const t2 = service.createTicket({ userId: 'u2', subject: 'B' });
      service.createTicket({ userId: 'u3', subject: 'C' });

      service.assignTicket({ ticketId: t1.id, agentId: 'agent-1' });
      service.assignTicket({ ticketId: t2.id, agentId: 'agent-1' });

      expect(service.listTicketsByAgent('agent-1')).toHaveLength(2);
      expect(service.listTicketsByAgent('agent-2')).toHaveLength(0);
    });
  });
});
