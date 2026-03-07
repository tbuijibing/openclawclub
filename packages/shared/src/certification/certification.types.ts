import type { CertType } from '../types';

/** Re-export CertType for convenience */
export type { CertType } from '../types';

/** Certification pricing (Req 6.2) */
export const CERT_PRICES: Record<CertType, number> = {
  OCP: 299,
  OCE: 499,
  OCEA: 799,
  AI_IMPLEMENTATION_ENGINEER: 1499,
};

/** Certificate validity in years */
export const CERT_VALIDITY_YEARS = 2;

/** Renewal reminder days before expiry (Req 6.6) */
export const CERT_RENEWAL_REMINDER_DAYS = 60;

/** Minimum projects required for renewal (Req 6.7) */
export const CERT_RENEWAL_MIN_PROJECTS = 5;

/** Certificate status */
export type CertStatus = 'active' | 'expired' | 'revoked';

/** Certificate verification result */
export interface CertVerification {
  valid: boolean;
  certNumber: string;
  certType: CertType;
  holderName?: string;
  status: CertStatus;
  issuedAt: string;
  expiresAt: string;
}

/** Course IDs */
export type CourseId = 'basic_intro' | 'advanced_skills' | 'enterprise_deployment' | 'security_config';

/** Course definition */
export interface CourseDefinition {
  id: CourseId;
  name: string;
  price: number;
  isFree: boolean;
  description: string;
}

/** All available courses (Req 6.1) */
export const COURSES: Record<CourseId, CourseDefinition> = {
  basic_intro: {
    id: 'basic_intro',
    name: 'Basic Introduction',
    price: 0,
    isFree: true,
    description: 'Free introductory course for OpenClaw basics',
  },
  advanced_skills: {
    id: 'advanced_skills',
    name: 'Advanced Skills Development',
    price: 99,
    isFree: false,
    description: 'Advanced skill development for OpenClaw power users',
  },
  enterprise_deployment: {
    id: 'enterprise_deployment',
    name: 'Enterprise Deployment Best Practices',
    price: 199,
    isFree: false,
    description: 'Best practices for enterprise-grade OpenClaw deployment',
  },
  security_config: {
    id: 'security_config',
    name: 'Security Configuration Management',
    price: 149,
    isFree: false,
    description: 'Security configuration and management for OpenClaw',
  },
};

/** Enrollment status */
export type EnrollmentStatus = 'active' | 'completed' | 'cancelled';

/** Exam status */
export type ExamStatus = 'not_started' | 'in_progress' | 'submitted' | 'passed' | 'failed' | 'expired';

/** Exam constants */
export const EXAM_DURATION_HOURS = 2;
export const EXAM_DURATION_MS = EXAM_DURATION_HOURS * 60 * 60 * 1000;
export const EXAM_PASS_SCORE = 80;
export const EXAM_TOTAL_SCORE = 100;
