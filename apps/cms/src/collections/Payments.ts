import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const Payments: CollectionConfig = {
  slug: 'payments',
  labels: {
    singular: { zh: '支付记录', en: 'Payment', ja: '支払い', ko: '결제', de: 'Zahlung', fr: 'Paiement', es: 'Pago' },
    plural: { zh: '支付记录', en: 'Payments', ja: '支払い', ko: '결제', de: 'Zahlungen', fr: 'Paiements', es: 'Pagos' },
  },
  admin: {
    group: { zh: '订单管理', en: 'Order Management', ja: '注文管理', ko: '주문 관리', de: 'Auftragsverwaltung', fr: 'Gestion des commandes', es: 'Gestión de pedidos' },
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
