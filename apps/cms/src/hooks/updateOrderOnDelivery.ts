import type { CollectionAfterChangeHook } from 'payload'

export const updateOrderOnDelivery: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  if (operation === 'create') {
    const installOrderId = typeof doc.installOrder === 'object' ? doc.installOrder.id : doc.installOrder
    await req.payload.update({
      collection: 'install-orders',
      id: installOrderId,
      data: { installStatus: 'pending_acceptance' },
      overrideAccess: true,
    })
  }
}
