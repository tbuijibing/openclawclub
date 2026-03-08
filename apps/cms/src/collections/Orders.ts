import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'
import { generateOrderNumber } from '../hooks/generateOrderNumber'
import { createInstallOrder } from '../hooks/createInstallOrder'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: {
    singular: { zh: '订单', en: 'Order', ja: '注文', ko: '주문', de: 'Bestellung', fr: 'Commande', es: 'Pedido' },
    plural: { zh: '订单', en: 'Orders', ja: '注文', ko: '주문', de: 'Bestellungen', fr: 'Commandes', es: 'Pedidos' },
  },
  admin: {
    useAsTitle: 'orderNumber',
    group: { zh: '订单管理', en: 'Order Management', ja: '注文管理', ko: '주문 관리', de: 'Auftragsverwaltung', fr: 'Gestion des commandes', es: 'Gestión de pedidos' },
    defaultColumns: ['orderNumber', 'user', 'status', 'totalAmount', 'createdAt'],
    listSearchableFields: ['orderNumber'],
  },
  access: {
    create: ({ req: { user } }) => !!user,
    read: ({ req: { user } }) => {
      if (!user) return false
      if ((user as any).role === 'admin') return true
      return { user: { equals: user.id } }
    },
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [generateOrderNumber],
    afterChange: [createInstallOrder],
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      unique: true,
      access: { update: () => false },
      admin: { readOnly: true },
    },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending_payment',
      options: [
        'pending_payment',
        'paid',
        'dispatched',
        'accepted',
        'in_progress',
        'completed',
        'cancelled',
      ],
    },
    { name: 'totalAmount', type: 'number', required: true, min: 0 },
    { name: 'currency', type: 'text', defaultValue: 'USD', maxLength: 3 },
    { name: 'region', type: 'select', options: ['apac', 'na', 'eu'] },
    { name: 'product', type: 'relationship', relationTo: 'hardware-products' as any },
    {
      name: 'serviceTier',
      type: 'select',
      options: ['standard', 'professional', 'enterprise'],
    },
  ],
}
