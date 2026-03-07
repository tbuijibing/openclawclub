import type { CollectionBeforeChangeHook } from 'payload'

export const generateOrderNumber: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation === 'create') {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 7).toUpperCase()
    data.orderNumber = `OC-${dateStr}-${random}`
  }
  return data
}
