import { get, post } from './client';

export const certificationsApi = {
  getCourses: () => get<any[]>('/certifications/courses'),
  getCourse: (id: string) => get<any>(`/certifications/courses/${id}`),
  listCertificates: (userId: string) => get<any[]>(`/certifications/certificates/user/${userId}`),
  getDirectory: () => get<any[]>('/certifications/directory'),
  verifyCertificate: (certNumber: string) => post<any>('/certifications/certificates/verify', { certNumber }),
};
