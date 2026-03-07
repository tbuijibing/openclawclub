import { get } from './client';

export const subscriptionsApi = {
  getPacks: () => get<any[]>('/subscriptions/packs'),
  listByUser: (userId: string) => get<any[]>(`/subscriptions/user/${userId}`),
  getSubscription: (id: string) => get<any>(`/subscriptions/${id}`),
};
