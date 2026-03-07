import type {
  ConsultingServiceType,
  IntegrationTarget,
  ManagedServiceType,
} from '@openclaw-club/shared';

// ─── Custom Development (Req 5.1, 5.2) ───

export interface SubmitCustomDevRequestDto {
  enterpriseUserId: string;
  title: string;
  description: string;
  requirements: string[];
  budget?: number;
  deadline?: string; // ISO date
}

export interface ConfirmCustomDevDto {
  requestId: string;
  enterpriseUserId: string;
}

// ─── Project (Req 5.2) ───

export interface AssignTeamDto {
  projectId: string;
  teamMembers: { userId: string; role: string }[];
}

// ─── Managed Service (Req 5.3, 5.4) ───

export interface ActivateManagedServiceDto {
  enterpriseUserId: string;
  instanceId: string;
  services: ManagedServiceType[];
}

export interface GenerateOpsReportDto {
  managedServiceId: string;
  month: string; // 'YYYY-MM'
}

// ─── Consulting (Req 5.5) ───

export interface RequestConsultingDto {
  enterpriseUserId: string;
  type: ConsultingServiceType;
  description: string;
}

// ─── Integration (Req 5.6) ───

export interface CreateIntegrationDto {
  enterpriseUserId: string;
  target: IntegrationTarget;
  config: Record<string, string>;
}

// ─── SLA Compensation (Req 5.7) ───

export interface RequestSlaCompensationDto {
  managedServiceId: string;
  month: string; // 'YYYY-MM'
  actualAvailability: number; // e.g. 99.5
}
