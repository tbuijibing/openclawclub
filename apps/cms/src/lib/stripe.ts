import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function createCheckoutSession(params: {
  orderId: string
  amount: number
  currency: string
  successUrl: string
  cancelUrl: string
}) {
  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: params.currency.toLowerCase(),
        product_data: { name: `Order ${params.orderId}` },
        unit_amount: Math.round(params.amount * 100),
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { orderId: params.orderId },
  })
}
