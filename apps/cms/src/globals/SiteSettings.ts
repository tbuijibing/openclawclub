import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: { zh: '站点设置', en: 'Site Settings', ja: 'サイト設定', ko: '사이트 설정', de: 'Seiteneinstellungen', fr: 'Paramètres du site', es: 'Configuración del sitio' },
  admin: { group: { zh: '系统管理', en: 'System Management', ja: 'システム管理', ko: '시스템 관리', de: 'Systemverwaltung', fr: 'Gestion du système', es: 'Gestión del sistema' } },
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
