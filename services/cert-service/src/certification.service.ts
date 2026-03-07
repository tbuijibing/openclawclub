import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import {
  COURSES,
  EXAM_DURATION_MS,
  EXAM_PASS_SCORE,
  EXAM_TOTAL_SCORE,
  CERT_PRICES,
  CERT_VALIDITY_YEARS,
  CERT_RENEWAL_MIN_PROJECTS,
  CERT_RENEWAL_REMINDER_DAYS,
  type CourseId,
  type CourseDefinition,
  type EnrollmentStatus,
  type ExamStatus,
  type CertType,
  type CertStatus,
  type CertVerification,
} from '@openclaw-club/shared';

/** In-memory enrollment record */
export interface EnrollmentRecord {
  id: string;
  userId: string;
  courseId: CourseId;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt?: Date;
}

/** Exam answers — map of questionId to selected answer */
export interface ExamAnswers {
  [questionId: string]: string;
}

/** In-memory exam record */
export interface ExamRecord {
  id: string;
  userId: string;
  courseId: CourseId;
  enrollmentId: string;
  status: ExamStatus;
  startedAt: Date;
  submittedAt?: Date;
  score?: number;
  totalScore: number;
  passed?: boolean;
  answers?: ExamAnswers;
}

/** Exam result returned to the caller */
export interface ExamResult {
  examId: string;
  userId: string;
  courseId: CourseId;
  score: number;
  totalScore: number;
  passed: boolean;
  submittedAt: Date;
}

/** In-memory certificate record */
export interface CertificateRecord {
  id: string;
  userId: string;
  certType: CertType;
  certNumber: string;
  status: CertStatus;
  issuedAt: Date;
  expiresAt: Date;
  projectCount: number;
  includesPhysicalCopy: boolean;
  annualTrainingCompleted: boolean;
}

@Injectable()
export class CertificationService {
  private readonly logger = new Logger(CertificationService.name);

  /** In-memory stores — will be replaced by TypeORM repositories */
  private enrollments = new Map<string, EnrollmentRecord>();
  private exams = new Map<string, ExamRecord>();
  private certificates = new Map<string, CertificateRecord>();

  /** Custom scoring function for testing */
  private scoringFn?: (answers: ExamAnswers) => number;

  /** Custom clock for testing (returns current time) */
  private clockFn?: () => Date;

  /**
   * Get all available courses (Req 6.1).
   */
  getCourses(): CourseDefinition[] {
    return Object.values(COURSES);
  }

  /**
   * Get a course by ID.
   */
  getCourse(courseId: string): CourseDefinition {
    const course = COURSES[courseId as CourseId];
    if (!course) throw new NotFoundException(`Course ${courseId} not found`);
    return course;
  }

  /**
   * Enroll a user in a course (Req 6.1).
   */
  enrollCourse(userId: string, courseId: string): EnrollmentRecord {
    if (!userId) throw new BadRequestException('userId is required');
    if (!courseId) throw new BadRequestException('courseId is required');

    const course = this.getCourse(courseId);

    // Check for existing active enrollment in the same course
    const existing = Array.from(this.enrollments.values()).find(
      (e) => e.userId === userId && e.courseId === courseId && e.status === 'active',
    );
    if (existing) {
      throw new BadRequestException('User already enrolled in this course');
    }

    const enrollment: EnrollmentRecord = {
      id: crypto.randomUUID(),
      userId,
      courseId: course.id,
      status: 'active',
      enrolledAt: new Date(),
    };

    this.enrollments.set(enrollment.id, enrollment);
    this.logger.log(`User ${userId} enrolled in course ${courseId}`);
    return enrollment;
  }

