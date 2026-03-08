import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const HardwareProducts: CollectionConfig = {
  slug: 'hardware-products',
  labels: {
    singular: { zh: '硬件产品', en: 'Hardware Product', ja: 'ハードウェア製品', ko: '하드웨어 제품', de: 'Hardwareprodukt', fr: 'Produit matériel', es: 'Producto de hardware' },
    plural: { zh: '硬件产品', en: 'Hardware Products', ja: 'ハードウェア製品', ko: '하드웨어 제품', de: 'Hardwareprodukte', fr: 'Produits matériels', es: 'Productos de hardware' },
  },
  admin: {
    useAsTitle: 'name',
    group: { zh: '产品管理', en: 'Product Management', ja: '製品管理', ko: '제품 관리', de: 'Produktverwaltung', fr: 'Gestion des produits', es: 'Gestión de productos' },
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
    { name: 'stockByRegion', type: 'json' },
    { name: 'isActive', type: 'checkbox', defaultValue: true },
  ],
}
