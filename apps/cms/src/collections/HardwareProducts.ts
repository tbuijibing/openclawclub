import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const HardwareProducts: CollectionConfig = {
  slug: 'hardware-products',
  admin: {
    useAsTitle: 'name',
    group: '产品管理',
  },
  access: {
    create: isAdmin,
    read: () => true,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        'clawbox_lite',
        'clawbox_pro',
        'clawbox_enterprise',
        'recommended_hardware',
        'accessories',
      ],
    },
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'description', type: 'textarea', required: true, localized: true },
    { name: 'specs', type: 'json', required: true, localized: true },
    { name: 'price', type: 'number', required: true, min: 0 },
    { name: 'stockByRegion', type: 'json', dbName: 'stock_by_region' },
    { name: 'isActive', type: 'checkbox', defaultValue: true, dbName: 'is_active' },
  ],
}
