import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  PartnerType,
  PartnerApplicationStatus,
  PartnerEarningStatus,
  ExternalPlatform,
  ExternalVendorStatus,
  REVENUE_SHARE_PERCENTAGES,
  APPLICATION_REVIEW_BUSINESS_DAYS,
  SETTLEMENT_DEADLINE_DAY,
} from '@openclaw-club/shared';
import {
  ApplyPartnerDto,
  ReviewApplicationDto,
  RecordEarningDto,
  SettleMonthlyEarningsDto,
  GetDashboardDto,
  RegisterExternalVendorDto,
  UpdateVendorProfileDto,
  DistributeOrderDto,
  ConvertVendorDto,
} from './dto/partner.dto';

// ─── In-memory record types ───

export interface PartnerApplication {
  id: string;
  userId: string;
  type: PartnerType;
  name: string;
  qualifications: string[];
  region?: string;
  description?: string;
  status: PartnerApplicationStatus;
  reviewDeadline: Date;
  reviewerId?: string;
  reviewReason?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartnerEarning {
  id: string;
  partnerId: string;
  partnerType: PartnerType;
  orderId: string;
  grossAmount: number;
  sharePercentage: number;
  netAmount: number;
  status: PartnerEarningStatus;
  settlementMonth: string;
  paidAt?: Date;
  createdAt: Date;
}

export interface EarningsDashboard {
  partnerId: string;
  totalOrders: number;
  totalRevenue: number;
  pendingSettlement: number;
  settledAmount: number;
  paidAmount: number;
  earnings: PartnerEarning[];
}

export interface SettlementResult {
  month: string;
  totalSettled: number;
  earningsCount: number;
  settledAt: Date;
}

export interface ExternalVendor {
  id: string;
  name: string;
  platform: ExternalPlatform;
  platformProfileUrl?: string;
  skills: string[];
  region?: string;
  serviceRating: number;
  completionRate: number;
  feedbacks: string[];
  totalOrders: number;
  status: ExternalVendorStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderDistribution {
  id: string;
  orderId: string;
  vendorId: string;
  platform: ExternalPlatform;
  distributedAt: Date;
}


@Injectable()
export class PartnerService {
  private applications = new Map<string, PartnerApplication>();
  private earnings = new Map<string, PartnerEarning>();
  private vendors = new Map<string, ExternalVendor>();
  private distributions = new Map<string, OrderDistribution>();

  // ─── Partner Application & Review (Req 10.1, 10.2) ───

  applyPartner(dto: ApplyPartnerDto): PartnerApplication {
    if (!dto.userId) throw new BadRequestException('userId is required');
    if (!dto.name) throw new BadRequestException('name is required');
    if (!dto.type) throw new BadRequestException('type is required');

    const validTypes: PartnerType[] = ['community', 'regional', 'engineer'];
    if (!validTypes.includes(dto.type)) {
      throw new BadRequestException(`Invalid partner type: ${dto.type}`);
    }

    if (!dto.qualifications || dto.qualifications.length === 0) {
      throw new BadRequestException('At least one qualification is required');
    }

    const now = new Date();
    const reviewDeadline = this.addBusinessDays(now, APPLICATION_REVIEW_BUSINESS_DAYS);

    const application: PartnerApplication = {
      id: crypto.randomUUID(),
      userId: dto.userId,
      type: dto.type,
      name: dto.name,
      qualifications: dto.qualifications,
      region: dto.region,
      description: dto.description,
      status: 'pending',
      reviewDeadline,
      createdAt: now,
      updatedAt: now,
    };

    this.applications.set(application.id, application);
    return application;
  }

  reviewApplication(dto: ReviewApplicationDto): PartnerApplication {
    const application = this.getApplication(dto.applicationId);

    if (application.status !== 'pending' && application.status !== 'under_review') {
      throw new BadRequestException(`Cannot review application in status: ${application.status}`);
    }

    if (!dto.reviewerId) throw new BadRequestException('reviewerId is required');

    const validDecisions = ['approved', 'rejected'] as const;
    if (!validDecisions.includes(dto.decision)) {
      throw new BadRequestException(`Invalid decision: ${dto.decision}`);
    }

    application.status = dto.decision;
    application.reviewerId = dto.reviewerId;
    application.reviewReason = dto.reason;
    application.reviewedAt = new Date();
    application.updatedAt = new Date();

    return application;
  }

