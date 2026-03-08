import { getRequestConfig } from 'next-intl/server'
import { routing, type Locale } from './src/i18n/routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  // Validate that the incoming locale is supported
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: 'Asia/Shanghai',
  }
})

// Re-export for convenience
export { locales, defaultLocale, type Locale } from './src/i18n/routing'
