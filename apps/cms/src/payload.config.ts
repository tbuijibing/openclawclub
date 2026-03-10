import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { zh } from 'payload/i18n/zh'
import { en } from 'payload/i18n/en'
import { ja } from 'payload/i18n/ja'
import { ko } from 'payload/i18n/ko'
import { de } from 'payload/i18n/de'
import { fr } from 'payload/i18n/fr'
import { es } from 'payload/i18n/es'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Orders } from './collections/Orders'
import { Payments } from './collections/Payments'
import { InstallOrders } from './collections/InstallOrders'
import { DeliveryReports } from './collections/DeliveryReports'
import { ServiceReviews } from './collections/ServiceReviews'
import { HardwareProducts } from './collections/HardwareProducts'
import { AuditLogs } from './collections/AuditLogs'
import { BusinessDictionary } from './collections/BusinessDictionary'
import { DataDictionary } from './collections/DataDictionary'

import { SiteSettings } from './globals/SiteSettings'
import { PricingConfig } from './globals/PricingConfig'
import { OcsasStandards } from './globals/OcsasStandards'
import { adminTranslations } from './i18n/admin-translations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: { titleSuffix: '- OpenClaw Club' },
  },
  collections: [
    Users, Orders, Payments, InstallOrders,
    DeliveryReports, ServiceReviews, HardwareProducts,
    AuditLogs, Media, BusinessDictionary, DataDictionary,
  ],
  globals: [SiteSettings, PricingConfig, OcsasStandards],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString:
        process.env.DATABASE_URI ||
        'postgresql://justin@localhost:5432/openclaw_club',
    },
    push: false,
  }),
  i18n: {
    fallbackLanguage: 'zh',
    supportedLanguages: { zh, en, ja, ko, de, fr, es, ur: en, vi: en, ms: en },
    translations: adminTranslations,
  },
  localization: {
    locales: [
      { label: '中文', code: 'zh' },
      { label: 'English', code: 'en' },
      { label: '日本語', code: 'ja' },
      { label: '한국어', code: 'ko' },
      { label: 'Deutsch', code: 'de' },
      { label: 'Français', code: 'fr' },
      { label: 'Español', code: 'es' },
      { label: 'اردو', code: 'ur' },
      { label: 'Tiếng Việt', code: 'vi' },
      { label: 'Bahasa Melayu', code: 'ms' },
    ],
    defaultLocale: 'zh',
    fallback: true,
  },
  sharp,
  plugins: [],
})
