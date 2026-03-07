import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CustomDevRequestStatus,
  ProjectStatus,
  ManagedServiceStatus,
  ManagedServiceType,
  ConsultingServiceType,
  ConsultingStatus,
  IntegrationTarget,
  IntegrationStatus,
  SlaCompensationStatus,
  OpsReportContent,
  DEFAULT_SLA,
  QUOTE_DEADLINE_BUSINESS_DAYS,
} from '@openclaw-club/shared';
import {
  SubmitCustomDevRequestDto,
  ConfirmCustomDevDto,
  AssignTeamDto,
  ActivateManagedServiceDto,
  GenerateOpsReportDto,
  RequestConsultingDto,
  CreateIntegrationDto,
  RequestSlaCompensationDto,
} from './dto/enterprise.dto';

// ─── In-memory record types ───

export interface CustomDevRequest {
  id: string;
  enterpriseUserId: string;
  title: string;
  description: string;
  requirements: string[];
  budget?: number;
  deadline?: string;
  status: CustomDevRequestStatus;
  quotedAmount?: number;
  quotedAt?: Date;
  quoteDeadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  requestId: string;
  enterpriseUserId: string;
  status: ProjectStatus;
  teamMembers: { userId: string; role: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ManagedService {
  id: string;
  enterpriseUserId: string;
  instanceId: string;
  services: ManagedServiceType[];
  status: ManagedServiceStatus;
  createdAt: Date;
}

export interface OpsReport {
  id: string;
  managedServiceId: string;
  month: string;
  content: OpsReportContent;
  generatedAt: Date;
}

export interface ConsultingEngagement {
  id: string;
  enterpriseUserId: string;
  type: ConsultingServiceType;
  description: string;
  status: ConsultingStatus;
  deliverables?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EnterpriseIntegration {
  id: string;
  enterpriseUserId: string;
  target: IntegrationTarget;
  config: Record<string, string>;
  status: IntegrationStatus;
  apiEndpoint: string;
  apiDocUrl: string;
  createdAt: Date;
}

export interface SlaCompensation {
  id: string;
  managedServiceId: string;
  month: string;
  actualAvailability: number;
  targetAvailability: number;
  shortfallPercentage: number;
  compensationAmount: number;
  status: SlaCompensationStatus;
  createdAt: Date;
}

// ─── API endpoint & doc URL templates ───

const INTEGRATION_ENDPOINTS: Record<IntegrationTarget, string> = {
  ERP: '/api/v1/integrations/erp',
  CRM: '/api/v1/integrations/crm',
  OA: '/api/v1/integrations/oa',
};

const INTEGRATION_DOC_URLS: Record<IntegrationTarget, string> = {
  ERP: 'https://docs.openclaw.club/api/erp-integration',
  CRM: 'https://docs.openclaw.club/api/crm-integration',
  OA: 'https://docs.openclaw.club/api/oa-integration',
};

@Injectable()
export class EnterpriseManagementService {
  private customDevRequests = new Map<string, CustomDevRequest>();
  private projects = new Map<string, Project>();
  private managedServices = new Map<string, ManagedService>();
  private opsReports = new Map<string, OpsReport>();
  private consultingEngagements = new Map<string, ConsultingEngagement>();
  private integrations = new Map<string, EnterpriseIntegration>();
  private slaCompensations = new Map<string, SlaCompensation>();

  // ─── Custom Development (Req 5.1, 5.2) ───

  /**
   * Submit a custom development request.
   * Platform provides assessment and quote within 2 business days.
   */
  submitCustomDevRequest(dto: SubmitCustomDevRequestDto): CustomDevRequest {
    if (!dto.enterpriseUserId) throw new BadRequestException('enterpriseUserId is required');
    if (!dto.title) throw new BadRequestException('title is required');
    if (!dto.description) throw new BadRequestException('description is required');

    const now = new Date();
    const quoteDeadline = this.addBusinessDays(now, QUOTE_DEADLINE_BUSINESS_DAYS);

    const request: CustomDevRequest = {
      id: crypto.randomUUID(),
      enterpriseUserId: dto.enterpriseUserId,
      title: dto.title,
      description: dto.description,
      requirements: dto.requirements ?? [],
      budget: dto.budget,
      deadline: dto.deadline,
      status: 'submitted',
      quoteDeadline,
      createdAt: now,
      updatedAt: now,
    };

    this.customDevRequests.set(request.id, request);
    return request;
  }

  /**
   * Provide a quote for a custom dev request (internal/admin action).
   */
  provideQuote(requestId: string, quotedAmount: number): CustomDevRequest {
    const request = this.getCustomDevRequest(requestId);
    if (request.status !== 'submitted' && request.status !== 'under_review') {
      throw new BadRequestException(`Cannot quote request in status: ${request.status}`);
    }
    if (quotedAmount <= 0) throw new BadRequestException('quotedAmount must be positive');

    request.status = 'quoted';
    request.quotedAmount = quotedAmount;
    request.quotedAt = new Date();
    request.updatedAt = new Date();
    return request;
  }

  /**
   * Enterprise user confirms the quote and pays → create project.
   */
  confirmAndCreateProject(dto: ConfirmCustomDevDto): Project {
    const request = this.getCustomDevRequest(dto.requestId);
    if (request.status !== 'quoted') {
      throw new BadRequestException('Request must be in quoted status to confirm');
    }
    if (request.enterpriseUserId !== dto.enterpriseUserId) {
      throw new BadRequestException('Only the requesting enterprise user can confirm');
    }

    request.status = 'confirmed';
    request.updatedAt = new Date();

    const project: Project = {
      id: crypto.randomUUID(),
      requestId: request.id,
      enterpriseUserId: request.enterpriseUserId,
      status: 'created',
      teamMembers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.projects.set(project.id, project);
    return project;
  }

  /**
   * Assign a team to a project.
   */
  assignTeam(dto: AssignTeamDto): Project {
    const project = this.getProject(dto.projectId);
    if (project.status !== 'created' && project.status !== 'team_assigned') {
      throw new BadRequestException(`Cannot assign team in project status: ${project.status}`);
    }
    if (!dto.teamMembers || dto.teamMembers.length === 0) {
      throw new BadRequestException('At least one team member is required');
    }

    project.teamMembers = dto.teamMembers;
    project.status = 'team_assigned';
    project.updatedAt = new Date();
    return project;
  }

  getCustomDevRequest(requestId: string): CustomDevRequest {
    const request = this.customDevRequests.get(requestId);
    if (!request) throw new NotFoundException(`Custom dev request ${requestId} not found`);
    return request;
  }

  getProject(projectId: string): Project {
    const project = this.projects.get(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    return project;
  }

  // ─── Managed Services (Req 5.3, 5.4) ───

  /**
   * Activate managed services for an enterprise instance.
   * Provides 7x24 monitoring, performance optimization, security updates, data backup.
   */
  activateManagedService(dto: ActivateManagedServiceDto): ManagedService {
    if (!dto.enterpriseUserId) throw new BadRequestException('enterpriseUserId is required');
    if (!dto.instanceId) throw new BadRequestException('instanceId is required');
    if (!dto.services || dto.services.length === 0) {
      throw new BadRequestException('At least one service type is required');
    }

    const managed: ManagedService = {
      id: crypto.randomUUID(),
      enterpriseUserId: dto.enterpriseUserId,
      instanceId: dto.instanceId,
      services: dto.services,
      status: 'active',
      createdAt: new Date(),
    };

    this.managedServices.set(managed.id, managed);
    return managed;
  }

  getManagedService(id: string): ManagedService {
    const ms = this.managedServices.get(id);
    if (!ms) throw new NotFoundException(`Managed service ${id} not found`);
    return ms;
  }

  /**
   * Generate monthly ops report.
   * Includes system availability, performance metrics, security event summary.
   */
  generateOpsReport(dto: GenerateOpsReportDto): OpsReport {
    const managed = this.getManagedService(dto.managedServiceId);
    if (managed.status !== 'active') {
      throw new BadRequestException('Managed service must be active to generate report');
    }
    if (!dto.month || !/^\d{4}-\d{2}$/.test(dto.month)) {
      throw new BadRequestException('month must be in YYYY-MM format');
    }

    // Simulated metrics
    const content: OpsReportContent = {
      availabilityPercentage: 99.95,
      performanceMetrics: {
        avgResponseTimeMs: 120,
        p99ResponseTimeMs: 450,
        errorRate: 0.02,
      },
      securityEventSummary: {
        totalEvents: 15,
        criticalEvents: 0,
        resolvedEvents: 15,
      },
    };

    const report: OpsReport = {
      id: crypto.randomUUID(),
      managedServiceId: managed.id,
      month: dto.month,
      content,
      generatedAt: new Date(),
    };

    this.opsReports.set(report.id, report);
    return report;
  }

  getOpsReport(reportId: string): OpsReport {
    const report = this.opsReports.get(reportId);
    if (!report) throw new NotFoundException(`Ops report ${reportId} not found`);
    return report;
  }

  // ─── Consulting Services (Req 5.5) ───

  /**
   * Request consulting service: strategic planning, ROI analysis, implementation roadmap.
   */
  requestConsulting(dto: RequestConsultingDto): ConsultingEngagement {
    if (!dto.enterpriseUserId) throw new BadRequestException('enterpriseUserId is required');
    if (!dto.type) throw new BadRequestException('consulting type is required');
    if (!dto.description) throw new BadRequestException('description is required');

    const validTypes: ConsultingServiceType[] = [
      'strategic_planning',
      'roi_analysis',
      'implementation_roadmap',
    ];
    if (!validTypes.includes(dto.type)) {
      throw new BadRequestException(`Invalid consulting type: ${dto.type}`);
    }

    const engagement: ConsultingEngagement = {
      id: crypto.randomUUID(),
      enterpriseUserId: dto.enterpriseUserId,
      type: dto.type,
      description: dto.description,
      status: 'requested',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.consultingEngagements.set(engagement.id, engagement);
    return engagement;
  }

  getConsultingEngagement(id: string): ConsultingEngagement {
    const engagement = this.consultingEngagements.get(id);
    if (!engagement) throw new NotFoundException(`Consulting engagement ${id} not found`);
    return engagement;
  }

  /**
   * Deliver consulting results.
   */
  deliverConsulting(engagementId: string, deliverables: string[]): ConsultingEngagement {
    const engagement = this.getConsultingEngagement(engagementId);
    if (engagement.status === 'delivered') {
      throw new BadRequestException('Consulting already delivered');
    }

    engagement.status = 'delivered';
    engagement.deliverables = deliverables;
    engagement.updatedAt = new Date();
    return engagement;
  }

  // ─── Enterprise Integration API (Req 5.6) ───

  /**
   * Create integration with enterprise system (ERP/CRM/OA).
   * Provides standardized API endpoint and documentation.
   */
  createIntegration(dto: CreateIntegrationDto): EnterpriseIntegration {
    if (!dto.enterpriseUserId) throw new BadRequestException('enterpriseUserId is required');
    if (!dto.target) throw new BadRequestException('integration target is required');

    const validTargets: IntegrationTarget[] = ['ERP', 'CRM', 'OA'];
    if (!validTargets.includes(dto.target)) {
      throw new BadRequestException(`Invalid integration target: ${dto.target}`);
    }

    const integration: EnterpriseIntegration = {
      id: crypto.randomUUID(),
      enterpriseUserId: dto.enterpriseUserId,
      target: dto.target,
      config: dto.config ?? {},
      status: 'connected',
      apiEndpoint: INTEGRATION_ENDPOINTS[dto.target],
      apiDocUrl: INTEGRATION_DOC_URLS[dto.target],
      createdAt: new Date(),
    };

    this.integrations.set(integration.id, integration);
    return integration;
  }

  getIntegration(id: string): EnterpriseIntegration {
    const integration = this.integrations.get(id);
    if (!integration) throw new NotFoundException(`Integration ${id} not found`);
    return integration;
  }

  listIntegrations(enterpriseUserId: string): EnterpriseIntegration[] {
    return Array.from(this.integrations.values()).filter(
      (i) => i.enterpriseUserId === enterpriseUserId,
    );
  }

  // ─── SLA Compensation (Req 5.7) ───

  /**
   * Request SLA compensation when availability drops below 99.9%.
   */
  requestSlaCompensation(dto: RequestSlaCompensationDto): SlaCompensation {
    const managed = this.getManagedService(dto.managedServiceId);
    if (managed.status !== 'active') {
      throw new BadRequestException('Managed service must be active for SLA compensation');
    }
    if (!dto.month || !/^\d{4}-\d{2}$/.test(dto.month)) {
      throw new BadRequestException('month must be in YYYY-MM format');
    }
    if (dto.actualAvailability < 0 || dto.actualAvailability > 100) {
      throw new BadRequestException('actualAvailability must be between 0 and 100');
    }

    const target = DEFAULT_SLA.availabilityTarget;

    if (dto.actualAvailability >= target) {
      throw new BadRequestException(
        `Availability ${dto.actualAvailability}% meets SLA target of ${target}%. No compensation applicable.`,
      );
    }

    const shortfall = target - dto.actualAvailability;
    // Compensation: (shortfall / 0.1) * compensationPercentage% of a notional monthly fee
    // Using a fixed notional monthly fee of $999 for enterprise managed services
    const notionalMonthlyFee = 999;
    const compensationSteps = Math.ceil(shortfall * 10); // per 0.1%
    const compensationAmount = Math.min(
      (compensationSteps * DEFAULT_SLA.compensationPercentage * notionalMonthlyFee) / 100,
      notionalMonthlyFee, // cap at 100% of monthly fee
    );

    const compensation: SlaCompensation = {
      id: crypto.randomUUID(),
      managedServiceId: managed.id,
      month: dto.month,
      actualAvailability: dto.actualAvailability,
      targetAvailability: target,
      shortfallPercentage: parseFloat(shortfall.toFixed(2)),
      compensationAmount: parseFloat(compensationAmount.toFixed(2)),
      status: 'approved',
      createdAt: new Date(),
    };

    this.slaCompensations.set(compensation.id, compensation);
    return compensation;
  }

  getSlaCompensation(id: string): SlaCompensation {
    const comp = this.slaCompensations.get(id);
    if (!comp) throw new NotFoundException(`SLA compensation ${id} not found`);
    return comp;
  }

  // ─── Helpers ───

  /**
   * Add business days to a date (skip weekends).
   */
  addBusinessDays(start: Date, days: number): Date {
    const result = new Date(start);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        added++;
      }
    }
    return result;
  }
}
