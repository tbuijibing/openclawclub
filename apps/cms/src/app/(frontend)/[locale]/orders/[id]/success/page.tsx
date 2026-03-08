'use client'

import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function PaymentSuccessPage() {
  const t = useTranslations('orders')
  const { locale, id } = useParams<{ locale: string; id: string }>()

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">{t('paymentSuccess')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('paymentSuccessMessage')}</p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href={`/orders/${id}`}>{t('viewOrder')}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
