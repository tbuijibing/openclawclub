import { Link } from '@/i18n/navigation'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface HardwareProduct {
  id: string | number
  name: string
  description: string
  price: number
  category: string
  specs: Record<string, unknown> | null
  isActive: boolean
}

async function getProduct(id: string, locale: string): Promise<HardwareProduct | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const url = `${baseUrl}/api/hardware-products/${id}?locale=${locale}`

  try {
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const t = await getTranslations('products')
  const product = await getProduct(id, locale)

  if (!product) {
    notFound()
  }

  const categoryLabels: Record<string, string> = {
    clawbox_lite: t('categories.clawbox_lite'),
    clawbox_pro: t('categories.clawbox_pro'),
    clawbox_enterprise: t('categories.clawbox_enterprise'),
    recommended_hardware: t('categories.recommended_hardware'),
    accessories: t('categories.accessories'),
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/products"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← {t('backToProducts')}
      </Link>

      <div className="mt-4 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <Badge variant="secondary" className="mt-2">
              {categoryLabels[product.category] || product.category}
            </Badge>
          </div>
          <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
        </div>

        <p className="text-muted-foreground">{product.description}</p>

        {product.specs && Object.keys(product.specs).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('specifications')}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-2 sm:grid-cols-2">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between rounded-md bg-muted/50 px-3 py-2">
                    <dt className="text-sm font-medium">{key}</dt>
                    <dd className="text-sm text-muted-foreground">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Link href={`/orders/new?product=${product.id}`}>
            <Button size="lg">{t('addToOrder')}</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
