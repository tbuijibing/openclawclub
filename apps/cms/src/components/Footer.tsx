'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function Footer() {
  const t = useTranslations('footer')
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t('copyright', { year: String(year) })}
        </p>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link href="#" className="hover:text-foreground transition-colors">
            {t('privacy')}
          </Link>
          <Link href="#" className="hover:text-foreground transition-colors">
            {t('terms')}
          </Link>
          <Link href="#" className="hover:text-foreground transition-colors">
            {t('contact')}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
