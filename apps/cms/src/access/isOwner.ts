import type { Access } from 'payload'

export const isOwner = (userField = 'user'): Access => ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return { [userField]: { equals: user.id } }
}
