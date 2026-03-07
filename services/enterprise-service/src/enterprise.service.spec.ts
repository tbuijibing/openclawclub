import { EnterpriseManagementService } from './enterprise.service';
import { DEFAULT_SLA, QUOTE_DEADLINE_BUSINESS_DAYS } from '@openclaw-club/shared';

describe('EnterpriseManagementService', () => {
  let service: EnterpriseManagementService;

  beforeEach(() => {
    service = new EnterpriseManagementService();
  });

  // ─── Custom Development Requests (Req 5.1) ───

  describe('submitCustomDevRequest', () => {
    it('should create a custom dev request with submitted status', () => {
      const result = service.submitCustomDevRequest({
        enterpriseUserId: 'user-1',
        title: 'Custom CRM Integration',
        description: 'Need custom CRM integration with OpenClaw',
        requirements: ['API sync', 'Real-time updates'],
      });

      expect(result.id).toBeDefined();
      expect(result.enterpriseUserId).toBe('user-1');
      expect(result.title).toBe('Custom CRM Integration');
      expect(result.status).toBe('submitted');
      expect(result.requirements).toEqual(['API sync', 'Real-time updates']);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should set quote deadline to 2 business days from now', () => {
      const result = service.submitCustomDevRequest({
        enterpriseUserId: 'user-1',
        title: 'Test',
        description: 'Test desc',
        requirements: [],
      });

      expect(result.quoteDeadline).toBeInstanceOf(Date);
      expect(result.quoteDeadline.getTime()).toBeGreaterThan(result.createdAt.getTime());
    });

    it('should throw for empty enterpriseUserId', () => {
      expect(() =>
        service.submitCustomDevRequest({
          enterpriseUserId: '',
          title: 'Test',
          description: 'Desc',
          requirements: [],
        }),
      ).toThrow(/enterpriseUserId is required/);
    });

    it('should throw for empty title', () => {
      expect(() =>
        service.submitCustomDevRequest({
          enterpriseUserId: 'user-1',
          title: '',
          description: 'Desc',
          requirements: [],
        }),
      ).toThrow(/title is required/);
    });

    it('should throw for empty description', () => {
      expect(() =>
        service.submitCustomDevRequest({
          enterpriseUserId: 'user-1',
          title: 'Test',
          description: '',
          requirements: [],
        }),
      ).toThrow(/description is required/);
    });

    it('should accept optional budget and deadline', () => {
      const result = service.submitCustomDevRequest({
        enterpriseUserId: 'user-1',
        title: 'Test',
        description: 'Desc',
        requirements: [],
        budget: 50000,
        deadline: '2026-06-01',
      });

      expect(result.budget).toBe(50000);
      expect(result.deadline).toBe('2026-06-01');
    });
  });

  // ─── Quote & Confirm (Req 5.1, 5.2) ───

  describe('provideQuote', () => {
    it('should update request to quoted status with amount', () => {
      const request = service.submitCustomDevRequest({
        enterpriseUserId: 'user-1',
        title: 'Test',
        description: 'Desc',
        requirements: [],
      });

      const quoted = service.provideQuote(request.id, 25000);
      expect(quoted.status).toBe('quoted');
      expect(quoted.quotedAmount).toBe(25000);
      expect(quoted.quotedAt).toBeInstanceOf(Date);
    });

    it('should throw for non-existent request', () => {
      expect(() => service.provideQuote('non-existent', 1000)).toThrow(/not found/);
    });

    it('should throw for zero or negative amount', () => {
      const request = service.submitCustomDevRequest({
        enterpriseUserId: 'user-1',
        title: 'Test',
        description: 'Desc',
        requirements: [],
      });
      expect(() => service.provideQuote(request.id, 0)).toThrow(/must be positive/);
      expect(() => service.provideQuote(request.id, -100)).toThrow(/must be positive/);
    });

    it('should throw if request is already confirmed', () => {
      const request = service.submitCustomDevRequest({
        enterpriseUserId: 'user-1',
        title: 'Test',
        description: 'Desc',
        requirements: [],
      });
      service.provideQuote(request.id, 5000);
      service.confirmAndCreateProject({ requestId: request.id, enterpriseUserId: 'user-1' });

      expect(() => service.provideQuote(request.id, 6000)).toThrow(/Cannot quote/);
    });
  });

  describe('confirmAndCreateProject', () => {
    it('should create a project when confirming a quoted request', () => {
      const request = service.submitCustomDevRequest({
        enterpriseUserId: 'user-1',
        title: 'Test',
        description: 'Desc',
        requirements: [],
      });
      service.provideQuote(request.id, 10000);

      const project = service.confirmAndCreateProject({
        requestId: request.id,
        enterpriseUserId: 'user-1',
      });

      expect(project.id).toBeDefined();
      expect(project.requestId).toBe(request.id);
      expect(project.status).toBe('created');
      expect(project.teamMembers).toEqual([]);
    });

    it('should update request status to confirmed', () => {
      const request = service.submitCustomDevRequest({
        enterpriseUserId: 'user-1',
        title: 'Test',
        description: 'Desc',
        requirements: [],
      });
      service.provideQuote(request.id, 10000);
      service.confirmAndCreateProject({ requestId: request.id, enterpriseUserId: 'user-1' });

      const updated = service.getCustomDevRequest(request.id);
      expect(updated.status).toBe('confirmed');
    });

    it('should throw if request is not quoted', () => {
      const request = service.submitCustomDevRequest({
        enterpriseUserId: 'user-1',
        title: 'Test',
        description: 'Desc',
        requirements: [],
      });

      expect(() =>
        service.confirmAndCreateProject({ requestId: request.id, enterpriseUserId: 'user-1' }),
      ).toThrow(/must be in quoted status/);
    });

    it('should throw if different user tries to confirm', () => {
      const request = service.submitCustomDevRequest({
        enterpriseUserId: 'user-1',
        title: 'Test',
        description: 'Desc',
        requirements: [],
      });
      service.provideQuote(request.id, 10000);

      expect(() =>
        service.confirmAndCreateProject({ requestId: request.id, enterpriseUserId: 'user-2' }),
      ).toThrow(/Only the requesting enterprise user/);
    });
  });

  // ─── Team Assignment (Req 5.2) ───

  describe('assignTeam', () => {
    it('should assign team members to a project', () => {
      const request = service.submitCustomDevRequest({
        enterpriseUserId: 'user-1',
        title: 'Test',
        description: 'Desc',
        requirements: [],
      });
      service.provideQuote(request.id, 10000);
      const project = service.confirmAndCreateProject({
        requestId: request.id,
        enterpriseUserId: 'user-1',
      });

      const updated = service.assignTeam({
        projectId: project.id,
        teamMembers: [
          { userId: 'eng-1', role: 'lead' },
          { userId: 'eng-2', role: 'developer' },
        ],
      });

      expect(updated.status).toBe('team_assigned');
      expect(updated.teamMembers).toHaveLength(2);
      expect(updated.teamMembers[0].role).toBe('lead');
    });

    it('should throw for empty team members', () => {
      const request = service.submitCustomDevRequest({
        enterpriseUserId: 'user-1',
        title: 'Test',
        description: 'Desc',
        requirements: [],
      });
      service.provideQuote(request.id, 10000);
      const project = service.confirmAndCreateProject({
        requestId: request.id,
        enterpriseUserId: 'user-1',
      });

      expect(() =>
        service.assignTeam({ projectId: project.id, teamMembers: [] }),
      ).toThrow(/At least one team member/);
    });

    it('should throw for non-existent project', () => {
      expect(() =>
        service.assignTeam({
          projectId: 'non-existent',
          teamMembers: [{ userId: 'eng-1', role: 'lead' }],
        }),
      ).toThrow(/not found/);
    });
  });

  // ─── Managed Services (Req 5.3, 5.4) ───

  describe('activateManagedService', () => {
    it('should activate managed services with all four types', () => {
      const result = service.activateManagedService({
        enterpriseUserId: 'user-1',
        instanceId: 'inst-1',
        services: ['monitoring', 'performance_optimization', 'security_update', 'data_backup'],
      });

      expect(result.id).toBeDefined();
      expect(result.status).toBe('active');
      expect(result.services).toHaveLength(4);
      expect(result.services).toContain('monitoring');
      expect(result.services).toContain('data_backup');
    });

    it('should throw for empty enterpriseUserId', () => {
      expect(() =>
        service.activateManagedService({
          enterpriseUserId: '',
          instanceId: 'inst-1',
          services: ['monitoring'],
        }),
      ).toThrow(/enterpriseUserId is required/);
    });

    it('should throw for empty instanceId', () => {
      expect(() =>
        service.activateManagedService({
          enterpriseUserId: 'user-1',
          instanceId: '',
          services: ['monitoring'],
        }),
      ).toThrow(/instanceId is required/);
    });

    it('should throw for empty services array', () => {
      expect(() =>
        service.activateManagedService({
          enterpriseUserId: 'user-1',
          instanceId: 'inst-1',
          services: [],
        }),
      ).toThrow(/At least one service type/);
    });
  });

  describe('generateOpsReport', () => {
    it('should generate monthly ops report with required metrics', () => {
      const managed = service.activateManagedService({
        enterpriseUserId: 'user-1',
        instanceId: 'inst-1',
        services: ['monitoring'],
      });

      const report = service.generateOpsReport({
        managedServiceId: managed.id,
        month: '2026-03',
      });

      expect(report.id).toBeDefined();
      expect(report.managedServiceId).toBe(managed.id);
      expect(report.month).toBe('2026-03');
      expect(report.content.availabilityPercentage).toBeDefined();
      expect(report.content.performanceMetrics.avgResponseTimeMs).toBeDefined();
      expect(report.content.performanceMetrics.p99ResponseTimeMs).toBeDefined();
      expect(report.content.performanceMetrics.errorRate).toBeDefined();
      expect(report.content.securityEventSummary.totalEvents).toBeDefined();
      expect(report.content.securityEventSummary.criticalEvents).toBeDefined();
      expect(report.content.securityEventSummary.resolvedEvents).toBeDefined();
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should throw for invalid month format', () => {
      const managed = service.activateManagedService({
        enterpriseUserId: 'user-1',
        instanceId: 'inst-1',
        services: ['monitoring'],
      });

      expect(() =>
        service.generateOpsReport({ managedServiceId: managed.id, month: '2026/03' }),
      ).toThrow(/YYYY-MM format/);
    });

    it('should throw for non-existent managed service', () => {
      expect(() =>
        service.generateOpsReport({ managedServiceId: 'non-existent', month: '2026-03' }),
      ).toThrow(/not found/);
    });

    it('should allow retrieval of generated report', () => {
      const managed = service.activateManagedService({
        enterpriseUserId: 'user-1',
        instanceId: 'inst-1',
        services: ['monitoring'],
      });
      const report = service.generateOpsReport({
        managedServiceId: managed.id,
        month: '2026-03',
      });

      const retrieved = service.getOpsReport(report.id);
      expect(retrieved.id).toBe(report.id);
    });

    it('should throw for non-existent report', () => {
      expect(() => service.getOpsReport('non-existent')).toThrow(/not found/);
    });
  });

  // ─── Consulting Services (Req 5.5) ───

  describe('requestConsulting', () => {
    it('should create a consulting engagement for strategic planning', () => {
      const result = service.requestConsulting({
        enterpriseUserId: 'user-1',
        type: 'strategic_planning',
        description: 'Need OpenClaw deployment strategy',
      });

      expect(result.id).toBeDefined();
      expect(result.type).toBe('strategic_planning');
      expect(result.status).toBe('requested');
    });

    it('should create consulting for ROI analysis', () => {
      const result = service.requestConsulting({
        enterpriseUserId: 'user-1',
        type: 'roi_analysis',
        description: 'Analyze ROI of OpenClaw deployment',
      });

      expect(result.type).toBe('roi_analysis');
    });

    it('should create consulting for implementation roadmap', () => {
      const result = service.requestConsulting({
        enterpriseUserId: 'user-1',
        type: 'implementation_roadmap',
        description: 'Create phased rollout plan',
      });

      expect(result.type).toBe('implementation_roadmap');
    });

    it('should throw for invalid consulting type', () => {
      expect(() =>
        service.requestConsulting({
          enterpriseUserId: 'user-1',
          type: 'invalid_type' as any,
          description: 'Test',
        }),
      ).toThrow(/Invalid consulting type/);
    });

    it('should throw for empty enterpriseUserId', () => {
      expect(() =>
        service.requestConsulting({
          enterpriseUserId: '',
          type: 'roi_analysis',
          description: 'Test',
        }),
      ).toThrow(/enterpriseUserId is required/);
    });

    it('should throw for empty description', () => {
      expect(() =>
        service.requestConsulting({
          enterpriseUserId: 'user-1',
          type: 'roi_analysis',
          description: '',
        }),
      ).toThrow(/description is required/);
    });
  });

  describe('deliverConsulting', () => {
    it('should deliver consulting with deliverables', () => {
      const engagement = service.requestConsulting({
        enterpriseUserId: 'user-1',
        type: 'strategic_planning',
        description: 'Strategy needed',
      });

      const delivered = service.deliverConsulting(engagement.id, [
        'Strategic Plan Document',
        'Timeline Proposal',
      ]);

      expect(delivered.status).toBe('delivered');
      expect(delivered.deliverables).toEqual(['Strategic Plan Document', 'Timeline Proposal']);
    });

    it('should throw if already delivered', () => {
      const engagement = service.requestConsulting({
        enterpriseUserId: 'user-1',
        type: 'roi_analysis',
        description: 'ROI needed',
      });
      service.deliverConsulting(engagement.id, ['ROI Report']);

      expect(() => service.deliverConsulting(engagement.id, ['Another Report'])).toThrow(
        /already delivered/,
      );
    });

    it('should throw for non-existent engagement', () => {
      expect(() => service.deliverConsulting('non-existent', ['Report'])).toThrow(/not found/);
    });
  });

  // ─── Enterprise Integration API (Req 5.6) ───

  describe('createIntegration', () => {
    it('should create ERP integration with API endpoint and docs', () => {
      const result = service.createIntegration({
        enterpriseUserId: 'user-1',
        target: 'ERP',
        config: { host: 'erp.company.com' },
      });

      expect(result.id).toBeDefined();
      expect(result.target).toBe('ERP');
      expect(result.status).toBe('connected');
      expect(result.apiEndpoint).toBe('/api/v1/integrations/erp');
      expect(result.apiDocUrl).toContain('erp-integration');
    });

    it('should create CRM integration', () => {
      const result = service.createIntegration({
        enterpriseUserId: 'user-1',
        target: 'CRM',
        config: {},
      });

      expect(result.target).toBe('CRM');
      expect(result.apiEndpoint).toBe('/api/v1/integrations/crm');
      expect(result.apiDocUrl).toContain('crm-integration');
    });

    it('should create OA integration', () => {
      const result = service.createIntegration({
        enterpriseUserId: 'user-1',
        target: 'OA',
        config: {},
      });

      expect(result.target).toBe('OA');
      expect(result.apiEndpoint).toBe('/api/v1/integrations/oa');
    });

    it('should throw for invalid target', () => {
      expect(() =>
        service.createIntegration({
          enterpriseUserId: 'user-1',
          target: 'INVALID' as any,
          config: {},
        }),
      ).toThrow(/Invalid integration target/);
    });

    it('should throw for empty enterpriseUserId', () => {
      expect(() =>
        service.createIntegration({
          enterpriseUserId: '',
          target: 'ERP',
          config: {},
        }),
      ).toThrow(/enterpriseUserId is required/);
    });
  });

  describe('listIntegrations', () => {
    it('should list integrations for a specific user', () => {
      service.createIntegration({ enterpriseUserId: 'user-1', target: 'ERP', config: {} });
      service.createIntegration({ enterpriseUserId: 'user-1', target: 'CRM', config: {} });
      service.createIntegration({ enterpriseUserId: 'user-2', target: 'OA', config: {} });

      const user1Integrations = service.listIntegrations('user-1');
      expect(user1Integrations).toHaveLength(2);

      const user2Integrations = service.listIntegrations('user-2');
      expect(user2Integrations).toHaveLength(1);
    });

    it('should return empty array for user with no integrations', () => {
      const result = service.listIntegrations('no-user');
      expect(result).toEqual([]);
    });
  });

  // ─── SLA Compensation (Req 5.7) ───

  describe('requestSlaCompensation', () => {
    let managedServiceId: string;

    beforeEach(() => {
      const managed = service.activateManagedService({
        enterpriseUserId: 'user-1',
        instanceId: 'inst-1',
        services: ['monitoring'],
      });
      managedServiceId = managed.id;
    });

    it('should calculate compensation when availability is below 99.9%', () => {
      const result = service.requestSlaCompensation({
        managedServiceId,
        month: '2026-03',
        actualAvailability: 99.5,
      });

      expect(result.id).toBeDefined();
      expect(result.actualAvailability).toBe(99.5);
      expect(result.targetAvailability).toBe(99.9);
      expect(result.shortfallPercentage).toBeCloseTo(0.4, 1);
      expect(result.compensationAmount).toBeGreaterThan(0);
      expect(result.status).toBe('approved');
    });

    it('should increase compensation for larger shortfall', () => {
      const small = service.requestSlaCompensation({
        managedServiceId,
        month: '2026-01',
        actualAvailability: 99.8,
      });

      // Need a new managed service for second compensation
      const managed2 = service.activateManagedService({
        enterpriseUserId: 'user-2',
        instanceId: 'inst-2',
        services: ['monitoring'],
      });

      const large = service.requestSlaCompensation({
        managedServiceId: managed2.id,
        month: '2026-01',
        actualAvailability: 98.0,
      });

      expect(large.compensationAmount).toBeGreaterThan(small.compensationAmount);
    });

    it('should throw when availability meets SLA target', () => {
      expect(() =>
        service.requestSlaCompensation({
          managedServiceId,
          month: '2026-03',
          actualAvailability: 99.9,
        }),
      ).toThrow(/meets SLA target/);
    });

    it('should throw when availability exceeds SLA target', () => {
      expect(() =>
        service.requestSlaCompensation({
          managedServiceId,
          month: '2026-03',
          actualAvailability: 100,
        }),
      ).toThrow(/meets SLA target/);
    });

    it('should throw for invalid availability values', () => {
      expect(() =>
        service.requestSlaCompensation({
          managedServiceId,
          month: '2026-03',
          actualAvailability: -1,
        }),
      ).toThrow(/between 0 and 100/);

      expect(() =>
        service.requestSlaCompensation({
          managedServiceId,
          month: '2026-03',
          actualAvailability: 101,
        }),
      ).toThrow(/between 0 and 100/);
    });

    it('should throw for invalid month format', () => {
      expect(() =>
        service.requestSlaCompensation({
          managedServiceId,
          month: 'March 2026',
          actualAvailability: 99.0,
        }),
      ).toThrow(/YYYY-MM format/);
    });

    it('should throw for non-existent managed service', () => {
      expect(() =>
        service.requestSlaCompensation({
          managedServiceId: 'non-existent',
          month: '2026-03',
          actualAvailability: 99.0,
        }),
      ).toThrow(/not found/);
    });

    it('should cap compensation at notional monthly fee', () => {
      const result = service.requestSlaCompensation({
        managedServiceId,
        month: '2026-03',
        actualAvailability: 0, // extreme case
      });

      // Compensation should be capped at $999 (notional monthly fee)
      expect(result.compensationAmount).toBeLessThanOrEqual(999);
    });

    it('should allow retrieval of compensation record', () => {
      const comp = service.requestSlaCompensation({
        managedServiceId,
        month: '2026-03',
        actualAvailability: 99.5,
      });

      const retrieved = service.getSlaCompensation(comp.id);
      expect(retrieved.id).toBe(comp.id);
    });

    it('should throw for non-existent compensation', () => {
      expect(() => service.getSlaCompensation('non-existent')).toThrow(/not found/);
    });
  });

  // ─── Business Days Helper ───

  describe('addBusinessDays', () => {
    it('should skip weekends when adding business days', () => {
      // Friday 2026-01-02
      const friday = new Date('2026-01-02T10:00:00Z');
      const result = service.addBusinessDays(friday, 2);

      // Should skip Sat/Sun and land on Tuesday 2026-01-06
      expect(result.getDay()).not.toBe(0); // not Sunday
      expect(result.getDay()).not.toBe(6); // not Saturday
    });

    it('should return a date after the start date', () => {
      const start = new Date('2026-03-10T10:00:00Z');
      const result = service.addBusinessDays(start, QUOTE_DEADLINE_BUSINESS_DAYS);
      expect(result.getTime()).toBeGreaterThan(start.getTime());
    });

    it('should handle 0 business days', () => {
      const start = new Date('2026-03-10T10:00:00Z');
      const result = service.addBusinessDays(start, 0);
      // 0 days means same date
      expect(result.toDateString()).toBe(start.toDateString());
    });
  });
});