  /**
   * Start an exam for an enrolled user.
   * Returns an exam record with a 2-hour time window.
   */
  startExam(userId: string, courseId: string): ExamRecord {
    const enrollment = this.getActiveEnrollment(userId, courseId);

    // Check if there's already an in-progress exam
    const inProgress = Array.from(this.exams.values()).find(
      (e) => e.userId === userId && e.courseId === courseId && e.status === 'in_progress',
    );
    if (inProgress) {
      // Check if it's expired
      const elapsed = Date.now() - inProgress.startedAt.getTime();
      if (elapsed >= EXAM_DURATION_MS) {
        inProgress.status = 'expired';
      } else {
        throw new BadRequestException('User already has an in-progress exam for this course');
      }
    }

    const exam: ExamRecord = {
      id: crypto.randomUUID(),
      userId,
      courseId: courseId as CourseId,
      enrollmentId: enrollment.id,
      status: 'in_progress',
      startedAt: new Date(),
      totalScore: EXAM_TOTAL_SCORE,
    };

    this.exams.set(exam.id, exam);
    return exam;
  }

  /**
   * Submit exam answers (Req 6.3).
   * Scores the exam: 80 points to pass, 2-hour time limit.
   */
  submitExam(userId: string, examId: string, answers: ExamAnswers): ExamResult {
    if (!userId) throw new BadRequestException('userId is required');
    if (!examId) throw new BadRequestException('examId is required');
    if (!answers || Object.keys(answers).length === 0) {
      throw new BadRequestException('Exam answers are required');
    }

    const exam = this.exams.get(examId);
    if (!exam) throw new NotFoundException(`Exam ${examId} not found`);
    if (exam.userId !== userId) throw new BadRequestException('Exam does not belong to this user');
    if (exam.status !== 'in_progress') {
      throw new BadRequestException(`Exam is not in progress (current status: ${exam.status})`);
    }

    // Check 2-hour time limit
    const now = new Date();
    const elapsed = now.getTime() - exam.startedAt.getTime();
    if (elapsed > EXAM_DURATION_MS) {
      exam.status = 'expired';
      throw new BadRequestException('Exam time limit exceeded (2 hours)');
    }

    // Score the exam
    const score = this.scoreExam(answers);
    const clampedScore = Math.max(0, Math.min(EXAM_TOTAL_SCORE, Math.round(score)));
    const passed = clampedScore >= EXAM_PASS_SCORE;

    exam.status = passed ? 'passed' : 'failed';
    exam.score = clampedScore;
    exam.passed = passed;
    exam.answers = answers;
    exam.submittedAt = now;

    // If passed, mark enrollment as completed
    if (passed) {
      const enrollment = this.enrollments.get(exam.enrollmentId);
      if (enrollment) {
        enrollment.status = 'completed';
        enrollment.completedAt = now;
      }
    }

    this.logger.log(
      `User ${userId} submitted exam ${examId}: score=${clampedScore}, passed=${passed}`,
    );

    return {
      examId: exam.id,
      userId: exam.userId,
      courseId: exam.courseId,
      score: clampedScore,
      totalScore: EXAM_TOTAL_SCORE,
      passed,
      submittedAt: now,
    };
  }

  /**
   * Score exam answers.
   * Uses custom scoring function if set (for testing), otherwise default scoring.
   */
  private scoreExam(answers: ExamAnswers): number {
    if (this.scoringFn) {
      return this.scoringFn(answers);
    }
    // Default: each correct answer is worth equal points
    // In production this would check against an answer key
    const totalQuestions = Object.keys(answers).length;
    if (totalQuestions === 0) return 0;
    // Simulate: count non-empty answers as correct (placeholder logic)
    const answered = Object.values(answers).filter((a) => a && a.trim().length > 0).length;
    return Math.round((answered / totalQuestions) * EXAM_TOTAL_SCORE);
  }

  /**
   * Get active enrollment for a user in a course.
   */
  getActiveEnrollment(userId: string, courseId: string): EnrollmentRecord {
    const enrollment = Array.from(this.enrollments.values()).find(
      (e) => e.userId === userId && e.courseId === courseId && e.status === 'active',
    );
    if (!enrollment) {
      throw new BadRequestException(`User is not enrolled in course ${courseId}`);
    }
    return enrollment;
  }

