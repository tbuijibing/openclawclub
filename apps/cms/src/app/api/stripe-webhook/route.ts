import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPayload } from 'payload'
import config from '@payload-config'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event | undefined
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const payload = await getPayload({ config })

    try {
      const payments = await payload.find({
        collection: 'payments',
        where: { stripeSessionId: { equals: session.id } },
        limit: 1,
      })

      if (payments.docs.length > 0) {
        const payment = payments.docs[0]
        await payload.update({
          collection: 'payments',
          id: payment.id,
          data: {
            status: 'succeeded',
            stripePaymentIntentId: session.payment_intent as string,
          },
          overrideAccess: true,
        })
        const orderId = typeof payment.order === 'number' ? payment.order : payment.order.id
        await payload.update({
          collection: 'orders',
          id: orderId,
          data: { status: 'paid' },
          overrideAccess: true,
        })
      }
    } catch (err) {
      console.error('Stripe webhook processing error:', err)
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
