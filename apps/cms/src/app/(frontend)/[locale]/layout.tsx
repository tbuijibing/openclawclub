import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTimeZone } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { TimezoneProvider } from '@/providers/TimezoneProvider'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function FrontendLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as Locale)) {
    notFound()
  }

  const messages = await getMessages()
  const timeZone = await getTimeZone()

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      <TimezoneProvider locale={locale}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </TimezoneProvider>
    </NextIntlClientProvider>
  )
}
