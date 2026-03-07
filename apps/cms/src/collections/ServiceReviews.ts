import type { CollectionConfig } from 'payload'
import { completeOrderOnReview } from '../hooks/completeOrderOnReview'

export const ServiceReviews: CollectionConfig = {
  slug: 'service-reviews',
  admin: { group: '订单管理' },
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
      dbName: 'overall_rating',
    },
    { name: 'attitudeRating', type: 'number', min: 1, max: 5, dbName: 'attitude_rating' },
    { name: 'skillRating', type: 'number', min: 1, max: 5, dbName: 'skill_rating' },
    { name: 'comment', type: 'textarea' },
  ],
}
