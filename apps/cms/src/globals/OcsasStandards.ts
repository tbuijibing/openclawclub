import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const OcsasStandards: GlobalConfig = {
  slug: 'ocsas-standards',
  label: { zh: 'OCSAS 标准', en: 'OCSAS Standards', ja: 'OCSAS基準', ko: 'OCSAS 기준', de: 'OCSAS-Standards', fr: 'Normes OCSAS', es: 'Estándares OCSAS' },
  admin: { group: { zh: '系统管理', en: 'System Management', ja: 'システム管理', ko: '시스템 관리', de: 'Systemverwaltung', fr: 'Gestion du système', es: 'Gestión del sistema' } },
  access: { read: () => true, update: isAdmin },
  fields: [
    {
      name: 'levels',
      type: 'array',
      fields: [
        { name: 'level', type: 'number', required: true, min: 1, max: 3 },
        { name: 'name', type: 'text', required: true, localized: true },
        { name: 'description', type: 'textarea', localized: true },
        {
          name: 'checklistItems',
          type: 'array',
          fields: [
            { name: 'item', type: 'text', required: true, localized: true },
            { name: 'category', type: 'text' },
            { name: 'required', type: 'checkbox', defaultValue: true },
          ],
        },
      ],
    },
  ],
}
