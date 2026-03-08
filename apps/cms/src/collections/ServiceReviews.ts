import type { CollectionConfig } from 'payload'
import { completeOrderOnReview } from '../hooks/completeOrderOnReview'

export const ServiceReviews: CollectionConfig = {
  slug: 'service-reviews',
  labels: {
    singular: { zh: '服务评价', en: 'Service Review', ja: 'サービス評価', ko: '서비스 리뷰', de: 'Servicebewertung', fr: 'Avis de service', es: 'Reseña de servicio' },
    plural: { zh: '服务评价', en: 'Service Reviews', ja: 'サービス評価', ko: '서비스 리뷰', de: 'Servicebewertungen', fr: 'Avis de service', es: 'Reseñas de servicio' },
  },
  admin: { group: { zh: '订单管理', en: 'Order Management', ja: '注文管理', ko: '주문 관리', de: 'Auftragsverwaltung', fr: 'Gestion des commandes', es: 'Gestión de pedidos' } },
  access: {
    create: ({ req: { user } }) => !!user,
    read: () => true,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: {
    afterChange: [completeOrderOnReview],
  },
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true },
    {
      name: 'overallRating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
    },
    { name: 'attitudeRating', type: 'number', min: 1, max: 5 },
    { name: 'skillRating', type: 'number', min: 1, max: 5 },
    { name: 'comment', type: 'textarea' },
  ],
}
