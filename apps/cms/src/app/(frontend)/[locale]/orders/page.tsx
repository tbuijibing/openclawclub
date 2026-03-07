'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OrderCard } from '@/components/OrderCard'

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  currency: string
  createdAt: string
}

export default function OrdersPage() {
  const t = useTranslations('orders')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders?sort=-createdAt&depth=0', {
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Failed to fetch orders')
        const data = await res.json()
        setOrders(data.docs ?? [])
      } catch {
        setError(tCommon('error'))
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [tCommon])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-center text-muted-foreground">{tCommon('loading')}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Link href={`/${locale}/orders/new`}>
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            {t('newOrder')}
          </Button>
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {orders.length === 0 ? (
        <p className="text-center text-muted-foreground">{t('noOrders')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              id={order.id}
              orderNumber={order.orderNumber}
              status={order.status}
              totalAmount={order.totalAmount}
              currency={order.currency}
              createdAt={order.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  )
}
