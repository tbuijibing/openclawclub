'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'
import { Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function useReviewSchema() {
  const t = useTranslations('review')
  return z.object({
    overallRating: z.coerce
      .number()
      .int()
      .min(1, t('ratingRequired'))
      .max(5, t('ratingRequired')),
    attitudeRating: z.coerce
      .number()
      .int()
      .min(1, t('ratingRequired'))
      .max(5, t('ratingRequired')),
    skillRating: z.coerce
      .number()
      .int()
      .min(1, t('ratingRequired'))
      .max(5, t('ratingRequired')),
    comment: z.string().optional(),
  })
}

type ReviewFormValues = z.infer<ReturnType<typeof useReviewSchema>>

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (val: number) => void
  label: string
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star}`}
            onClick={() => onChange(star)}
            className="rounded p-1 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Star
              className={`h-6 w-6 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ReviewPage() {
  const t = useTranslations('review')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const orderId = params.id as string
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const schema = useReviewSchema()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      overallRating: 0,
      attitudeRating: 0,
      skillRating: 0,
      comment: '',
    },
  })

  const overallRating = watch('overallRating')
  const attitudeRating = watch('attitudeRating')
  const skillRating = watch('skillRating')

  async function onSubmit(data: ReviewFormValues) {
    setError('')
    try {
      // Get current user
      const meRes = await fetch('/api/users/me', { credentials: 'include' })
      if (!meRes.ok) {
        router.push(`/${locale}/auth/login`)
        return
      }
      const meData = await meRes.json()
      const userId = meData.user?.id
      if (!userId) {
        router.push(`/${locale}/auth/login`)
        return
      }

      const res = await fetch('/api/service-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          order: orderId,
          user: userId,
          overallRating: data.overallRating,
          attitudeRating: data.attitudeRating,
          skillRating: data.skillRating,
          comment: data.comment || '',
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.errors?.[0]?.message || t('submitError'))
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/${locale}/orders/${orderId}`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('submitError'))
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <Star className="h-8 w-8 fill-green-600 text-green-600 dark:fill-green-400 dark:text-green-400" />
            </div>
            <p className="text-center text-lg font-medium">{t('submitSuccess')}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('orderLabel')}: {orderId}
          </p>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <div
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}

            <div>
              <StarRating
                value={overallRating}
                onChange={(val) => setValue('overallRating', val, { shouldValidate: true })}
                label={t('overallRating')}
              />
              <Input type="hidden" {...register('overallRating')} />
              {errors.overallRating && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.overallRating.message}
                </p>
              )}
            </div>

            <div>
              <StarRating
                value={attitudeRating}
                onChange={(val) => setValue('attitudeRating', val, { shouldValidate: true })}
                label={t('attitudeRating')}
              />
              <Input type="hidden" {...register('attitudeRating')} />
              {errors.attitudeRating && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.attitudeRating.message}
                </p>
              )}
            </div>

            <div>
              <StarRating
                value={skillRating}
                onChange={(val) => setValue('skillRating', val, { shouldValidate: true })}
                label={t('skillRating')}
              />
              <Input type="hidden" {...register('skillRating')} />
              {errors.skillRating && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.skillRating.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="comment" className="text-sm font-medium">
                {t('comment')}
              </label>
              <textarea
                id="comment"
                {...register('comment')}
                placeholder={t('commentPlaceholder')}
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? tCommon('loading') : t('submitReview')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
