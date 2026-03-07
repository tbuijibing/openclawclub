import type { CollectionAfterChangeHook } from 'payload'

export const createInstallOrder: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  if (operation === 'update' && doc.status === 'paid' && previousDoc?.status !== 'paid') {
    await req.payload.create({
      collection: 'install-orders',
      data: {
        order: doc.id,
        serviceTier: doc.serviceTier || 'standard',
        ocsasLevel: 1,
        installStatus: 'pending_dispatch',
      },
      overrideAccess: true,
    })
  }
}
