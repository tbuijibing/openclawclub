import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // 临时返回成功，实际处理需要配置 Stripe
  return NextResponse.json({ received: true })
}