  getApplication(applicationId: string): PartnerApplication {
    const app = this.applications.get(applicationId);
    if (!app) throw new NotFoundException(`Application ${applicationId} not found`);
    return app;
  }

  listApplicationsByUser(userId: string): PartnerApplication[] {
    return Array.from(this.applications.values()).filter((a) => a.userId === userId);
  }

  // ─── Revenue Sharing (Req 10.3, 10.4, 10.5) ───

  calculateAndRecordEarning(dto: RecordEarningDto): PartnerEarning {
    if (!dto.partnerId) throw new BadRequestException('partnerId is required');
    if (!dto.orderId) throw new BadRequestException('orderId is required');
    if (!dto.partnerType) throw new BadRequestException('partnerType is required');
    if (dto.grossAmount <= 0) throw new BadRequestException('grossAmount must be positive');

    const sharePercentage = REVENUE_SHARE_PERCENTAGES[dto.partnerType];
    if (sharePercentage === undefined) {
      throw new BadRequestException(`Invalid partner type: ${dto.partnerType}`);
    }

    const netAmount = parseFloat(((dto.grossAmount * sharePercentage) / 100).toFixed(2));
    const now = new Date();
    const settlementMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const earning: PartnerEarning = {
      id: crypto.randomUUID(),
      partnerId: dto.partnerId,
      partnerType: dto.partnerType,
      orderId: dto.orderId,
      grossAmount: dto.grossAmount,
      sharePercentage,
      netAmount,
      status: 'pending',
      settlementMonth,
      createdAt: now,
    };

    this.earnings.set(earning.id, earning);
    return earning;
  }

  // ─── Monthly Settlement (Req 10.6) ───

  settleMonthlyEarnings(dto: SettleMonthlyEarningsDto): SettlementResult {
    if (!dto.month || !/^\d{4}-\d{2}$/.test(dto.month)) {
      throw new BadRequestException('month must be in YYYY-MM format');
    }

    const pendingEarnings = Array.from(this.earnings.values()).filter(
      (e) => e.settlementMonth === dto.month && e.status === 'pending',
    );

    if (pendingEarnings.length === 0) {
      throw new BadRequestException(`No pending earnings found for month: ${dto.month}`);
    }

    const now = new Date();
    let totalSettled = 0;

    for (const earning of pendingEarnings) {
      earning.status = 'settled';
      totalSettled += earning.netAmount;
    }

    return {
      month: dto.month,
      totalSettled: parseFloat(totalSettled.toFixed(2)),
      earningsCount: pendingEarnings.length,
      settledAt: now,
    };
  }

  // ─── Dashboard (Req 10.7) ───

  getEarningsDashboard(dto: GetDashboardDto): EarningsDashboard {
    if (!dto.partnerId) throw new BadRequestException('partnerId is required');

    const partnerEarnings = Array.from(this.earnings.values()).filter(
      (e) => e.partnerId === dto.partnerId,
    );

    const totalOrders = partnerEarnings.length;
    const totalRevenue = partnerEarnings.reduce((sum, e) => sum + e.netAmount, 0);
    const pendingSettlement = partnerEarnings
      .filter((e) => e.status === 'pending')
      .reduce((sum, e) => sum + e.netAmount, 0);
    const settledAmount = partnerEarnings
      .filter((e) => e.status === 'settled')
      .reduce((sum, e) => sum + e.netAmount, 0);
    const paidAmount = partnerEarnings
      .filter((e) => e.status === 'paid')
      .reduce((sum, e) => sum + e.netAmount, 0);

    return {
      partnerId: dto.partnerId,
      totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      pendingSettlement: parseFloat(pendingSettlement.toFixed(2)),
      settledAmount: parseFloat(settledAmount.toFixed(2)),
      paidAmount: parseFloat(paidAmount.toFixed(2)),
      earnings: partnerEarnings,
    };
  }

  // ─── External Vendor Management (Req 10.8, 10.9, 10.10) ───

