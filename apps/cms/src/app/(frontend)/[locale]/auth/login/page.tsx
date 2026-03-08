'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Link, useRouter } from '@/i18n/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

function useLoginSchema() {
  const t = useTranslations('auth')
  return z.object({
    email: z.string().min(1, t('emailRequired')).email(t('emailInvalid')),
    password: z.string().min(1, t('passwordRequired')),
  })
}

type LoginFormValues = z.infer<ReturnType<typeof useLoginSchema>>

export default function LoginPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [error, setError] = useState('')

  const schema = useLoginSchema()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: LoginFormValues) {
    setError('')
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      })

      if (!res.ok) {
        throw new Error(t('loginError'))
      }

      const result = await res.json()
      const user = result?.user

      // 根据角色跳转到不同页面
      let targetPath = '/'
      if (user?.role === 'admin') {
        targetPath = '/admin'
      } else if (user?.role === 'certified_engineer') {
        targetPath = '/engineer/orders'
      } else {
        targetPath = '/orders'
      }

      // 使用 window.location.href 确保完整页面刷新和 cookie 生效
      const locale = window.location.pathname.split('/')[1] || 'zh'
      if (targetPath === '/admin') {
        window.location.href = targetPath
      } else {
        window.location.href = `/${locale}${targetPath}`
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginError'))
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t('loginTitle')}</CardTitle>
          <CardDescription>
            {t('noAccount')}{' '}
            <Link href="/auth/register" className="text-primary underline-offset-4 hover:underline">
              {t('registerButton')}
            </Link>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t('email')}
              </label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {t('password')}
              </label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('loginButton') + '...' : t('loginButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
