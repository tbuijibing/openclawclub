import { CertificationService, ExamAnswers, CertificateRecord } from './certification.service';
import {
  COURSES,
  EXAM_DURATION_MS,
  EXAM_PASS_SCORE,
  EXAM_TOTAL_SCORE,
  CERT_PRICES,
  CERT_VALIDITY_YEARS,
  CERT_RENEWAL_MIN_PROJECTS,
  CERT_RENEWAL_REMINDER_DAYS,
  type CertType,
} from '@openclaw-club/shared';

describe('CertificationService', () => {
  let service: CertificationService;

  beforeEach(() => {
    service = new CertificationService();
  });

  describe('getCourses', () => {
    it('should return all four courses', () => {
      const courses = service.getCourses();
      expect(courses).toHaveLength(4);
    });

    it('should include the free basic intro course', () => {
      const courses = service.getCourses();
      const basic = courses.find((c) => c.id === 'basic_intro');
      expect(basic).toBeDefined();
      expect(basic!.price).toBe(0);
      expect(basic!.isFree).toBe(true);
    });

    it('should have correct pricing for paid courses', () => {
      const courses = service.getCourses();
      const prices = Object.fromEntries(courses.map((c) => [c.id, c.price]));
      expect(prices).toEqual({
        basic_intro: 0,
        advanced_skills: 99,
        enterprise_deployment: 199,
        security_config: 149,
      });
    });
  });

  describe('getCourse', () => {
    it('should return a course by ID', () => {
      const course = service.getCourse('advanced_skills');
      expect(course.id).toBe('advanced_skills');
      expect(course.price).toBe(99);
    });

    it('should throw for non-existent course', () => {
      expect(() => service.getCourse('non_existent')).toThrow(/not found/);
    });
  });

  describe('enrollCourse', () => {
    it('should enroll a user in a free course', () => {
      const enrollment = service.enrollCourse('user-1', 'basic_intro');
      expect(enrollment.userId).toBe('user-1');
      expect(enrollment.courseId).toBe('basic_intro');
      expect(enrollment.status).toBe('active');
      expect(enrollment.enrolledAt).toBeDefined();
    });

    it('should enroll a user in a paid course', () => {
      const enrollment = service.enrollCourse('user-1', 'advanced_skills');
      expect(enrollment.userId).toBe('user-1');
      expect(enrollment.courseId).toBe('advanced_skills');
      expect(enrollment.status).toBe('active');
    });

    it('should reject enrollment in non-existent course', () => {
      expect(() => service.enrollCourse('user-1', 'fake_course')).toThrow(/not found/);
    });

    it('should reject duplicate active enrollment in same course', () => {
      service.enrollCourse('user-1', 'basic_intro');
      expect(() => service.enrollCourse('user-1', 'basic_intro')).toThrow(/already enrolled/);
    });

    it('should allow enrollment in different courses', () => {
      const e1 = service.enrollCourse('user-1', 'basic_intro');
      const e2 = service.enrollCourse('user-1', 'advanced_skills');
      expect(e1.id).not.toBe(e2.id);
    });

    it('should reject empty userId', () => {
      expect(() => service.enrollCourse('', 'basic_intro')).toThrow(/userId is required/);
    });

    it('should reject empty courseId', () => {
      expect(() => service.enrollCourse('user-1', '')).toThrow(/courseId is required/);
    });
  });

  describe('startExam', () => {
    it('should start an exam for an enrolled user', () => {
      service.enrollCourse('user-1', 'basic_intro');
      const exam = service.startExam('user-1', 'basic_intro');
      expect(exam.userId).toBe('user-1');
      expect(exam.courseId).toBe('basic_intro');
      expect(exam.status).toBe('in_progress');
      expect(exam.totalScore).toBe(EXAM_TOTAL_SCORE);
    });

    it('should reject starting exam without enrollment', () => {
      expect(() => service.startExam('user-1', 'basic_intro')).toThrow(/not enrolled/);
    });

    it('should reject starting a second in-progress exam', () => {
      service.enrollCourse('user-1', 'basic_intro');
      service.startExam('user-1', 'basic_intro');
      expect(() => service.startExam('user-1', 'basic_intro')).toThrow(/already has an in-progress exam/);
    });
  });

  describe('submitExam', () => {
    it('should pass exam with score >= 80', () => {
      service.enrollCourse('user-1', 'basic_intro');
      const exam = service.startExam('user-1', 'basic_intro');

      // Set scoring to return 85
      service.setScoringFunction(() => 85);

      const result = service.submitExam('user-1', exam.id, { q1: 'a', q2: 'b' });
      expect(result.score).toBe(85);
      expect(result.passed).toBe(true);
      expect(result.totalScore).toBe(EXAM_TOTAL_SCORE);
      expect(result.submittedAt).toBeDefined();
    });

    it('should fail exam with score < 80', () => {
      service.enrollCourse('user-1', 'basic_intro');
      const exam = service.startExam('user-1', 'basic_intro');

      service.setScoringFunction(() => 70);

      const result = service.submitExam('user-1', exam.id, { q1: 'a' });
      expect(result.score).toBe(70);
      expect(result.passed).toBe(false);
    });

    it('should mark enrollment as completed when exam passes', () => {
      const enrollment = service.enrollCourse('user-1', 'basic_intro');
      const exam = service.startExam('user-1', 'basic_intro');

      service.setScoringFunction(() => 90);
      service.submitExam('user-1', exam.id, { q1: 'a' });

      const updated = service.getEnrollment(enrollment.id);
      expect(updated.status).toBe('completed');
      expect(updated.completedAt).toBeDefined();
    });

    it('should not mark enrollment as completed when exam fails', () => {
      const enrollment = service.enrollCourse('user-1', 'basic_intro');
      const exam = service.startExam('user-1', 'basic_intro');

      service.setScoringFunction(() => 50);
      service.submitExam('user-1', exam.id, { q1: 'a' });

      const updated = service.getEnrollment(enrollment.id);
      expect(updated.status).toBe('active');
    });

    it('should reject submission for expired exam (2-hour limit)', () => {
      service.enrollCourse('user-1', 'basic_intro');
      const exam = service.startExam('user-1', 'basic_intro');

      // Manually set startedAt to 3 hours ago
      const examRecord = service.getExam(exam.id);
      examRecord.startedAt = new Date(Date.now() - EXAM_DURATION_MS - 1000);

      expect(() =>
        service.submitExam('user-1', exam.id, { q1: 'a' }),
      ).toThrow(/time limit exceeded/);
    });

    it('should reject submission for non-existent exam', () => {
      expect(() =>
        service.submitExam('user-1', 'fake-exam', { q1: 'a' }),
      ).toThrow(/not found/);
    });

    it('should reject submission from wrong user', () => {
      service.enrollCourse('user-1', 'basic_intro');
      const exam = service.startExam('user-1', 'basic_intro');

      expect(() =>
        service.submitExam('user-2', exam.id, { q1: 'a' }),
      ).toThrow(/does not belong/);
    });

    it('should reject submission for already submitted exam', () => {
      service.enrollCourse('user-1', 'basic_intro');
      const exam = service.startExam('user-1', 'basic_intro');

      service.setScoringFunction(() => 90);
      service.submitExam('user-1', exam.id, { q1: 'a' });

      expect(() =>
        service.submitExam('user-1', exam.id, { q1: 'b' }),
      ).toThrow(/not in progress/);
    });

    it('should reject empty answers', () => {
      service.enrollCourse('user-1', 'basic_intro');
      const exam = service.startExam('user-1', 'basic_intro');

      expect(() =>
        service.submitExam('user-1', exam.id, {}),
      ).toThrow(/answers are required/);
    });

    it('should clamp score to 0-100 range', () => {
      service.enrollCourse('user-1', 'basic_intro');
      const exam = service.startExam('user-1', 'basic_intro');

      service.setScoringFunction(() => 150);
      const result = service.submitExam('user-1', exam.id, { q1: 'a' });
      expect(result.score).toBe(EXAM_TOTAL_SCORE);
    });

    it('should clamp negative score to 0', () => {
      service.enrollCourse('user-1', 'basic_intro');
      const exam = service.startExam('user-1', 'basic_intro');

      service.setScoringFunction(() => -10);
      const result = service.submitExam('user-1', exam.id, { q1: 'a' });
      expect(result.score).toBe(0);
      expect(result.passed).toBe(false);
    });

    it('should pass with exactly 80 score (boundary)', () => {
      service.enrollCourse('user-1', 'basic_intro');
      const exam = service.startExam('user-1', 'basic_intro');

      service.setScoringFunction(() => EXAM_PASS_SCORE);
      const result = service.submitExam('user-1', exam.id, { q1: 'a' });
      expect(result.score).toBe(80);
      expect(result.passed).toBe(true);
    });

    it('should fail with score 79 (just below pass threshold)', () => {
      service.enrollCourse('user-1', 'basic_intro');
      const exam = service.startExam('user-1', 'basic_intro');

      service.setScoringFunction(() => EXAM_PASS_SCORE - 1);
      const result = service.submitExam('user-1', exam.id, { q1: 'a' });
      expect(result.score).toBe(79);
      expect(result.passed).toBe(false);
    });
  });

  describe('listEnrollmentsByUser', () => {
    it('should list all enrollments for a user', () => {
      service.enrollCourse('user-1', 'basic_intro');
      service.enrollCourse('user-1', 'advanced_skills');
      service.enrollCourse('user-2', 'basic_intro');

      expect(service.listEnrollmentsByUser('user-1')).toHaveLength(2);
      expect(service.listEnrollmentsByUser('user-2')).toHaveLength(1);
      expect(service.listEnrollmentsByUser('user-3')).toHaveLength(0);
    });
  });

  describe('listExamsByUser', () => {
    it('should list all exams for a user', () => {
      service.enrollCourse('user-1', 'basic_intro');
      service.enrollCourse('user-1', 'advanced_skills');
      service.startExam('user-1', 'basic_intro');
      service.startExam('user-1', 'advanced_skills');

      expect(service.listExamsByUser('user-1')).toHaveLength(2);
      expect(service.listExamsByUser('user-2')).toHaveLength(0);
    });
  });

  // ─── Certificate Management Tests (Req 6.2–6.8) ───

  describe('issueCertificate', () => {
    it('should issue an OCP certificate with correct pricing tier', () => {
      const cert = service.issueCertificate('user-1', 'OCP');
      expect(cert.userId).toBe('user-1');
      expect(cert.certType).toBe('OCP');
      expect(cert.status).toBe('active');
      expect(cert.certNumber).toMatch(/^OCC-OCP-/);
      expect(cert.includesPhysicalCopy).toBe(false);
    });

    it('should issue all four certification types', () => {
      const types: CertType[] = ['OCP', 'OCE', 'OCEA', 'AI_IMPLEMENTATION_ENGINEER'];
      types.forEach((type) => {
        const cert = service.issueCertificate(`user-${type}`, type);
        expect(cert.certType).toBe(type);
        expect(cert.status).toBe('active');
      });
    });

    it('should include physical copy for AI_IMPLEMENTATION_ENGINEER only', () => {
      const aiCert = service.issueCertificate('user-1', 'AI_IMPLEMENTATION_ENGINEER');
      expect(aiCert.includesPhysicalCopy).toBe(true);

      const ocpCert = service.issueCertificate('user-2', 'OCP');
      expect(ocpCert.includesPhysicalCopy).toBe(false);
    });

    it('should set 2-year validity period', () => {
      const cert = service.issueCertificate('user-1', 'OCP');
      const expectedExpiry = new Date(cert.issuedAt);
      expectedExpiry.setFullYear(expectedExpiry.getFullYear() + CERT_VALIDITY_YEARS);
      expect(cert.expiresAt.getTime()).toBe(expectedExpiry.getTime());
    });

    it('should generate unique certificate numbers', () => {
      const cert1 = service.issueCertificate('user-1', 'OCP');
      const cert2 = service.issueCertificate('user-2', 'OCP');
      expect(cert1.certNumber).not.toBe(cert2.certNumber);
    });

    it('should reject duplicate active certificate of same type', () => {
      service.issueCertificate('user-1', 'OCP');
      expect(() => service.issueCertificate('user-1', 'OCP')).toThrow(/already has an active/);
    });

    it('should allow different cert types for same user', () => {
      const c1 = service.issueCertificate('user-1', 'OCP');
      const c2 = service.issueCertificate('user-1', 'OCE');
      expect(c1.certType).toBe('OCP');
      expect(c2.certType).toBe('OCE');
    });

    it('should reject invalid cert type', () => {
      expect(() => service.issueCertificate('user-1', 'INVALID' as any)).toThrow(/Invalid cert type/);
    });

    it('should reject empty userId', () => {
      expect(() => service.issueCertificate('', 'OCP')).toThrow(/userId is required/);
    });

    it('should initialize projectCount to 0', () => {
      const cert = service.issueCertificate('user-1', 'OCP');
      expect(cert.projectCount).toBe(0);
    });
  });

  describe('verifyCertificate', () => {
    it('should verify an active certificate as valid', () => {
      const cert = service.issueCertificate('user-1', 'OCP');
      const result = service.verifyCertificate(cert.certNumber);
      expect(result.valid).toBe(true);
      expect(result.certNumber).toBe(cert.certNumber);
      expect(result.certType).toBe('OCP');
      expect(result.status).toBe('active');
      expect(result.issuedAt).toBe(cert.issuedAt.toISOString());
      expect(result.expiresAt).toBe(cert.expiresAt.toISOString());
    });

    it('should return invalid for non-existent certificate number', () => {
      const result = service.verifyCertificate('FAKE-NUMBER');
      expect(result.valid).toBe(false);
    });

    it('should auto-expire certificate past expiry date', () => {
      const cert = service.issueCertificate('user-1', 'OCP');
      // Move clock past expiry
      service.setClock(() => new Date(cert.expiresAt.getTime() + 1000));
      const result = service.verifyCertificate(cert.certNumber);
      expect(result.valid).toBe(false);
      expect(result.status).toBe('expired');
    });

    it('should reject empty certNumber', () => {
      expect(() => service.verifyCertificate('')).toThrow(/certNumber is required/);
    });
  });

  describe('renewCertificate', () => {
    it('should renew a certificate when requirements are met', () => {
      const cert = service.issueCertificate('user-1', 'OCP');
      const originalExpiry = new Date(cert.expiresAt);
      service.completeAnnualTraining(cert.id);
      service.updateProjectCount(cert.id, CERT_RENEWAL_MIN_PROJECTS);

      const renewed = service.renewCertificate(cert.id);
      expect(renewed.status).toBe('active');
      expect(renewed.expiresAt.getTime()).toBeGreaterThan(originalExpiry.getTime());
      expect(renewed.projectCount).toBe(0); // Reset after renewal
      expect(renewed.annualTrainingCompleted).toBe(false); // Reset after renewal
    });

    it('should reject renewal without annual training', () => {
      const cert = service.issueCertificate('user-1', 'OCP');
      service.updateProjectCount(cert.id, CERT_RENEWAL_MIN_PROJECTS);
      expect(() => service.renewCertificate(cert.id)).toThrow(/Annual training/);
    });

    it('should reject renewal with insufficient projects', () => {
      const cert = service.issueCertificate('user-1', 'OCP');
      service.completeAnnualTraining(cert.id);
      service.updateProjectCount(cert.id, CERT_RENEWAL_MIN_PROJECTS - 1);
      expect(() => service.renewCertificate(cert.id)).toThrow(/projects required/);
    });

    it('should reject renewal of revoked certificate', () => {
      const cert = service.issueCertificate('user-1', 'OCP');
      // Manually revoke
      const record = service.getCertificate(cert.id);
      (record as any).status = 'revoked';
      service.completeAnnualTraining(cert.id);
      service.updateProjectCount(cert.id, CERT_RENEWAL_MIN_PROJECTS);
      expect(() => service.renewCertificate(cert.id)).toThrow(/revoked/);
    });

    it('should extend from current expiry if still active', () => {
      const cert = service.issueCertificate('user-1', 'OCP');
      const originalExpiry = new Date(cert.expiresAt);
      service.completeAnnualTraining(cert.id);
      service.updateProjectCount(cert.id, CERT_RENEWAL_MIN_PROJECTS);

      const renewed = service.renewCertificate(cert.id);
      const expectedExpiry = new Date(originalExpiry);
      expectedExpiry.setFullYear(expectedExpiry.getFullYear() + CERT_VALIDITY_YEARS);
      expect(renewed.expiresAt.getTime()).toBe(expectedExpiry.getTime());
    });

    it('should renew an expired certificate from current time', () => {
      const cert = service.issueCertificate('user-1', 'OCP');
      // Move clock past expiry
      const futureDate = new Date(cert.expiresAt.getTime() + 86400000);
      service.setClock(() => futureDate);
      // Auto-expire via verify
      service.verifyCertificate(cert.certNumber);

      service.completeAnnualTraining(cert.id);
      service.updateProjectCount(cert.id, CERT_RENEWAL_MIN_PROJECTS);

      const renewed = service.renewCertificate(cert.id);
      expect(renewed.status).toBe('active');
      const expectedExpiry = new Date(futureDate);
      expectedExpiry.setFullYear(expectedExpiry.getFullYear() + CERT_VALIDITY_YEARS);
      expect(renewed.expiresAt.getTime()).toBe(expectedExpiry.getTime());
    });

    it('should throw for non-existent certificate', () => {
      expect(() => service.renewCertificate('non-existent')).toThrow(/not found/);
    });
  });

  describe('processExpiredCertificates', () => {
    it('should mark expired certificates', () => {
      const cert = service.issueCertificate('user-1', 'OCP');
      // Move clock past expiry
      service.setClock(() => new Date(cert.expiresAt.getTime() + 1000));
      const expired = service.processExpiredCertificates();
      expect(expired).toHaveLength(1);
      expect(expired[0].certNumber).toBe(cert.certNumber);
      expect(expired[0].status).toBe('expired');
    });

    it('should not affect active certificates within validity', () => {
      service.issueCertificate('user-1', 'OCP');
      const expired = service.processExpiredCertificates();
      expect(expired).toHaveLength(0);
    });
  });

  describe('getCertificatesNeedingRenewalReminder', () => {
    it('should return certificates expiring within 60 days', () => {
      const cert = service.issueCertificate('user-1', 'OCP');
      // Move clock to 30 days before expiry
      const reminderDate = new Date(cert.expiresAt.getTime() - 30 * 24 * 60 * 60 * 1000);
      service.setClock(() => reminderDate);

      const reminders = service.getCertificatesNeedingRenewalReminder();
      expect(reminders).toHaveLength(1);
      expect(reminders[0].certNumber).toBe(cert.certNumber);
    });

    it('should not return certificates far from expiry', () => {
      service.issueCertificate('user-1', 'OCP');
      // Clock is at issuance time, far from expiry
      const reminders = service.getCertificatesNeedingRenewalReminder();
      expect(reminders).toHaveLength(0);
    });
  });

  describe('getCertifiedDirectory', () => {
    it('should return all active certificate holders', () => {
      service.issueCertificate('user-1', 'OCP');
      service.issueCertificate('user-2', 'OCE');
      service.issueCertificate('user-3', 'OCEA');

      const directory = service.getCertifiedDirectory();
      expect(directory).toHaveLength(3);
    });

    it('should exclude expired certificates', () => {
      const cert = service.issueCertificate('user-1', 'OCP');
      service.issueCertificate('user-2', 'OCE');

      // Expire user-1's cert
      service.setClock(() => new Date(cert.expiresAt.getTime() + 1000));

      const directory = service.getCertifiedDirectory();
      // user-2's cert also expires since same clock
      // Both were issued at roughly the same time, so both expire
      expect(directory).toHaveLength(0);
    });

    it('should return empty array when no active certificates', () => {
      const directory = service.getCertifiedDirectory();
      expect(directory).toHaveLength(0);
    });
  });

  describe('updateProjectCount', () => {
    it('should update project count', () => {
      const cert = service.issueCertificate('user-1', 'OCP');
      const updated = service.updateProjectCount(cert.id, 3);
      expect(updated.projectCount).toBe(3);
    });

    it('should reject negative project count', () => {
      const cert = service.issueCertificate('user-1', 'OCP');
      expect(() => service.updateProjectCount(cert.id, -1)).toThrow(/cannot be negative/);
    });

    it('should throw for non-existent certificate', () => {
      expect(() => service.updateProjectCount('fake', 1)).toThrow(/not found/);
    });
  });

  describe('completeAnnualTraining', () => {
    it('should mark annual training as completed', () => {
      const cert = service.issueCertificate('user-1', 'OCP');
      expect(cert.annualTrainingCompleted).toBe(false);
      const updated = service.completeAnnualTraining(cert.id);
      expect(updated.annualTrainingCompleted).toBe(true);
    });

    it('should throw for non-existent certificate', () => {
      expect(() => service.completeAnnualTraining('fake')).toThrow(/not found/);
    });
  });
});
