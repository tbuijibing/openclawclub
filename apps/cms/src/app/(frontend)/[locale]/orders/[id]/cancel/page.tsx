'use client'

import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { XCircle } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function PaymentCancelPage() {
  const t = useTranslations('orders')
  const { locale, id } = useParams<{ locale: string; id: string }>()

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">{t('paymentCancel')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('paymentCancelMessage')}</p>
        </CardContent>
        <CardFooter className="flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href={`/orders/${id}`}>{t('retryPayment')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/orders">{t('backToOrders')}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
