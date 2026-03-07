import { get } from './client';

export const ocsasApi = {
  getLevels: () => get<any[]>('/ocsas/levels'),
  getLevel: (level: number) => get<any>(`/ocsas/levels/${level}`),
};
