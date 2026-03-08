import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'
import { writeAuditLog } from '../hooks/writeAuditLog'

export const InstallOrders: CollectionConfig = {
  slug: 'install-orders',
  labels: {
    singular: { zh: '安装工单', en: 'Install Order', ja: '設置工事', ko: '설치 주문', de: 'Installationsauftrag', fr: "Ordre d'installation", es: 'Orden de instalación' },
    plural: { zh: '安装工单', en: 'Install Orders', ja: '設置工事', ko: '설치 주문', de: 'Installationsaufträge', fr: "Ordres d'installation", es: 'Órdenes de instalación' },
  },
  admin: {
    group: { zh: '订单管理', en: 'Order Management', ja: '注文管理', ko: '주문 관리', de: 'Auftragsverwaltung', fr: 'Gestion des commandes', es: 'Gestión de pedidos' },
    defaultColumns: ['order', 'serviceTier', 'installStatus', 'engineer', 'createdAt'],
  },
  access: {
    create: isAdmin,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      if (user.role === 'certified_engineer') return { engineer: { equals: user.id } }
      return { 'order.user': { equals: user.id } } as any
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      if (user.role === 'certified_engineer') return { engineer: { equals: user.id } }
      return false
    },
    delete: isAdmin,
  },
  hooks: {
    afterChange: [writeAuditLog('install-orders')],
  },
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true },
    {
      name: 'serviceTier',
      type: 'select',
      required: true,
      options: ['standard', 'professional', 'enterprise'],
    },
    {
      name: 'ocsasLevel',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
      max: 3,
    },
    { name: 'engineer', type: 'relationship', relationTo: 'users' },
    {
      name: 'installStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending_dispatch',
      options: [
        'pending_dispatch',
        'accepted',
        'in_progress',
        'pending_acceptance',
        'completed',
      ],
    },
    {
      name: 'acceptedAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'completedAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
}
