import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const PricingConfig: GlobalConfig = {
  slug: 'pricing-config',
  label: { zh: '定价配置', en: 'Pricing Config', ja: '価格設定', ko: '가격 설정', de: 'Preiskonfiguration', fr: 'Configuration des prix', es: 'Configuración de precios' },
  admin: { group: { zh: '系统管理', en: 'System Management', ja: 'システム管理', ko: '시스템 관리', de: 'Systemverwaltung', fr: 'Gestion du système', es: 'Gestión del sistema' } },
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
