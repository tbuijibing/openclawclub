'use client'

import { Link } from '@/i18n/navigation'
import { useLocale, useTranslations, Messages } from 'next-intl'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const statusVariantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending_payment: 'outline',
  paid: 'default',
  dispatched: 'secondary',
  accepted: 'secondary',
  in_progress: 'secondary',
  completed: 'default',
  cancelled: 'destructive',
}

interface OrderCardProps {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  currency: string
  createdAt: string
}

export function OrderCard({ id, orderNumber, status, totalAmount, currency, createdAt }: OrderCardProps) {
  const t = useTranslations('orders')
  const locale = useLocale()

  const statusKey = `status${status.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')}` as keyof Messages['orders'] & string
  const statusLabel = t(statusKey)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{orderNumber}</CardTitle>
          <Badge variant={statusVariantMap[status] ?? 'outline'}>{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t('total')}: {currency} {totalAmount.toFixed(2)}</span>
          <span>{new Date(createdAt).toLocaleDateString(locale)}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/orders/${id}`} className="w-full">
          <Button variant="outline" size="sm" className="w-full">{t('viewDetails')}</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
