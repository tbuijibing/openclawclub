import { defineRouting } from 'next-intl/routing'

export const locales = ['zh', 'en', 'ja', 'ko', 'de', 'fr', 'es'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'zh'

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
})
