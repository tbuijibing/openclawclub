import { ServiceTier } from '@openclaw-club/shared';

export class CreateInstallOrderDto {
  userId!: string;
  tier!: ServiceTier;
  conversationId?: string;
  deviceEnvironment?: Record<string, unknown>;
  region?: string;
}

export class UpdateInstallProgressDto {
  status!: string;
}

export class AcceptOrderDto {
  engineerId!: string;
}

export class SubmitDeliveryReportDto {
  engineerId!: string;
  checklist!: Record<string, unknown>;
  configItems!: Record<string, unknown>;
  testResults!: Record<string, unknown>;
  screenshots?: string[];
}

export class ConfirmAcceptanceDto {
  userId!: string;
}

export class SubmitReviewDto {
  userId!: string;
  overallRating!: number;
  attitudeRating?: number;
  skillRating?: number;
  responseRating?: number;
  comment?: string;
}

export class RequestWarrantyRepairDto {
  userId!: string;
  issue!: string;
}
