import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'
import { writeAuditLog } from '../hooks/writeAuditLog'

export const InstallOrders: CollectionConfig = {
  slug: 'install-orders',
  admin: {
    group: '订单管理',
    defaultColumns: ['order', 'serviceTier', 'installStatus', 'engineer', 'createdAt'],
  },
  access: {
    create: isAdmin,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      if (user.role === 'certified_engineer') return { engineer: { equals: user.id } }
      return { 'order.user': { equals: user.id } }
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
      dbName: 'service_tier',
    },
    {
      name: 'ocsasLevel',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
      max: 3,
      dbName: 'ocsas_level',
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
      dbName: 'install_status',
    },
    {
      name: 'acceptedAt',
      type: 'date',
      dbName: 'accepted_at',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'completedAt',
      type: 'date',
      dbName: 'completed_at',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
}
