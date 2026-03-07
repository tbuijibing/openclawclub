export class EnrollCourseDto {
  userId!: string;
  courseId!: string;
}

export class StartExamDto {
  userId!: string;
  courseId!: string;
}

export class SubmitExamDto {
  userId!: string;
  examId!: string;
  answers!: Record<string, string>;
}

export class IssueCertificateDto {
  userId!: string;
  certType!: string;
}

export class VerifyCertificateDto {
  certNumber!: string;
}

export class RenewCertificateDto {
  certId!: string;
}
