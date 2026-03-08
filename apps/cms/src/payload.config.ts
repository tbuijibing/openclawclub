import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Orders } from './collections/Orders'
import { Payments } from './collections/Payments'
import { InstallOrders } from './collections/InstallOrders'
import { DeliveryReports } from './collections/DeliveryReports'
import { ServiceReviews } from './collections/ServiceReviews'
import { HardwareProducts } from './collections/HardwareProducts'
import { AuditLogs } from './collections/AuditLogs'

import { SiteSettings } from './globals/SiteSettings'
import { PricingConfig } from './globals/PricingConfig'
import { OcsasStandards } from './globals/OcsasStandards'

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
    AuditLogs, Media,
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
  },
  localization: {
    locales: ['zh', 'en', 'ja', 'ko', 'de', 'fr', 'es'],
    defaultLocale: 'zh',
    fallback: true,
  },
  sharp,
  plugins: [],
})
