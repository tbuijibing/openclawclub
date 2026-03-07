/**
 * Property 2: 订单编号格式唯一性
 * Validates: Requirements 4.3
 *
 * For any order created via the generateOrderNumber hook:
 * - The orderNumber matches format OC-YYYYMMDD-XXXXX (regex: /^OC-\d{8}-[A-Z0-9]{5}$/)
 * - Each generated orderNumber is unique across multiple calls
 * - When operation !== 'create', no orderNumber is generated
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { generateOrderNumber } from '../generateOrderNumber'

const ORDER_NUMBER_REGEX = /^OC-\d{8}-[A-Z0-9]{5}$/

const nonCreateOperations = ['update', 'read', 'delete'] as const

function makeHookArgs(operation: string, data: Record<string, unknown> = {}) {
  return {
    data: { ...data },
    operation,
    req: {} as any,
    collection: {} as any,
    context: {} as any,
    originalDoc: {} as any,
  } as Parameters<typeof generateOrderNumber>[0]
}

describe('Property 2: 订单编号格式唯一性', () => {
  it('every generated orderNumber matches OC-YYYYMMDD-XXXXX format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        async (count) => {
          for (let i = 0; i < count; i++) {
            const args = makeHookArgs('create')
            const result = await generateOrderNumber(args)
            expect(result.orderNumber).toMatch(ORDER_NUMBER_REGEX)
          }
        },
      ),
      { numRuns: 20 },
    )
  })

  it('generated orderNumbers are unique across multiple calls', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 100 }),
        async (count) => {
          const orderNumbers = new Set<string>()
          for (let i = 0; i < count; i++) {
            const args = makeHookArgs('create')
            const result = await generateOrderNumber(args)
            orderNumbers.add(result.orderNumber as string)
          }
          expect(orderNumbers.size).toBe(count)
        },
      ),
      { numRuns: 20 },
    )
  })

  it('non-create operations do NOT generate an orderNumber', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...nonCreateOperations),
        fc.record({
          totalAmount: fc.integer({ min: 1, max: 10000 }),
          currency: fc.constantFrom('USD', 'EUR', 'CNY'),
        }),
        async (operation, existingData) => {
          const args = makeHookArgs(operation, existingData)
          const result = await generateOrderNumber(args)
          expect(result.orderNumber).toBeUndefined()
        },
      ),
    )
  })

  it('the date portion of orderNumber reflects today\'s date', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }),
        async (count) => {
          const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
          for (let i = 0; i < count; i++) {
            const args = makeHookArgs('create')
            const result = await generateOrderNumber(args)
            const orderNumber = result.orderNumber as string
            expect(orderNumber.substring(3, 11)).toBe(today)
          }
        },
      ),
      { numRuns: 10 },
    )
  })
})
