import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  labels: {
    singular: { zh: '审计日志', en: 'Audit Log', ja: '監査ログ', ko: '감사 로그', de: 'Prüfprotokoll', fr: "Journal d'audit", es: 'Registro de auditoría' },
    plural: { zh: '审计日志', en: 'Audit Logs', ja: '監査ログ', ko: '감사 로그', de: 'Prüfprotokolle', fr: "Journaux d'audit", es: 'Registros de auditoría' },
  },
  admin: {
    group: { zh: '系统管理', en: 'System Management', ja: 'システム管理', ko: '시스템 관리', de: 'Systemverwaltung', fr: 'Gestion du système', es: 'Gestión del sistema' },
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
