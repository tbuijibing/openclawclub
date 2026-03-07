import type { CollectionAfterChangeHook } from 'payload'

export const writeAuditLog = (resourceType: string): CollectionAfterChangeHook => async ({
  doc, previousDoc, req, operation,
}) => {
  const action = operation === 'create' ? 'create' : 'update'
  let details: Record<string, unknown> = {}

  if (operation === 'update' && previousDoc) {
    if (resourceType === 'users' && previousDoc.role !== doc.role) {
      details = { field: 'role', from: previousDoc.role, to: doc.role }
    }
    if (resourceType === 'install-orders' && previousDoc.installStatus !== doc.installStatus) {
      details = { field: 'installStatus', from: previousDoc.installStatus, to: doc.installStatus }
    }
  }

  await req.payload.create({
    collection: 'audit-logs',
    data: {
      user: req.user?.id || null,
      action: `${resourceType}.${action}`,
      resourceType,
      resourceId: String(doc.id),
      details,
      ipAddress: req.headers?.get?.('x-forwarded-for') || null,
    },
    overrideAccess: true,
  })
}
