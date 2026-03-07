/**
 * Property 1: 访问控制强制执行
 * Validates: Requirements 2.5, 4.5, 5.6, 6.5
 *
 * For any user role and operation, access control functions should correctly enforce:
 * - isAdmin returns true ONLY for admin role
 * - isAdminOrSelf returns true for admin, returns where-clause for non-admin
 * - isOwner returns true for admin, returns where-clause for non-admin
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { isAdmin } from '../isAdmin'
import { isAdminOrSelf } from '../isAdminOrSelf'
import { isOwner } from '../isOwner'

const roles = ['admin', 'certified_engineer', 'individual_user'] as const
type Role = (typeof roles)[number]

const roleArb = fc.constantFrom<Role>(...roles)
const userIdArb = fc.uuid()
const userFieldArb = fc.constantFrom('user', 'engineer', 'createdBy', 'assignedTo')

function makeAccessArgs(user: { id: string; role: Role } | null) {
  return { req: { user } } as Parameters<typeof isAdmin>[0]
}

describe('Property 1: 访问控制强制执行', () => {
  it('isAdmin returns true ONLY for admin role', () => {
    fc.assert(
      fc.property(roleArb, userIdArb, (role, id) => {
        const result = isAdmin(makeAccessArgs({ id, role }))
        if (role === 'admin') {
          expect(result).toBe(true)
        } else {
          expect(result).toBe(false)
        }
      }),
    )
  })

  it('isAdmin returns false for null user', () => {
    const result = isAdmin(makeAccessArgs(null))
    expect(result).toBe(false)
  })

  it('isAdminOrSelf returns true for admin, where-clause for non-admin', () => {
    fc.assert(
      fc.property(roleArb, userIdArb, (role, id) => {
        const result = isAdminOrSelf(makeAccessArgs({ id, role }))
        if (role === 'admin') {
          expect(result).toBe(true)
        } else {
          expect(result).toEqual({ id: { equals: id } })
        }
      }),
    )
  })

  it('isAdminOrSelf returns false for null user', () => {
    const result = isAdminOrSelf(makeAccessArgs(null))
    expect(result).toBe(false)
  })

  it('isOwner returns true for admin, where-clause with correct field for non-admin', () => {
    fc.assert(
      fc.property(roleArb, userIdArb, userFieldArb, (role, id, field) => {
        const ownerAccess = isOwner(field)
        const result = ownerAccess(makeAccessArgs({ id, role }))
        if (role === 'admin') {
          expect(result).toBe(true)
        } else {
          expect(result).toEqual({ [field]: { equals: id } })
        }
      }),
    )
  })

  it('isOwner returns false for null user', () => {
    fc.assert(
      fc.property(userFieldArb, (field) => {
        const ownerAccess = isOwner(field)
        const result = ownerAccess(makeAccessArgs(null))
        expect(result).toBe(false)
      }),
    )
  })

  it('isOwner defaults to "user" field when no argument provided', () => {
    fc.assert(
      fc.property(roleArb.filter((r) => r !== 'admin'), userIdArb, (role, id) => {
        const ownerAccess = isOwner()
        const result = ownerAccess(makeAccessArgs({ id, role }))
        expect(result).toEqual({ user: { equals: id } })
      }),
    )
  })
})
