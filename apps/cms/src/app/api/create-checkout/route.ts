import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createCheckoutSession } from '../../../lib/stripe'

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config: configPromise })

  // Validate authentication via Payload headers
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderId } = await req.json()
  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  // Fetch the order
  let order: any
  try {
    order = await payload.findByID({ collection: 'orders' as any, id: orderId, overrideAccess: true })
  } catch {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Validate the order belongs to the authenticated user
  const orderUserId = typeof order.user === 'object' ? order.user.id : order.user
  if ((user as any).role !== 'admin' && String(orderUserId) !== String(user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Create Stripe Checkout Session
  const baseUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const session = await createCheckoutSession({
    orderId: String(order.id),
    amount: order.totalAmount,
    currency: order.currency || 'USD',
    successUrl: `${baseUrl}/zh/orders/${order.id}/success`,
    cancelUrl: `${baseUrl}/zh/orders/${order.id}/cancel`,
  })

  // Create payment record with status: pending
  await payload.create({
    collection: 'payments' as any,
    data: {
      order: order.id,
      amount: order.totalAmount,
      currency: order.currency || 'USD',
      status: 'pending',
      stripeSessionId: session.id,
    },
    overrideAccess: true,
  })

  return NextResponse.json({ url: session.url })
}
