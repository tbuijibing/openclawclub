import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const DataDictionary: CollectionConfig = {
  slug: 'data-dictionary',
  labels: {
    singular: { zh: '数据字典', en: 'Data Dictionary', ja: 'データ辞書', ko: '데이터 사전', de: 'Datenwörterbuch', fr: 'Dictionnaire de données', es: 'Diccionario de datos' },
    plural: { zh: '数据字典', en: 'Data Dictionary', ja: 'データ辞書', ko: '데이터 사전', de: 'Datenwörterbuch', fr: 'Dictionnaire de données', es: 'Diccionario de datos' },
  },
  admin: {
    useAsTitle: 'tableName',
    group: { zh: '字典管理', en: 'Dictionary Management', ja: '辞書管理', ko: '사전 관리', de: 'Wörterbuchverwaltung', fr: 'Gestion des dictionnaires', es: 'Gestión de diccionarios' },
    defaultColumns: ['tableName', 'fieldName', 'fieldType', 'isRequired'],
    listSearchableFields: ['tableName', 'fieldName'],
  },
  access: {
    create: isAdmin,
    read: () => true,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'tableName',
      type: 'select',
      required: true,
      options: [
        { label: '用户 (users)', value: 'users' },
        { label: '订单 (orders)', value: 'orders' },
        { label: '支付 (payments)', value: 'payments' },
        { label: '安装工单 (install-orders)', value: 'install-orders' },
        { label: '交付报告 (delivery-reports)', value: 'delivery-reports' },
        { label: '服务评价 (service-reviews)', value: 'service-reviews' },
        { label: '硬件产品 (hardware-products)', value: 'hardware-products' },
        { label: '业务字典 (business-dictionary)', value: 'business-dictionary' },
        { label: '审计日志 (audit-logs)', value: 'audit-logs' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'fieldName',
      type: 'text',
      required: true,
      admin: { description: '字段名称' },
    },
    {
      name: 'fieldLabel',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: '字段显示名（支持多语言）' },
    },
    {
      name: 'fieldType',
      type: 'select',
      required: true,
      options: [
        { label: '文本', value: 'text' },
        { label: '数字', value: 'number' },
        { label: '日期', value: 'date' },
        { label: '布尔', value: 'boolean' },
        { label: '枚举', value: 'enum' },
        { label: '关联', value: 'relationship' },
        { label: 'JSON', value: 'json' },
        { label: '富文本', value: 'richtext' },
        { label: '文件', value: 'upload' },
      ],
    },
    {
      name: 'fieldDescription',
      type: 'textarea',
      localized: true,
      admin: { description: '字段说明（支持多语言）' },
    },
    {
      name: 'isRequired',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'isLocalized',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: '是否支持多语言' },
    },
    {
      name: 'enumOptions',
      type: 'array',
      admin: {
        condition: (_, siblingData) => siblingData?.fieldType === 'enum',
        description: '枚举选项（当字段类型为枚举时）',
      },
      fields: [
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', required: true, localized: true },
      ],
    },
    {
      name: 'defaultValue',
      type: 'text',
      admin: { description: '默认值' },
    },
    {
      name: 'validation',
      type: 'json',
      admin: { description: '验证规则（如 min, max, pattern 等）' },
    },
  ],
}
