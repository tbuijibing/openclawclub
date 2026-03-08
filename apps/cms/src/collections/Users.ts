import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'
import { isAdminOrSelf } from '../access/isAdminOrSelf'
import { writeAuditLog } from '../hooks/writeAuditLog'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: { zh: '用户', en: 'User', ja: 'ユーザー', ko: '사용자', de: 'Benutzer', fr: 'Utilisateur', es: 'Usuario' },
    plural: { zh: '用户', en: 'Users', ja: 'ユーザー', ko: '사용자', de: 'Benutzer', fr: 'Utilisateurs', es: 'Usuarios' },
  },
  auth: {
    tokenExpiration: 86400,
  },
  admin: {
    useAsTitle: 'displayName',
    group: { zh: '用户管理', en: 'User Management', ja: 'ユーザー管理', ko: '사용자 관리', de: 'Benutzerverwaltung', fr: 'Gestion des utilisateurs', es: 'Gestión de usuarios' },
    listSearchableFields: ['email', 'displayName'],
    defaultColumns: ['displayName', 'email', 'role', 'region'],
  },
  access: {
    create: () => true,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [writeAuditLog('users')],
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      maxLength: 100,
    },
    {
      name: 'avatarUrl',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'languagePreference',
      type: 'select',
      defaultValue: 'zh',
      options: ['zh', 'en', 'ja', 'ko', 'de', 'fr', 'es'],
    },
    {
      name: 'timezone',
      type: 'text',
      defaultValue: 'UTC',
    },
    {
      name: 'region',
      type: 'select',
      options: [
        { label: '亚太', value: 'apac' },
        { label: '北美', value: 'na' },
        { label: '欧洲', value: 'eu' },
      ],
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'individual_user',
      access: { update: ({ req: { user } }) => user?.role === 'admin' },
      options: [
        { label: '管理员', value: 'admin' },
        { label: '认证工程师', value: 'certified_engineer' },
        { label: '个人用户', value: 'individual_user' },
      ],
    },
  ],
}
