import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'
import { updateOrderOnDelivery } from '../hooks/updateOrderOnDelivery'

export const DeliveryReports: CollectionConfig = {
  slug: 'delivery-reports',
  admin: { group: '订单管理' },
  access: {
    create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'certified_engineer',
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { 'installOrder.engineer': { equals: user.id } }
    },
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [updateOrderOnDelivery],
  },
  fields: [
    {
      name: 'installOrder',
      type: 'relationship',
      relationTo: 'install-orders',
      required: true,
      dbName: 'install_order_id',
    },
    { name: 'checklist', type: 'json', required: true },
    { name: 'configItems', type: 'json', required: true, dbName: 'config_items' },
    { name: 'testResults', type: 'json', required: true, dbName: 'test_results' },
    {
      name: 'screenshots',
      type: 'array',
      fields: [{ name: 'image', type: 'upload', relationTo: 'media' }],
    },
  ],
}
