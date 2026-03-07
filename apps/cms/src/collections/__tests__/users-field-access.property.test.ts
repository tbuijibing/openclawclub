/**
 * Property 7: 字段级访问控制
 * Validates: Requirements 2.6, 2.7
 *
 * For any non-admin user, the role field's update access function should return false,
 * ensuring only admins can modify user roles. For admin users it should return true.
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { isAdmin } from '../../access/isAdmin'

const nonAdminRoles = ['certified_engineer', 'individual_user'] as const
type NonAdminRole = (typeof nonAdminRoles)[number]

const nonAdminRoleArb = fc.constantFrom<NonAdminRole>(...nonAdminRoles)
const userIdArb = fc.uuid()

function makeFieldAccessArgs(user: { id: string; role: string } | null) {
  return { req: { user } } as Parameters<typeof isAdmin>[0]
}

describe('Property 7: 字段级访问控制 — Users role field update access', () => {
  it('non-admin users cannot update the role field', () => {
    fc.assert(
      fc.property(nonAdminRoleArb, userIdArb, (role, id) => {
        const result = isAdmin(makeFieldAccessArgs({ id, role }))
        expect(result).toBe(false)
      }),
    )
  })

  it('admin users can update the role field', () => {
    fc.assert(
      fc.property(userIdArb, (id) => {
        const result = isAdmin(makeFieldAccessArgs({ id, role: 'admin' }))
        expect(result).toBe(true)
      }),
    )
  })

  it('unauthenticated requests cannot update the role field', () => {
    const result = isAdmin(makeFieldAccessArgs(null))
    expect(result).toBe(false)
  })
})
