import { getRequestConfig } from 'next-intl/server'

export const locales = ['zh', 'en', 'ja', 'ko', 'de', 'fr', 'es'] as const
export const defaultLocale = 'zh'

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) || defaultLocale

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
