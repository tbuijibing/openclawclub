import type { CollectionAfterChangeHook } from 'payload'

export const completeOrderOnReview: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  if (operation === 'create') {
    const orderId = typeof doc.order === 'object' ? doc.order.id : doc.order
    await req.payload.update({
      collection: 'orders',
      id: orderId,
      data: { status: 'completed' },
      overrideAccess: true,
    })
  }
}
