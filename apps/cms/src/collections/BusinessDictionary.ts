import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const BusinessDictionary: CollectionConfig = {
  slug: 'business-dictionary',
  labels: {
    singular: { zh: '业务字典', en: 'Business Dictionary', ja: 'ビジネス辞書', ko: '비즈니스 사전', de: 'Geschäftswörterbuch', fr: 'Dictionnaire métier', es: 'Diccionario de negocio' },
    plural: { zh: '业务字典', en: 'Business Dictionary', ja: 'ビジネス辞書', ko: '비즈니스 사전', de: 'Geschäftswörterbuch', fr: 'Dictionnaire métier', es: 'Diccionario de negocio' },
  },
  admin: {
    useAsTitle: 'key',
    group: { zh: '字典管理', en: 'Dictionary Management', ja: '辞書管理', ko: '사전 관리', de: 'Wörterbuchverwaltung', fr: 'Gestion des dictionnaires', es: 'Gestión de diccionarios' },
    defaultColumns: ['key', 'category', 'label', 'isActive', 'sortOrder'],
    listSearchableFields: ['key', 'label'],
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
        { label: '订单状态', value: 'order_status' },
        { label: '安装状态', value: 'install_status' },
        { label: '服务等级', value: 'service_tier' },
        { label: '用户角色', value: 'user_role' },
        { label: '区域', value: 'region' },
        { label: '产品类别', value: 'product_category' },
        { label: '支付状态', value: 'payment_status' },
        { label: 'OCSAS等级', value: 'ocsas_level' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: '唯一标识符，如 order_status.pending_payment' },
    },
    {
      name: 'label',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: '显示名称（支持多语言）' },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: { description: '详细描述（支持多语言）' },
    },
    {
      name: 'value',
      type: 'text',
      admin: { description: '对应的系统值' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: { description: '额外的元数据（如颜色、图标等）' },
    },
  ],
}
