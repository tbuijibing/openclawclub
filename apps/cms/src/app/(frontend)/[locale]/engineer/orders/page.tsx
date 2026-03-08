'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface InstallOrder {
  id: string
  order:
    | string
    | { id: string; orderNumber?: string; totalAmount?: number; currency?: string }
  serviceTier: string
  ocsasLevel: number
  installStatus: string
  engineer: string | { id: string } | null
  createdAt: string
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'pending_dispatch':
      return 'outline'
    case 'accepted':
    case 'in_progress':
      return 'default'
    case 'pending_acceptance':
      return 'secondary'
    case 'completed':
      return 'default'
    default:
      return 'outline'
  }
}

export default function EngineerOrdersPage() {
  const t = useTranslations('engineer')
  const tCommon = useTranslations('common')
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string

  const [pendingOrders, setPendingOrders] = useState<InstallOrder[]>([])
  const [activeOrders, setActiveOrders] = useState<InstallOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true)
        // Fetch pending orders (no engineer assigned yet)
        const pendingRes = await fetch(
          `/api/install-orders?where[installStatus][equals]=pending_dispatch&depth=1&limit=50`,
          { credentials: 'include' },
        )
        // Fetch active orders (assigned to current engineer, not completed)
        const activeRes = await fetch(
          `/api/install-orders?where[installStatus][not_equals]=pending_dispatch&where[installStatus][not_equals]=completed&depth=1&limit=50`,
          { credentials: 'include' },
        )

        if (pendingRes.ok) {
          const pendingData = await pendingRes.json()
          setPendingOrders(pendingData.docs ?? [])
        }
        if (activeRes.ok) {
          const activeData = await activeRes.json()
          setActiveOrders(activeData.docs ?? [])
        }
      } catch {
        setError(tCommon('error'))
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [tCommon])

  const handleAccept = async (orderId: string) => {
    try {
      const res = await fetch(`/api/install-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          installStatus: 'accepted',
          acceptedAt: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error()
      // Move from pending to active
      const updated = await res.json()
      setPendingOrders((prev) => prev.filter((o) => o.id !== orderId))
      setActiveOrders((prev) => [updated.doc ?? updated, ...prev])
    } catch {
      setError(t('acceptError'))
    }
  }

  const getOrderNumber = (order: InstallOrder['order']) =>
    typeof order === 'object' ? order.orderNumber ?? order.id : order

  const getOrderId = (order: InstallOrder['order']) =>
    typeof order === 'object' ? order.id : order

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{tCommon('loading')}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">{t('title')}</h1>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Pending Orders */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">{t('pendingOrders')}</h2>
        {pendingOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noOrders')}</p>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map((io) => (
              <Card key={io.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">
                    {t('orderNumber')}: {getOrderNumber(io.order)}
                  </CardTitle>
                  <Badge variant={statusVariant(io.installStatus)}>
                    {t(io.installStatus)}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>
                      {t('serviceTier')}: {t(io.serviceTier)}
                    </span>
                    <span>
                      {t('ocsasLevel')}: {io.ocsasLevel}
                    </span>
                    <span>
                      {t('createdAt')}: {new Date(io.createdAt).toLocaleDateString(locale)}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Button size="sm" onClick={() => handleAccept(io.id)}>
                      {t('accept')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Active Orders */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">{t('activeOrders')}</h2>
        {activeOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noOrders')}</p>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((io) => (
              <Card key={io.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">
                    {t('orderNumber')}: {getOrderNumber(io.order)}
                  </CardTitle>
                  <Badge variant={statusVariant(io.installStatus)}>
                    {t(io.installStatus)}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>
                      {t('serviceTier')}: {t(io.serviceTier)}
                    </span>
                    <span>
                      {t('ocsasLevel')}: {io.ocsasLevel}
                    </span>
                    <span>
                      {t('createdAt')}: {new Date(io.createdAt).toLocaleDateString(locale)}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/engineer/orders/${getOrderId(io.order)}/report`)
                      }
                    >
                      {t('submitReport')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
