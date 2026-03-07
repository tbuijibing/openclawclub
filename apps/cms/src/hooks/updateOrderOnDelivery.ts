import type { CollectionAfterChangeHook } from 'payload'

export const updateOrderOnDelivery: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  if (operation === 'create') {
    await req.payload.update({
      collection: 'install-orders',
      id: doc.installOrder as string,
      data: { installStatus: 'pending_acceptance' },
      overrideAccess: true,
    })
  }
}
