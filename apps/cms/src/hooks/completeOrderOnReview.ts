import type { CollectionAfterChangeHook } from 'payload'

export const completeOrderOnReview: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  if (operation === 'create') {
    await req.payload.update({
      collection: 'orders',
      id: doc.order as string,
      data: { status: 'completed' },
      overrideAccess: true,
    })
  }
}
