import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  ServiceTier,
  InstallStatus,
  INSTALL_STATUS_TRANSITIONS,
  SERVICE_TIERS,
  ServiceTierDefinition,
  AUTO_ACCEPTANCE_DAYS,
  MAX_WARRANTY_REPAIRS,
  ENGINEER_SHARE_PERCENT,
  PLATFORM_SHARE_PERCENT,
} from '@openclaw-club/shared';
import { CreateInstallOrderDto } from './dto/install.dto';

export interface InstallOrderRecord {
  id: string;
  orderId: string;
  userId: string;
  serviceTier: ServiceTier;
  ocsasLevel: number;
  engineerId?: string;
  conversationId?: string;
  deviceEnvironment?: Record<string, unknown>;
  installStatus: InstallStatus;
  tokenHubConnected: boolean;
  warrantyEndDate?: Date;
  warrantyRepairCount: number;
  dispatchedAt?: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  acceptedByUserAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryReportRecord {
  id: string;
  installOrderId: string;
  checklist: Record<string, unknown>;
  configItems: Record<string, unknown>;
  testResults: Record<string, unknown>;
  screenshots?: string[];
  submittedAt: Date;
}

export interface ServiceReviewRecord {
  id: string;
  orderId: string;
  userId: string;
  overallRating: number;
  attitudeRating?: number;
  skillRating?: number;
  responseRating?: number;
  comment?: string;
  createdAt: Date;
}

export interface SettlementResult {
  orderId: string;
  totalAmount: number;
  engineerShare: number;
  platformShare: number;
  currency: string;
  settledAt: Date;
}

export interface WarrantyTicketRecord {
  id: string;
  installOrderId: string;
  userId: string;
  issue: string;
  cost: number;
  status: 'open' | 'in_progress' | 'resolved';
  qualityInvestigation: boolean;
  createdAt: Date;
}

@Injectable()
export class InstallService {
  /** In-memory stores — will be replaced by TypeORM repositories */
  private installOrders = new Map<string, InstallOrderRecord>();
  private deliveryReports = new Map<string, DeliveryReportRecord>();
  private reviews = new Map<string, ServiceReviewRecord>();
  private warrantyTickets = new Map<string, WarrantyTicketRecord>();
  private orderIdIndex = new Map<string, string>(); // orderId → installOrderId

  /**
   * Get all service tier definitions.
   */
  getServiceTiers(): ServiceTierDefinition[] {
    return Object.values(SERVICE_TIERS);
  }

  /**
   * Get a specific service tier definition.
   */
  getServiceTier(tier: ServiceTier): ServiceTierDefinition {
    const def = SERVICE_TIERS[tier];
    if (!def) throw new BadRequestException(`Invalid service tier: ${tier}`);
    return def;
  }

