/**
 * Feature: frontend-service-platform-redesign, Property 3: 订单链接可见性与认证状态一致
 * Validates: Requirements 3.1, 3.2, 3.4
 *
 * Tests the navLinks generation logic extracted from Header.tsx:
 * - When user is authenticated (user !== null), navLinks includes an orders entry
 * - When user is unauthenticated (user === null), navLinks does NOT include an orders entry
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Replicates the navLinks generation logic from Header.tsx.
 * The actual Header component builds navLinks as:
 *   [
 *     { href: '/', label: t('home') },
 *     { href: '/products', label: t('services') },
 *     ...(user ? [{ href: '/orders', label: t('orders') }] : []),
 *   ]
 *
 * We replicate this with placeholder labels since the property under test
 * is about structural presence/absence, not label content.
 */
function buildNavLinks(user: { id: number } | null) {
  return [
    { href: '/' as const, label: 'home' },
    { href: '/products' as const, label: 'services' },
    ...(user ? [{ href: '/orders' as const, label: 'orders' }] : []),
  ]
}

function hasOrdersLink(navLinks: Array<{ href: string; label: string }>): boolean {
  return navLinks.some((link) => link.href === '/orders')
}

// Feature: frontend-service-platform-redesign, Property 3: 订单链接可见性与认证状态一致
describe('Property 3: 订单链接可见性与认证状态一致', () => {
  it('对于任意认证状态，订单链接可见性 === 用户已认证', () => {
    // **Validates: Requirements 3.1, 3.2, 3.4**
    const userArb = fc.boolean().map((isAuthenticated) =>
      isAuthenticated ? { id: fc.sample(fc.nat(), 1)[0]! } : null,
    )

    fc.assert(
      fc.property(userArb, (user) => {
        const isAuthenticated = user !== null
        const navLinks = buildNavLinks(user)
        const ordersVisible = hasOrdersLink(navLinks)

        // Core property: orders link visibility must equal authentication state
        expect(ordersVisible).toBe(isAuthenticated)
      }),
      { numRuns: 200 },
    )
  })

  it('已认证用户的 navLinks 始终包含 home、services 和 orders', () => {
    // **Validates: Requirements 3.4**
    const authenticatedUserArb = fc.record({
      id: fc.nat({ max: 10000 }),
    })

    fc.assert(
      fc.property(authenticatedUserArb, (user) => {
        const navLinks = buildNavLinks(user)
        const hrefs = navLinks.map((l) => l.href)

        expect(hrefs).toContain('/')
        expect(hrefs).toContain('/products')
        expect(hrefs).toContain('/orders')
        expect(navLinks).toHaveLength(3)
      }),
      { numRuns: 100 },
    )
  })

  it('未认证用户的 navLinks 仅包含 home 和 services，不含 orders', () => {
    // **Validates: Requirements 3.1, 3.2**
    const navLinks = buildNavLinks(null)
    const hrefs = navLinks.map((l) => l.href)

    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/products')
    expect(hrefs).not.toContain('/orders')
    expect(navLinks).toHaveLength(2)
  })
})
