import createMiddleware from 'next-intl/middleware'
import { defineRouting } from 'next-intl/routing'
import { NextRequest } from 'next/server'

const routing = defineRouting({
  locales: ['zh', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'ur', 'vi', 'ms'],
  defaultLocale: 'zh',
  localePrefix: 'always',
})

const intlMiddleware = createMiddleware(routing)

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip next-intl middleware for Payload admin, API, media, and Next.js internals
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/media') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/apple-touch-icon')
  ) {
    return
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.png).*)'],
}
