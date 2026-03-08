import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const Payments: CollectionConfig = {
  slug: 'payments',
  admin: {
    group: '订单管理',
    defaultColumns: ['order', 'amount', 'status', 'createdAt'],
  },
  access: {
    create: ({ req: { user } }) => !!user,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { 'order.user': { equals: user.id } }
    },
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true },
    { name: 'amount', type: 'number', required: true, min: 0, access: { update: () => false } },
    { name: 'currency', type: 'text', defaultValue: 'USD', maxLength: 3 },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: ['pending', 'succeeded', 'failed', 'refunded'],
    },
    { name: 'stripeSessionId', type: 'text' },
    { name: 'stripePaymentIntentId', type: 'text' },
  ],
}
