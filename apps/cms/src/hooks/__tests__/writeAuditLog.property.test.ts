/**
 * Property 5: 关键变更审计日志
 * Validates: Requirements 11.3, 11.4
 *
 * For any users role change or install-orders installStatus change,
 * the writeAuditLog hook should automatically create an audit-logs record.
 *
 * Tested properties:
 * 1. Role changes on 'users' resourceType produce details with field='role'
 * 2. installStatus changes on 'install-orders' resourceType produce details with field='installStatus'
 * 3. Create operations always call audit-logs create
 * 4. The action format is always `{resourceType}.{create|update}`
 */
import { describe, it, expect, vi } from 'vitest'
import * as fc from 'fast-check'
import { writeAuditLog } from '../writeAuditLog'

const USER_ROLES = ['admin', 'certified_engineer', 'individual_user'] as const
const INSTALL_STATUSES = ['pending_dispatch', 'accepted', 'in_progress', 'pending_acceptance', 'completed'] as const

function makeMockReq(userId?: string | null) {
  const createFn = vi.fn().mockResolvedValue({ id: 'audit-1' })
  return {
    req: {
      user: userId ? { id: userId } : null,
      payload: { create: createFn },
      headers: { get: vi.fn().mockReturnValue('127.0.0.1') },
    } as any,
    createFn,
  }
}

/** Generate a pair of distinct roles */
const distinctRolePair = fc
  .tuple(fc.constantFrom(...USER_ROLES), fc.constantFrom(...USER_ROLES))
  .filter(([a, b]) => a !== b)

/** Generate a pair of distinct install statuses */
const distinctStatusPair = fc
  .tuple(fc.constantFrom(...INSTALL_STATUSES), fc.constantFrom(...INSTALL_STATUSES))
  .filter(([a, b]) => a !== b)

describe('Property 5: 关键变更审计日志', () => {
  it('role changes on users produce details with field=role', async () => {
    await fc.assert(
      fc.asyncProperty(
        distinctRolePair,
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        async ([fromRole, toRole], docId, userId) => {
          const { req, createFn } = makeMockReq(userId)
          const hook = writeAuditLog('users')

          await hook({
            doc: { id: docId, role: toRole },
            previousDoc: { id: docId, role: fromRole },
            req,
            operation: 'update',
            collection: {} as any,
            context: {} as any,
          } as any)

          expect(createFn).toHaveBeenCalledOnce()
          const callData = createFn.mock.calls[0][0].data
          expect(callData.details).toEqual({
            field: 'role',
            from: fromRole,
            to: toRole,
          })
          expect(callData.action).toBe('users.update')
          expect(callData.resourceType).toBe('users')
          expect(callData.resourceId).toBe(String(docId))
        },
      ),
      { numRuns: 50 },
    )
  })

  it('installStatus changes on install-orders produce details with field=installStatus', async () => {
    await fc.assert(
      fc.asyncProperty(
        distinctStatusPair,
        fc.string({ minLength: 1, maxLength: 20 }),
        async ([fromStatus, toStatus], docId) => {
          const { req, createFn } = makeMockReq('user-123')
          const hook = writeAuditLog('install-orders')

          await hook({
            doc: { id: docId, installStatus: toStatus },
            previousDoc: { id: docId, installStatus: fromStatus },
            req,
            operation: 'update',
            collection: {} as any,
            context: {} as any,
          } as any)

          expect(createFn).toHaveBeenCalledOnce()
          const callData = createFn.mock.calls[0][0].data
          expect(callData.details).toEqual({
            field: 'installStatus',
            from: fromStatus,
            to: toStatus,
          })
          expect(callData.action).toBe('install-orders.update')
          expect(callData.resourceType).toBe('install-orders')
        },
      ),
      { numRuns: 50 },
    )
  })

  it('create operations always call audit-logs create', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('users', 'install-orders', 'orders', 'payments'),
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          role: fc.constantFrom(...USER_ROLES),
        }),
        fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
        async (resourceType, doc, userId) => {
          const { req, createFn } = makeMockReq(userId)
          const hook = writeAuditLog(resourceType)

          await hook({
            doc,
            previousDoc: undefined as any,
            req,
            operation: 'create',
            collection: {} as any,
            context: {} as any,
          } as any)

          expect(createFn).toHaveBeenCalledOnce()
          const call = createFn.mock.calls[0][0]
          expect(call.collection).toBe('audit-logs')
          expect(call.overrideAccess).toBe(true)
          expect(call.data.user).toBe(userId)
          expect(call.data.resourceId).toBe(String(doc.id))
        },
      ),
      { numRuns: 50 },
    )
  })

  it('action format is always {resourceType}.{create|update}', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('users', 'install-orders', 'orders', 'payments', 'delivery-reports'),
        fc.constantFrom('create' as const, 'update' as const),
        fc.string({ minLength: 1, maxLength: 20 }),
        async (resourceType, operation, docId) => {
          const { req, createFn } = makeMockReq('user-1')
          const hook = writeAuditLog(resourceType)

          await hook({
            doc: { id: docId },
            previousDoc: operation === 'update' ? { id: docId } : undefined,
            req,
            operation,
            collection: {} as any,
            context: {} as any,
          } as any)

          expect(createFn).toHaveBeenCalledOnce()
          const callData = createFn.mock.calls[0][0].data
          const expectedAction = `${resourceType}.${operation}`
          expect(callData.action).toBe(expectedAction)
          expect(callData.action).toMatch(/^[\w-]+\.(create|update)$/)
        },
      ),
      { numRuns: 50 },
    )
  })
})
