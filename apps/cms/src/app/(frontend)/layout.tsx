import React from 'react'
import './globals.css'

export const metadata = {
  description: 'OpenClaw Club - Global Hardware Installation Platform',
  title: 'OpenClaw Club',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html suppressHydrationWarning>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
