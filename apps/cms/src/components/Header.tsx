'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Globe, Menu, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Link, useRouter, usePathname } from '@/i18n/navigation'

const localeLabels: Record<string, string> = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
}

const timezones = [
  { label: '亚太 (上海)', value: 'Asia/Shanghai', short: 'CST' },
  { label: '亚太 (东京)', value: 'Asia/Tokyo', short: 'JST' },
  { label: '亚太 (首尔)', value: 'Asia/Seoul', short: 'KST' },
  { label: '北美 (纽约)', value: 'America/New_York', short: 'EST' },
  { label: '北美 (洛杉矶)', value: 'America/Los_Angeles', short: 'PST' },
  { label: '欧洲 (伦敦)', value: 'Europe/London', short: 'GMT' },
  { label: '欧洲 (柏林)', value: 'Europe/Berlin', short: 'CET' },
  { label: '欧洲 (巴黎)', value: 'Europe/Paris', short: 'CET' },
  { label: '欧洲 (马德里)', value: 'Europe/Madrid', short: 'CET' },
]

const localeList = Object.keys(localeLabels)

export function Header() {
  const t = useTranslations('nav')
  const tHeader = useTranslations('header')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [tzOpen, setTzOpen] = useState(false)

  const [currentTz, setCurrentTz] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone
    }
    return 'Asia/Shanghai'
  })

  const navLinks = [
    { href: '/' as const, label: t('home') },
    { href: '/products' as const, label: t('products') },
    { href: '/orders' as const, label: t('orders') },
  ]

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as any })
    setLangOpen(false)
  }

  const switchTimezone = (tz: string) => {
    setCurrentTz(tz)
    if (typeof window !== 'undefined') {
      localStorage.setItem('timezone', tz)
    }
    setTzOpen(false)
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold">
          OpenClaw Club
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Timezone switcher */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setTzOpen(!tzOpen); setLangOpen(false) }}
              aria-label={tHeader('timezone')}
              title={currentTz}
            >
              <Clock className="h-5 w-5" />
            </Button>
            {tzOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-popover p-1 shadow-md z-50">
                {timezones.map((tz) => (
                  <button
                    key={tz.value}
                    onClick={() => switchTimezone(tz.value)}
                    className={`w-full rounded-sm px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent ${
                      tz.value === currentTz ? 'font-semibold text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {tz.label} ({tz.short})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language switcher */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setLangOpen(!langOpen); setTzOpen(false) }}
              aria-label={tHeader('language')}
            >
              <Globe className="h-5 w-5" />
            </Button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 rounded-md border bg-popover p-1 shadow-md z-50">
                {localeList.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => switchLocale(loc)}
                    className={`w-full rounded-sm px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent ${
                      loc === locale ? 'font-semibold text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {localeLabels[loc]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ThemeToggle />

          <Link href="/auth/login">
            <Button variant="ghost" size="sm">{t('login')}</Button>
          </Link>
          <Link href="/auth/register">
            <Button size="sm">{t('register')}</Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={tHeader('menu')}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-2 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => { setTzOpen(!tzOpen); setLangOpen(false) }} aria-label={tHeader('timezone')}>
                <Clock className="h-5 w-5" />
              </Button>
              {tzOpen && (
                <div className="absolute left-0 top-full mt-1 w-48 rounded-md border bg-popover p-1 shadow-md z-50">
                  {timezones.map((tz) => (
                    <button key={tz.value} onClick={() => switchTimezone(tz.value)} className={`w-full rounded-sm px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent ${tz.value === currentTz ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                      {tz.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => { setLangOpen(!langOpen); setTzOpen(false) }} aria-label={tHeader('language')}>
                <Globe className="h-5 w-5" />
              </Button>
              {langOpen && (
                <div className="absolute left-0 top-full mt-1 w-36 rounded-md border bg-popover p-1 shadow-md z-50">
                  {localeList.map((loc) => (
                    <button key={loc} onClick={() => switchLocale(loc)} className={`w-full rounded-sm px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent ${loc === locale ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                      {localeLabels[loc]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <ThemeToggle />
            <Link href="/auth/login"><Button variant="ghost" size="sm">{t('login')}</Button></Link>
            <Link href="/auth/register"><Button size="sm">{t('register')}</Button></Link>
          </div>
        </div>
      )}
    </header>
  )
}
