'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Link, useRouter } from '@/i18n/navigation'
import { useLocale, useTranslations, Messages } from 'next-intl'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTimezone } from '@/providers/TimezoneProvider'

const statusVariantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending_payment: 'outline',
  paid: 'default',
  dispatched: 'secondary',
  accepted: 'secondary',
  in_progress: 'secondary',
  completed: 'default',
  cancelled: 'destructive',
}

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  currency: string
  region: string
  serviceTier: string
  createdAt: string
  product?: { id: string; name: string } | string
}

export default function OrderDetailPage() {
  const t = useTranslations('orders')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const { formatDate } = useTimezone()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  // Auth guard: redirect unauthenticated users to login
  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.user) {
          router.replace(`/auth/login?redirect=/orders/${orderId}` as any)
        } else {
          setAuthChecked(true)
        }
      })
      .catch(() => {
        router.replace(`/auth/login?redirect=/orders/${orderId}` as any)
      })
  }, [router, orderId])

  useEffect(() => {
    if (!authChecked) return
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}?depth=1&locale=${locale}`, {
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Failed to fetch order')
        setOrder(await res.json())
      } catch {
        setError(tCommon('error'))
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [authChecked, orderId, locale, tCommon])

  async function handlePay() {
    if (!order) return
    setPaying(true)
    setError('')
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId: order.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error || 'Payment failed')
      }
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err: any) {
      setError(err.message || tCommon('error'))
      setPaying(false)
    }
  }

  if (!authChecked || loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-center text-muted-foreground">{tCommon('loading')}</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-center text-destructive">{error || tCommon('error')}</p>
      </div>
    )
  }

  const statusKey = `status${order.status.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')}` as string
  const productName = typeof order.product === 'object' && order.product ? order.product.name : '-'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/orders"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        {t('backToOrders')}
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('orderDetail')}</CardTitle>
            <Badge variant={statusVariantMap[order.status] ?? 'outline'}>{t(statusKey)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label={t('orderNumber')} value={order.orderNumber} />
          <Row label={t('service')} value={productName} />
          <Row label={t('serviceTier')} value={order.serviceTier ? t(order.serviceTier as any) : '-'} />
          <Row label={t('region')} value={order.region ? t(`region${order.region.charAt(0).toUpperCase() + order.region.slice(1)}` as any) : '-'} />
          <Row label={t('total')} value={`${order.currency} ${order.totalAmount.toFixed(2)}`} />
          <Row label={t('createdAt')} value={formatDate(order.createdAt)} />

          {error && <p className="text-sm text-destructive">{error}</p>}

          {order.status === 'pending_payment' && (
            <Button className="w-full" onClick={handlePay} disabled={paying}>
              {paying ? t('paying') : t('pay')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