  registerExternalVendor(dto: RegisterExternalVendorDto): ExternalVendor {
    if (!dto.name) throw new BadRequestException('name is required');
    if (!dto.platform) throw new BadRequestException('platform is required');

    const validPlatforms: ExternalPlatform[] = ['fiverr', 'upwork', 'zbj', 'xianyu', 'other'];
    if (!validPlatforms.includes(dto.platform)) {
      throw new BadRequestException(`Invalid platform: ${dto.platform}`);
    }

    if (!dto.skills || dto.skills.length === 0) {
      throw new BadRequestException('At least one skill is required');
    }

    const now = new Date();
    const vendor: ExternalVendor = {
      id: crypto.randomUUID(),
      name: dto.name,
      platform: dto.platform,
      platformProfileUrl: dto.platformProfileUrl,
      skills: dto.skills,
      region: dto.region,
      serviceRating: 0,
      completionRate: 0,
      feedbacks: [],
      totalOrders: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    this.vendors.set(vendor.id, vendor);
    return vendor;
  }

  updateVendorProfile(dto: UpdateVendorProfileDto): ExternalVendor {
    const vendor = this.getVendor(dto.vendorId);

    if (vendor.status !== 'active') {
      throw new BadRequestException(`Cannot update vendor in status: ${vendor.status}`);
    }

    if (dto.serviceRating !== undefined) {
      if (dto.serviceRating < 0 || dto.serviceRating > 5) {
        throw new BadRequestException('serviceRating must be between 0 and 5');
      }
      vendor.serviceRating = dto.serviceRating;
    }

    if (dto.completionRate !== undefined) {
      if (dto.completionRate < 0 || dto.completionRate > 100) {
        throw new BadRequestException('completionRate must be between 0 and 100');
      }
      vendor.completionRate = dto.completionRate;
    }

    if (dto.feedback) {
      vendor.feedbacks.push(dto.feedback);
    }

    vendor.updatedAt = new Date();
    return vendor;
  }

  getVendor(vendorId: string): ExternalVendor {
    const vendor = this.vendors.get(vendorId);
    if (!vendor) throw new NotFoundException(`Vendor ${vendorId} not found`);
    return vendor;
  }

  listVendors(): ExternalVendor[] {
    return Array.from(this.vendors.values());
  }

  // ─── Order Distribution to External Platforms (Req 10.8, 10.9) ───

  distributeOrder(dto: DistributeOrderDto): OrderDistribution {
    if (!dto.orderId) throw new BadRequestException('orderId is required');
    if (!dto.vendorId) throw new BadRequestException('vendorId is required');

    const vendor = this.getVendor(dto.vendorId);
    if (vendor.status !== 'active') {
      throw new BadRequestException(`Vendor ${dto.vendorId} is not active`);
    }

    const distribution: OrderDistribution = {
      id: crypto.randomUUID(),
      orderId: dto.orderId,
      vendorId: dto.vendorId,
      platform: dto.platform,
      distributedAt: new Date(),
    };

    vendor.totalOrders += 1;
    vendor.updatedAt = new Date();

    this.distributions.set(distribution.id, distribution);
    return distribution;
  }

  // ─── Vendor to Certified Engineer Conversion (Req 10.11) ───

  convertToCertifiedEngineer(dto: ConvertVendorDto): ExternalVendor {
    const vendor = this.getVendor(dto.vendorId);

    if (vendor.status === 'converted') {
      throw new BadRequestException('Vendor has already been converted');
    }

    if (vendor.status !== 'active') {
      throw new BadRequestException(`Cannot convert vendor in status: ${vendor.status}`);
    }

    // Simplified conversion: vendor must have completed at least 1 order
    // and have a service rating >= 3.0
    if (vendor.totalOrders < 1) {
      throw new BadRequestException('Vendor must have completed at least 1 order to convert');
    }

    if (vendor.serviceRating < 3.0) {
      throw new BadRequestException('Vendor must have a service rating of at least 3.0 to convert');
    }

    vendor.status = 'converted';
    vendor.updatedAt = new Date();
    return vendor;
  }

  // ─── Helpers ───

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
