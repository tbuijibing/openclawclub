import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  admin: {
    group: '系统管理',
    defaultColumns: ['action', 'resourceType', 'user', 'createdAt'],
  },
  access: {
    create: () => false,
    read: isAdmin,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users' },
    { name: 'action', type: 'text', required: true, maxLength: 100 },
    { name: 'resourceType', type: 'text', required: true, maxLength: 50 },
    { name: 'resourceId', type: 'text', maxLength: 64 },
    { name: 'details', type: 'json' },
    { name: 'ipAddress', type: 'text' },
  ],
}
