import { getTranslations } from 'next-intl/server'
import { ProductCard } from '@/components/ProductCard'

interface HardwareProduct {
  id: string | number
  name: string
  description: string
  price: number
  category: string
  isActive: boolean
}

async function getProducts(locale: string): Promise<HardwareProduct[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const url = `${baseUrl}/api/hardware-products?where[isActive][equals]=true&locale=${locale}&limit=100`

  try {
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.docs || []
  } catch {
    return []
  }
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('products')
  const products = await getProducts(locale)

  const translations = {
    viewDetails: t('viewDetails'),
    price: t('price'),
    categories: {
      clawbox_lite: t('categories.clawbox_lite'),
      clawbox_pro: t('categories.clawbox_pro'),
      clawbox_enterprise: t('categories.clawbox_enterprise'),
      recommended_hardware: t('categories.recommended_hardware'),
      accessories: t('categories.accessories'),
    },
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{t('noProducts')}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              price={product.price}
              category={product.category}
              locale={locale}
              translations={translations}
            />
          ))}
        </div>
      )}
    </div>
  )
}
