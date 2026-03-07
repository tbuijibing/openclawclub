import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: '系统管理' },
  access: { read: () => true, update: isAdmin },
  fields: [
    { name: 'platformName', type: 'text', defaultValue: 'OpenClaw Club', localized: true },
    { name: 'logoUrl', type: 'text' },
    {
      name: 'defaultLanguage',
      type: 'select',
      defaultValue: 'zh',
      options: ['zh', 'en', 'ja', 'ko', 'de', 'fr', 'es'],
    },
    { name: 'contactEmail', type: 'email' },
  ],
}