  /**
   * Get enrollment by ID.
   */
  getEnrollment(id: string): EnrollmentRecord {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) throw new NotFoundException(`Enrollment ${id} not found`);
    return enrollment;
  }

  /**
   * List enrollments for a user.
   */
  listEnrollmentsByUser(userId: string): EnrollmentRecord[] {
    return Array.from(this.enrollments.values()).filter((e) => e.userId === userId);
  }

  /**
   * Get exam by ID.
   */
  getExam(id: string): ExamRecord {
    const exam = this.exams.get(id);
    if (!exam) throw new NotFoundException(`Exam ${id} not found`);
    return exam;
  }

  /**
   * List exams for a user.
   */
  listExamsByUser(userId: string): ExamRecord[] {
    return Array.from(this.exams.values()).filter((e) => e.userId === userId);
  }

  /** Set custom scoring function (for testing) */
  setScoringFunction(fn: (answers: ExamAnswers) => number): void {
    this.scoringFn = fn;
  }

  /** Set custom clock function (for testing) */
  setClock(fn: () => Date): void {
    this.clockFn = fn;
  }

  /** Get current time (uses custom clock if set) */
  private now(): Date {
    return this.clockFn ? this.clockFn() : new Date();
  }

  // ─── Certificate Management (Req 6.2–6.8) ───

  /**
   * Generate a unique certificate number.
   * Format: OCC-{TYPE}-{YYYYMMDD}-{RANDOM}
   */
  private generateCertNumber(certType: CertType): string {
    const date = this.now();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `OCC-${certType}-${dateStr}-${random}`;
  }

  /**
   * Issue a certificate (Req 6.2, 6.3, 6.4).
   * AI_IMPLEMENTATION_ENGINEER includes physical copy.
   */
  issueCertificate(userId: string, certType: CertType): CertificateRecord {
    if (!userId) throw new BadRequestException('userId is required');
    if (!certType) throw new BadRequestException('certType is required');

    const validTypes: CertType[] = ['OCP', 'OCE', 'OCEA', 'AI_IMPLEMENTATION_ENGINEER'];
    if (!validTypes.includes(certType)) {
      throw new BadRequestException(`Invalid cert type: ${certType}`);
    }

    // Check for existing active certificate of the same type
    const existing = Array.from(this.certificates.values()).find(
      (c) => c.userId === userId && c.certType === certType && c.status === 'active',
    );
    if (existing) {
      throw new BadRequestException(`User already has an active ${certType} certificate`);
    }

    const now = this.now();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + CERT_VALIDITY_YEARS);

    const cert: CertificateRecord = {
      id: crypto.randomUUID(),
      userId,
      certType,
      certNumber: this.generateCertNumber(certType),
      status: 'active',
      issuedAt: now,
      expiresAt,
      projectCount: 0,
      includesPhysicalCopy: certType === 'AI_IMPLEMENTATION_ENGINEER',
      annualTrainingCompleted: false,
    };

    this.certificates.set(cert.id, cert);
    this.logger.log(`Issued ${certType} certificate ${cert.certNumber} to user ${userId}`);
    return cert;
  }

  /**
   * Verify a certificate by its number (Req 6.5).
   */
  verifyCertificate(certNumber: string): CertVerification {
    if (!certNumber) throw new BadRequestException('certNumber is required');

    const cert = Array.from(this.certificates.values()).find(
      (c) => c.certNumber === certNumber,
    );

    if (!cert) {
      return {
        valid: false,
        certNumber,
        certType: 'OCP',
        status: 'revoked',
        issuedAt: '',
        expiresAt: '',
      };
    }

    // Auto-expire if past expiry date
    if (cert.status === 'active' && this.now() > cert.expiresAt) {
      cert.status = 'expired';
    }

    return {
      valid: cert.status === 'active',
      certNumber: cert.certNumber,
      certType: cert.certType,
      status: cert.status,
      issuedAt: cert.issuedAt.toISOString(),
      expiresAt: cert.expiresAt.toISOString(),
    };
  }

  /**
   * Renew a certificate (Req 6.6, 6.7).
   * Requires annual training completed + 5 projects.
   */
  renewCertificate(certId: string): CertificateRecord {
    if (!certId) throw new BadRequestException('certId is required');

    const cert = this.certificates.get(certId);
    if (!cert) throw new NotFoundException(`Certificate ${certId} not found`);

    if (cert.status === 'revoked') {
      throw new BadRequestException('Cannot renew a revoked certificate');
    }

    if (!cert.annualTrainingCompleted) {
      throw new BadRequestException('Annual training must be completed before renewal');
    }

    if (cert.projectCount < CERT_RENEWAL_MIN_PROJECTS) {
      throw new BadRequestException(
        `At least ${CERT_RENEWAL_MIN_PROJECTS} projects required for renewal (current: ${cert.projectCount})`,
      );
    }

    // Extend expiry by CERT_VALIDITY_YEARS from now (or from current expiry if still active)
    const baseDate = cert.status === 'active' && cert.expiresAt > this.now()
      ? cert.expiresAt
      : this.now();
    const newExpiry = new Date(baseDate);
    newExpiry.setFullYear(newExpiry.getFullYear() + CERT_VALIDITY_YEARS);

    cert.expiresAt = newExpiry;
    cert.status = 'active';
    cert.projectCount = 0;
    cert.annualTrainingCompleted = false;

    this.logger.log(`Renewed certificate ${cert.certNumber}, new expiry: ${newExpiry.toISOString()}`);
    return cert;
  }

  /**
   * Process certificate expiration (Req 6.7).
   * Marks certificates as expired if past expiry date and not renewed.
   */
  processExpiredCertificates(): CertificateRecord[] {
    const now = this.now();
    const expired: CertificateRecord[] = [];

    for (const cert of this.certificates.values()) {
      if (cert.status === 'active' && now > cert.expiresAt) {
        cert.status = 'expired';
        expired.push(cert);
        this.logger.log(`Certificate ${cert.certNumber} expired`);
      }
    }

    return expired;
  }

  /**
   * Get certificates needing renewal reminder (Req 6.6).
   * Returns active certificates expiring within CERT_RENEWAL_REMINDER_DAYS.
   */
  getCertificatesNeedingRenewalReminder(): CertificateRecord[] {
    const now = this.now();
    const reminderThreshold = new Date(now);
    reminderThreshold.setDate(reminderThreshold.getDate() + CERT_RENEWAL_REMINDER_DAYS);

    return Array.from(this.certificates.values()).filter(
      (c) => c.status === 'active' && c.expiresAt <= reminderThreshold && c.expiresAt > now,
    );
  }

  /**
   * Get certified personnel directory (Req 6.8).
   * Returns all users with active certificates.
   */
  getCertifiedDirectory(): CertificateRecord[] {
    // Auto-expire first
    this.processExpiredCertificates();
    return Array.from(this.certificates.values()).filter((c) => c.status === 'active');
  }

  /**
   * Get certificate by ID.
   */
  getCertificate(id: string): CertificateRecord {
    const cert = this.certificates.get(id);
    if (!cert) throw new NotFoundException(`Certificate ${id} not found`);
    return cert;
  }

  /**
   * List certificates for a user.
   */
  listCertificatesByUser(userId: string): CertificateRecord[] {
    return Array.from(this.certificates.values()).filter((c) => c.userId === userId);
  }

  /**
   * Update project count for a certificate (for renewal tracking).
   */
  updateProjectCount(certId: string, projectCount: number): CertificateRecord {
    const cert = this.certificates.get(certId);
    if (!cert) throw new NotFoundException(`Certificate ${certId} not found`);
    if (projectCount < 0) throw new BadRequestException('Project count cannot be negative');
    cert.projectCount = projectCount;
    return cert;
  }

  /**
   * Mark annual training as completed for a certificate.
   */
  completeAnnualTraining(certId: string): CertificateRecord {
    const cert = this.certificates.get(certId);
    if (!cert) throw new NotFoundException(`Certificate ${certId} not found`);
    cert.annualTrainingCompleted = true;
    return cert;
  }
}