  /**
   * Create an install order. Generates a linked order ID (in production, calls OrderService).
   * Funds are frozen to escrow via the order service.
   */
  createInstallOrder(dto: CreateInstallOrderDto): InstallOrderRecord {
    const tierDef = this.getServiceTier(dto.tier);
    const now = new Date();
    const orderId = crypto.randomUUID(); // In production: call OrderService.createOrder

    const record: InstallOrderRecord = {
      id: crypto.randomUUID(),
      orderId,
      userId: dto.userId,
      serviceTier: dto.tier,
      ocsasLevel: tierDef.ocsasLevel,
      conversationId: dto.conversationId,
      deviceEnvironment: dto.deviceEnvironment,
      installStatus: 'pending_dispatch',
      tokenHubConnected: true, // Default: connect to Token_Hub
      warrantyRepairCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.installOrders.set(record.id, record);
    this.orderIdIndex.set(orderId, record.id);
    return record;
  }

  /**
   * Transition install status using the state machine.
   */
  updateProgress(installOrderId: string, newStatus: InstallStatus): InstallOrderRecord {
    const order = this.getInstallOrder(installOrderId);
    const allowed = INSTALL_STATUS_TRANSITIONS[order.installStatus];

    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from '${order.installStatus}' to '${newStatus}'`,
      );
    }

    order.installStatus = newStatus;
    order.updatedAt = new Date();

    if (newStatus === 'accepted') {
      order.acceptedAt = new Date();
    }
    if (newStatus === 'completed') {
      order.completedAt = new Date();
      // Set warranty end date based on tier
      const tierDef = SERVICE_TIERS[order.serviceTier];
      const warrantyEnd = new Date();
      warrantyEnd.setDate(warrantyEnd.getDate() + tierDef.warrantyDays);
      order.warrantyEndDate = warrantyEnd;
    }

    return order;
  }

  /**
   * Engineer accepts the order.
   */
  acceptOrder(installOrderId: string, engineerId: string): InstallOrderRecord {
    const order = this.getInstallOrder(installOrderId);
    if (order.installStatus !== 'pending_dispatch') {
      throw new BadRequestException('Order is not in pending_dispatch status');
    }
    order.engineerId = engineerId;
    return this.updateProgress(installOrderId, 'accepted');
  }

  /**
   * Submit delivery report.
   */
  submitDeliveryReport(
    installOrderId: string,
    engineerId: string,
    data: { checklist: Record<string, unknown>; configItems: Record<string, unknown>; testResults: Record<string, unknown>; screenshots?: string[] },
  ): DeliveryReportRecord {
    const order = this.getInstallOrder(installOrderId);
    if (order.engineerId !== engineerId) {
      throw new BadRequestException('Only the assigned engineer can submit a delivery report');
    }
    if (order.installStatus !== 'testing' && order.installStatus !== 'pending_acceptance') {
      throw new BadRequestException('Order must be in testing or pending_acceptance status');
    }

    if (this.deliveryReports.has(installOrderId)) {
      throw new BadRequestException('Delivery report already submitted');
    }

    const report: DeliveryReportRecord = {
      id: crypto.randomUUID(),
      installOrderId,
      checklist: data.checklist,
      configItems: data.configItems,
      testResults: data.testResults,
      screenshots: data.screenshots,
      submittedAt: new Date(),
    };

    this.deliveryReports.set(installOrderId, report);

    // Auto-transition to pending_acceptance if in testing
    if (order.installStatus === 'testing') {
      this.updateProgress(installOrderId, 'pending_acceptance');
    }

    return report;
  }

  /**
   * User confirms acceptance. Triggers settlement (engineer 80%, platform 20%).
   */
  confirmAcceptance(installOrderId: string, userId: string): { order: InstallOrderRecord; settlement: SettlementResult } {
    const order = this.getInstallOrder(installOrderId);
    if (order.userId !== userId) {
      throw new BadRequestException('Only the order owner can confirm acceptance');
    }
    if (order.installStatus !== 'pending_acceptance') {
      throw new BadRequestException('Order is not in pending_acceptance status');
    }

    order.acceptedByUserAt = new Date();
    this.updateProgress(installOrderId, 'completed');

    const settlement = this.settleOrder(order);
    return { order, settlement };
  }

  /**
   * Calculate settlement for a completed order.
   */
  private settleOrder(order: InstallOrderRecord): SettlementResult {
    const tierDef = SERVICE_TIERS[order.serviceTier];
    const totalAmount = tierDef.price;
    const engineerShare = Math.round(totalAmount * ENGINEER_SHARE_PERCENT) / 100;
    const platformShare = Math.round(totalAmount * PLATFORM_SHARE_PERCENT) / 100;

    return {
      orderId: order.orderId,
      totalAmount,
      engineerShare,
      platformShare,
      currency: 'USD',
      settledAt: new Date(),
    };
  }

  /**
   * Submit a service review.
   */
  submitReview(
    installOrderId: string,
    userId: string,
    data: { overallRating: number; attitudeRating?: number; skillRating?: number; responseRating?: number; comment?: string },
  ): ServiceReviewRecord {
    const order = this.getInstallOrder(installOrderId);
    if (order.userId !== userId) {
      throw new BadRequestException('Only the order owner can submit a review');
    }
    if (order.installStatus !== 'completed') {
      throw new BadRequestException('Order must be completed before review');
    }
    if (data.overallRating < 1 || data.overallRating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const subRatings = [data.attitudeRating, data.skillRating, data.responseRating];
    for (const rating of subRatings) {
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        throw new BadRequestException('Rating must be between 1 and 5');
      }
    }

    const existing = Array.from(this.reviews.values()).find(
      (r) => r.orderId === order.orderId && r.userId === userId,
    );
    if (existing) {
      throw new BadRequestException('Review already submitted for this order');
    }

    const review: ServiceReviewRecord = {
      id: crypto.randomUUID(),
      orderId: order.orderId,
      userId,
      overallRating: data.overallRating,
      attitudeRating: data.attitudeRating,
      skillRating: data.skillRating,
      responseRating: data.responseRating,
      comment: data.comment,
      createdAt: new Date(),
    };

    this.reviews.set(review.id, review);
    return review;
  }

  /**
   * Request warranty repair. Triggers quality investigation if repairs > MAX_WARRANTY_REPAIRS.
   */
  requestWarrantyRepair(
    installOrderId: string,
    userId: string,
    issue: string,
  ): WarrantyTicketRecord {
    const order = this.getInstallOrder(installOrderId);
    if (order.userId !== userId) {
      throw new BadRequestException('Only the order owner can request warranty repair');
    }
    if (order.installStatus !== 'completed') {
      throw new BadRequestException('Order must be completed to request warranty repair');
    }
    if (!order.warrantyEndDate || new Date() > order.warrantyEndDate) {
      throw new BadRequestException('Warranty period has expired');
    }

    order.warrantyRepairCount += 1;
    order.updatedAt = new Date();

    const qualityInvestigation = order.warrantyRepairCount > MAX_WARRANTY_REPAIRS;

    const ticket: WarrantyTicketRecord = {
      id: crypto.randomUUID(),
      installOrderId,
      userId,
      issue,
      cost: 0, // Free repair within warranty period
      status: 'open',
      qualityInvestigation,
      createdAt: new Date(),
    };

    this.warrantyTickets.set(ticket.id, ticket);
    return ticket;
  }

  /**
   * Find orders pending acceptance for more than AUTO_ACCEPTANCE_DAYS — auto-confirm and settle.
   */
  processAutoAcceptance(): { order: InstallOrderRecord; settlement: SettlementResult }[] {
    const cutoff = new Date(Date.now() - AUTO_ACCEPTANCE_DAYS * 24 * 60 * 60 * 1000);
    const results: { order: InstallOrderRecord; settlement: SettlementResult }[] = [];

    for (const order of this.installOrders.values()) {
      if (order.installStatus === 'pending_acceptance' && order.updatedAt < cutoff) {
        order.acceptedByUserAt = new Date();
        order.installStatus = 'completed';
        order.completedAt = new Date();
        order.updatedAt = new Date();

        const tierDef = SERVICE_TIERS[order.serviceTier];
        const warrantyEnd = new Date();
        warrantyEnd.setDate(warrantyEnd.getDate() + tierDef.warrantyDays);
        order.warrantyEndDate = warrantyEnd;

        const settlement = this.settleOrder(order);
        results.push({ order, settlement });
      }
    }

    return results;
  }

  /**
   * Get install order by ID.
   */
  getInstallOrder(id: string): InstallOrderRecord {
    const order = this.installOrders.get(id);
    if (!order) throw new NotFoundException(`Install order ${id} not found`);
    return order;
  }

  /**
   * Get install order by linked order ID.
   */
  getByOrderId(orderId: string): InstallOrderRecord {
    const installId = this.orderIdIndex.get(orderId);
    if (!installId) throw new NotFoundException(`No install order for order ${orderId}`);
    return this.getInstallOrder(installId);
  }

  /**
   * List install orders for a user.
   */
  listByUser(userId: string): InstallOrderRecord[] {
    return Array.from(this.installOrders.values()).filter((o) => o.userId === userId);
  }

  /**
   * List install orders assigned to an engineer.
   */
  listByEngineer(engineerId: string): InstallOrderRecord[] {
    return Array.from(this.installOrders.values()).filter((o) => o.engineerId === engineerId);
  }

  /**
   * Get delivery report for an install order.
   */
  getDeliveryReport(installOrderId: string): DeliveryReportRecord | undefined {
    return this.deliveryReports.get(installOrderId);
  }

  /**
   * Get warranty tickets for an install order.
   */
  getWarrantyTickets(installOrderId: string): WarrantyTicketRecord[] {
    return Array.from(this.warrantyTickets.values()).filter(
      (t) => t.installOrderId === installOrderId,
    );
  }
}
