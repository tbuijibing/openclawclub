import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const PricingConfig: GlobalConfig = {
  slug: 'pricing-config',
  admin: { group: '系统管理' },
  access: { read: () => true, update: isAdmin },
  fields: [
    {
      name: 'installationPricing',
      type: 'group',
      fields: [
        { name: 'standard', type: 'number', defaultValue: 99 },
        { name: 'professional', type: 'number', defaultValue: 299 },
        { name: 'enterprise', type: 'number', defaultValue: 999 },
      ],
    },
  ],
}
