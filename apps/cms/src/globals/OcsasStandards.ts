import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const OcsasStandards: GlobalConfig = {
  slug: 'ocsas-standards',
  admin: { group: '系统管理' },
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
