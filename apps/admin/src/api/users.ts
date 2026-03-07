import { get, post } from './client';

export const usersApi = {
  getMe: () => get<any>('/users/me'),
  assignRole: (userId: string, role: string) =>
    post<any>('/users/roles/assign', { userId, role }),
};
