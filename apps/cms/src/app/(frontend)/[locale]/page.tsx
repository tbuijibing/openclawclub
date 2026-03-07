import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Shield, Globe, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface HardwareProduct {
  id: string
  name: string
  description: string
  price: number
  category: string
  isActive: boolean
}

async function getFeaturedProducts(locale: string): Promise<HardwareProduct[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const res = await fetch(
      `${baseUrl}/api/hardware-products?where[isActive][equals]=true&limit=4&locale=${locale}`,
      { next: { revalidate: 60 } },
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.docs ?? []
  } catch {
    return []
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('home')
  const products = await getFeaturedProducts(locale)

  const features = [
    { icon: Shield, title: t('feature1Title'), desc: t('feature1Desc') },
    { icon: Globe, title: t('feature2Title'), desc: t('feature2Desc') },
    { icon: CreditCard, title: t('feature3Title'), desc: t('feature3Desc') },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center gap-4 px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('heroTitle')}</h1>
        <p className="text-xl text-muted-foreground">{t('heroSubtitle')}</p>
        <p className="max-w-2xl text-muted-foreground">{t('heroDescription')}</p>
        <div className="mt-4 flex gap-3">
          <Link href={`/${locale}/auth/register`}>
            <Button size="lg">{t('getStarted')}</Button>
          </Link>
          <Link href={`/${locale}/products`}>
            <Button variant="outline" size="lg">{t('browseProducts')}</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold">{t('features')}</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="mt-4">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('featuredProducts')}</h2>
            <p className="text-sm text-muted-foreground">{t('featuredDescription')}</p>
          </div>
          <Link href={`/${locale}/products`}>
            <Button variant="ghost">{t('viewAll')} →</Button>
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="text-center text-muted-foreground">{t('noProducts')}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <Link key={product.id} href={`/${locale}/products/${product.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit">{product.category}</Badge>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {product.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <span className="text-lg font-semibold">${product.price}</span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
