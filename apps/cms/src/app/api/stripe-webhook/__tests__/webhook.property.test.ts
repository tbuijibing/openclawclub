/**
 * Property 8: Stripe Webhook 签名验证
 * Validates: Requirements 5.5
 *
 * For any received Webhook request, if signature verification fails,
 * the system should return 400 and not update any data.
 *
 * Tested properties:
 * 1. Random invalid signatures always result in 400 status
 * 2. No payload.update calls are made when signature is invalid
 * 3. The error response body contains { error: 'Invalid signature' }
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

// Mock @payload-config (must be before route import)
vi.mock('@payload-config', () => ({ default: {} }))

// Mock payload - getPayload should never be reached on invalid signatures
const { getPayload: mockGetPayload } = vi.hoisted(() => {
  const mockUpdate = vi.fn()
  const mockFind = vi.fn()
  return {
    getPayload: vi.fn().mockResolvedValue({
      find: mockFind,
      update: mockUpdate,
    }),
    mockUpdate,
    mockFind,
  }
})

vi.mock('payload', () => ({
  getPayload: mockGetPayload,
}))

// Mock Stripe with constructEvent that throws
const { mockConstructEvent } = vi.hoisted(() => {
  const mockConstructEvent = vi.fn()
  return { mockConstructEvent }
})

vi.mock('stripe', () => ({
  default: class StripeMock {
    webhooks = { constructEvent: mockConstructEvent }
  },
}))

// Import the route handler AFTER mocks are set up
import { POST } from '../route'

function makeRequest(body: string, signature: string): Request {
  return new Request('http://localhost:3000/api/stripe-webhook', {
    method: 'POST',
    body,
    headers: {
      'stripe-signature': signature,
    },
  })
}

describe('Property 8: Stripe Webhook 签名验证', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Always throw on constructEvent to simulate invalid signature
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })
  })

  it('invalid signatures always return 400 status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 500 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        async (body, signature) => {
          const req = makeRequest(body, signature)
          const response = await POST(req as any)

          expect(response.status).toBe(400)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('no payload.update or find calls when signature is invalid', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 500 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        async (body, signature) => {
          const req = makeRequest(body, signature)
          await POST(req as any)

          expect(mockGetPayload).not.toHaveBeenCalled()
        },
      ),
      { numRuns: 100 },
    )
  })

  it('error response body contains { error: "Invalid signature" }', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 500 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        async (body, signature) => {
          const req = makeRequest(body, signature)
          const response = await POST(req as any)
          const json = await response.json()

          expect(json).toEqual({ error: 'Invalid signature' })
        },
      ),
      { numRuns: 50 },
    )
  })
})
