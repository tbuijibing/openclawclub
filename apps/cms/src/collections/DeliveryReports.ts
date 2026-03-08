import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'
import { updateOrderOnDelivery } from '../hooks/updateOrderOnDelivery'

export const DeliveryReports: CollectionConfig = {
  slug: 'delivery-reports',
  labels: {
    singular: { zh: '交付报告', en: 'Delivery Report', ja: '納品報告', ko: '납품 보고서', de: 'Lieferbericht', fr: 'Rapport de livraison', es: 'Informe de entrega' },
    plural: { zh: '交付报告', en: 'Delivery Reports', ja: '納品報告', ko: '납품 보고서', de: 'Lieferberichte', fr: 'Rapports de livraison', es: 'Informes de entrega' },
  },
  admin: { group: { zh: '订单管理', en: 'Order Management', ja: '注文管理', ko: '주문 관리', de: 'Auftragsverwaltung', fr: 'Gestion des commandes', es: 'Gestión de pedidos' } },
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
    },
    { name: 'checklist', type: 'json', required: true },
    { name: 'configItems', type: 'json', required: true },
    { name: 'testResults', type: 'json', required: true },
    {
      name: 'screenshots',
      type: 'array',
      fields: [{ name: 'image', type: 'upload', relationTo: 'media' }],
    },
  ],
}
