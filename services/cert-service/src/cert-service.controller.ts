import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { CertificationService } from './certification.service';
import {
  EnrollCourseDto,
  StartExamDto,
  SubmitExamDto,
  IssueCertificateDto,
  VerifyCertificateDto,
  RenewCertificateDto,
} from './dto/certification.dto';

@Controller('certifications')
export class CertServiceController {
  constructor(private readonly certificationService: CertificationService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'cert-service' };
  }

  // ─── Course & Exam Endpoints ───

  /** Get all available courses (Req 6.1) */
  @Get('courses')
  getCourses() {
    return this.certificationService.getCourses();
  }

  /** Get a specific course */
  @Get('courses/:courseId')
  getCourse(@Param('courseId') courseId: string) {
    return this.certificationService.getCourse(courseId);
  }

  /** Enroll in a course (Req 6.1) */
  @Post('enrollments')
  @HttpCode(HttpStatus.CREATED)
  enrollCourse(@Body() dto: EnrollCourseDto) {
    return this.certificationService.enrollCourse(dto.userId, dto.courseId);
  }

  /** Start an exam for an enrolled course */
  @Post('exams/start')
  @HttpCode(HttpStatus.CREATED)
  startExam(@Body() dto: StartExamDto) {
    return this.certificationService.startExam(dto.userId, dto.courseId);
  }

  /** Submit exam answers (Req 6.3) */
  @Post('exams/submit')
  submitExam(@Body() dto: SubmitExamDto) {
    return this.certificationService.submitExam(dto.userId, dto.examId, dto.answers);
  }

  /** Get enrollment by ID */
  @Get('enrollments/:id')
  getEnrollment(@Param('id') id: string) {
    return this.certificationService.getEnrollment(id);
  }

  /** List enrollments for a user */
  @Get('enrollments/user/:userId')
  listEnrollmentsByUser(@Param('userId') userId: string) {
    return this.certificationService.listEnrollmentsByUser(userId);
  }

  /** Get exam by ID */
  @Get('exams/:id')
  getExam(@Param('id') id: string) {
    return this.certificationService.getExam(id);
  }

  /** List exams for a user */
  @Get('exams/user/:userId')
  listExamsByUser(@Param('userId') userId: string) {
    return this.certificationService.listExamsByUser(userId);
  }

  // ─── Certificate Endpoints (Req 6.2–6.8) ───

  /** Issue a certificate (Req 6.2, 6.3, 6.4) */
  @Post('certificates')
  @HttpCode(HttpStatus.CREATED)
  issueCertificate(@Body() dto: IssueCertificateDto) {
    return this.certificationService.issueCertificate(dto.userId, dto.certType as any);
  }

  /** Verify a certificate by number (Req 6.5) */
  @Post('certificates/verify')
  verifyCertificate(@Body() dto: VerifyCertificateDto) {
    return this.certificationService.verifyCertificate(dto.certNumber);
  }

  /** Renew a certificate (Req 6.6, 6.7) */
  @Post('certificates/:certId/renew')
  renewCertificate(@Param('certId') certId: string) {
    return this.certificationService.renewCertificate(certId);
  }

  /** Get certificate by ID */
  @Get('certificates/:id')
  getCertificate(@Param('id') id: string) {
    return this.certificationService.getCertificate(id);
  }

  /** List certificates for a user */
  @Get('certificates/user/:userId')
  listCertificatesByUser(@Param('userId') userId: string) {
    return this.certificationService.listCertificatesByUser(userId);
  }

  /** Get certified personnel directory (Req 6.8) */
  @Get('directory')
  getCertifiedDirectory() {
    return this.certificationService.getCertifiedDirectory();
  }

  /** Update project count for renewal tracking */
  @Patch('certificates/:certId/projects')
  updateProjectCount(@Param('certId') certId: string, @Body() body: { projectCount: number }) {
    return this.certificationService.updateProjectCount(certId, body.projectCount);
  }

  /** Mark annual training as completed */
  @Post('certificates/:certId/complete-training')
  completeAnnualTraining(@Param('certId') certId: string) {
    return this.certificationService.completeAnnualTraining(certId);
  }
}
