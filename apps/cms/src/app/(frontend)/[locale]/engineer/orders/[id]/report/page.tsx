'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from '@/i18n/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const jsonValidator = (val: string) => {
  try {
    JSON.parse(val)
    return true
  } catch {
    return false
  }
}

function useReportSchema() {
  const t = useTranslations('engineer')
  return z.object({
    checklist: z.string().min(1, t('required')).refine(jsonValidator, t('invalidJson')),
    configItems: z.string().min(1, t('required')).refine(jsonValidator, t('invalidJson')),
    testResults: z.string().min(1, t('required')).refine(jsonValidator, t('invalidJson')),
    screenshots: z.array(z.object({ file: z.instanceof(File).optional() })),
  })
}

type ReportFormValues = z.infer<ReturnType<typeof useReportSchema>>

export default function DeliveryReportPage() {
  const t = useTranslations('engineer')
  const tCommon = useTranslations('common')
  const params = useParams()
  const locale = params.locale as string
  const installOrderId = params.id as string

  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const schema = useReportSchema()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      checklist: '',
      configItems: '',
      testResults: '',
      screenshots: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'screenshots',
  })

  const onSubmit = async (data: ReportFormValues) => {
    try {
      setSubmitError('')

      // Upload screenshots first
      const uploadedMediaIds: string[] = []
      for (const screenshot of data.screenshots) {
        if (screenshot.file) {
          const formData = new FormData()
          formData.append('file', screenshot.file)
          formData.append('alt', `report-screenshot-${installOrderId}`)
          const uploadRes = await fetch('/api/media', {
            method: 'POST',
            credentials: 'include',
            body: formData,
          })
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            uploadedMediaIds.push(uploadData.doc?.id ?? uploadData.id)
          }
        }
      }

      // Submit delivery report
      const res = await fetch('/api/delivery-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          installOrder: installOrderId,
          checklist: JSON.parse(data.checklist),
          configItems: JSON.parse(data.configItems),
          testResults: JSON.parse(data.testResults),
          screenshots: uploadedMediaIds.map((id) => ({ image: id })),
        }),
      })

      if (!res.ok) throw new Error()
      setSubmitSuccess(true)
    } catch {
      setSubmitError(t('submitError'))
    }
  }

  if (submitSuccess) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <Card>
          <CardContent className="py-10">
            <p className="mb-4 text-lg font-semibold text-green-600">{t('submitSuccess')}</p>
            <Link href="/engineer/orders">
              <Button variant="outline">{t('backToOrders')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/engineer/orders"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {t('backToOrders')}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reportTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {submitError && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Checklist */}
            <div className="space-y-2">
              <label htmlFor="checklist" className="text-sm font-medium">
                {t('checklist')}
              </label>
              <textarea
                id="checklist"
                {...register('checklist')}
                placeholder={t('checklistPlaceholder')}
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              {errors.checklist && (
                <p className="text-sm text-destructive">{errors.checklist.message}</p>
              )}
            </div>

            {/* Config Items */}
            <div className="space-y-2">
              <label htmlFor="configItems" className="text-sm font-medium">
                {t('configItems')}
              </label>
              <textarea
                id="configItems"
                {...register('configItems')}
                placeholder={t('configItemsPlaceholder')}
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              {errors.configItems && (
                <p className="text-sm text-destructive">{errors.configItems.message}</p>
              )}
            </div>

            {/* Test Results */}
            <div className="space-y-2">
              <label htmlFor="testResults" className="text-sm font-medium">
                {t('testResults')}
              </label>
              <textarea
                id="testResults"
                {...register('testResults')}
                placeholder={t('testResultsPlaceholder')}
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              {errors.testResults && (
                <p className="text-sm text-destructive">{errors.testResults.message}</p>
              )}
            </div>

            {/* Screenshots */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('screenshots')}</label>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const event = { target: { name: `screenshots.${index}.file`, value: file } }
                          register(`screenshots.${index}.file`).onChange(event as never)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      {t('removeScreenshot')}
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ file: undefined })}
              >
                {t('addScreenshot')}
              </Button>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? tCommon('loading') : t('submitReport')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
