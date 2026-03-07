'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Product {
  id: string
  name: string
  price: number
  category: string
}

interface PricingConfig {
  installationPricing: {
    standard: number
    professional: number
    enterprise: number
  }
}

const serviceTiers = ['standard', 'professional', 'enterprise'] as const
const regions = ['apac', 'na', 'eu'] as const

function useNewOrderSchema() {
  const t = useTranslations('orders')
  return z.object({
    product: z.string().min(1, t('productRequired')),
    serviceTier: z.enum(serviceTiers, { message: t('serviceTierRequired') }),
    region: z.enum(regions, { message: t('regionRequired') }),
  })
}

type NewOrderValues = z.infer<ReturnType<typeof useNewOrderSchema>>

export default function NewOrderPage() {
  const t = useTranslations('orders')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [pricing, setPricing] = useState<PricingConfig | null>(null)
  const [error, setError] = useState('')

  const schema = useNewOrderSchema()

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewOrderValues>({
    resolver: zodResolver(schema),
    defaultValues: { product: '', serviceTier: undefined, region: undefined },
  })

  const selectedProduct = watch('product')
  const selectedTier = watch('serviceTier')

  useEffect(() => {
    async function load() {
      const [prodRes, pricingRes] = await Promise.all([
        fetch(`/api/hardware-products?where[isActive][equals]=true&locale=${locale}&depth=0`),
        fetch('/api/globals/pricing-config'),
      ])
      if (prodRes.ok) {
        const data = await prodRes.json()
        setProducts(data.docs ?? [])
      }
      if (pricingRes.ok) {
        setPricing(await pricingRes.json())
      }
    }
    load()
  }, [locale])

  const productPrice = products.find((p) => p.id === selectedProduct)?.price ?? 0
  const tierPrice = pricing?.installationPricing?.[selectedTier as keyof PricingConfig['installationPricing']] ?? 0
  const totalAmount = productPrice + tierPrice

  async function onSubmit(values: NewOrderValues) {
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          product: values.product,
          serviceTier: values.serviceTier,
          region: values.region,
          totalAmount,
          currency: 'USD',
          status: 'pending_payment',
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.errors?.[0]?.message || 'Failed to create order')
      }
      const order = await res.json()
      router.push(`/${locale}/orders/${order.doc.id}`)
    } catch (err: any) {
      setError(err.message || tCommon('error'))
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('newOrder')}</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{t('newOrder')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('product')}</label>
              <Select onValueChange={(v) => setValue('product', v, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectProduct')} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — ${p.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.product && <p className="text-sm text-destructive">{errors.product.message}</p>}
            </div>

            {/* Service tier select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('serviceTier')}</label>
              <Select onValueChange={(v) => setValue('serviceTier', v as any, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectServiceTier')} />
                </SelectTrigger>
                <SelectContent>
                  {serviceTiers.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {t(tier)} {pricing ? `— $${pricing.installationPricing[tier]}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.serviceTier && <p className="text-sm text-destructive">{errors.serviceTier.message}</p>}
            </div>

            {/* Region select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('region')}</label>
              <Select onValueChange={(v) => setValue('region', v as any, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectRegion')} />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`region${r.charAt(0).toUpperCase() + r.slice(1)}` as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.region && <p className="text-sm text-destructive">{errors.region.message}</p>}
            </div>

            {/* Total */}
            {(selectedProduct || selectedTier) && (
              <div className="rounded-md border p-3 text-sm">
                <div className="flex justify-between">
                  <span>{t('total')}</span>
                  <span className="font-semibold">USD {totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('creating') : t('createOrder')}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
