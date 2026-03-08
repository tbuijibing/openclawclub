'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const TimezoneContext = createContext<{
  timezone: string
  setTimezone: (tz: string) => void
  formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string
}>({
  timezone: 'Asia/Shanghai',
  setTimezone: () => {},
  formatDate: () => '',
})

export function TimezoneProvider({ children, locale }: { children: ReactNode; locale: string }) {
  const [timezone, setTimezoneState] = useState('Asia/Shanghai')

  useEffect(() => {
    const saved = localStorage.getItem('timezone')
    if (saved) setTimezoneState(saved)
    else setTimezoneState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  const setTimezone = (tz: string) => {
    setTimezoneState(tz)
    localStorage.setItem('timezone', tz)
  }

  const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString(locale, {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    })
  }

  return (
    <TimezoneContext.Provider value={{ timezone, setTimezone, formatDate }}>
      {children}
    </TimezoneContext.Provider>
  )
}

export const useTimezone = () => useContext(TimezoneContext)
