import type { PartnerType, ExternalPlatform } from '@openclaw-club/shared';

// ─── Partner Application (Req 10.1, 10.2) ───

export interface ApplyPartnerDto {
  userId: string;
  type: PartnerType;
  name: string;
  qualifications: string[];
  region?: string;
  description?: string;
}

export interface ReviewApplicationDto {
  applicationId: string;
  decision: 'approved' | 'rejected';
  reviewerId: string;
  reason?: string;
}

// ─── Revenue & Settlement (Req 10.3, 10.4, 10.5, 10.6) ───

export interface RecordEarningDto {
  partnerId: string;
  partnerType: PartnerType;
  orderId: string;
  grossAmount: number;
}

export interface SettleMonthlyEarningsDto {
  month: string; // 'YYYY-MM'
}

// ─── Dashboard (Req 10.7) ───

export interface GetDashboardDto {
  partnerId: string;
}

// ─── External Vendor (Req 10.8, 10.9, 10.10) ───

export interface RegisterExternalVendorDto {
  name: string;
  platform: ExternalPlatform;
  platformProfileUrl?: string;
  skills: string[];
  region?: string;
}

export interface UpdateVendorProfileDto {
  vendorId: string;
  serviceRating?: number;
  completionRate?: number;
  feedback?: string;
}

export interface DistributeOrderDto {
  orderId: string;
  vendorId: string;
  platform: ExternalPlatform;
}

// ─── Vendor Conversion (Req 10.11) ───

export interface ConvertVendorDto {
  vendorId: string;
}
