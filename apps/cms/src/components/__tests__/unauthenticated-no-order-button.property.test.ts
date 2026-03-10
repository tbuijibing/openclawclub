/**
 * Feature: frontend-service-platform-redesign, Property 4: 未登录用户不可见订单操作按钮
 * Validates: Requirements 2.4
 *
 * For any service detail page, when the user is unauthenticated,
 * no "Add to Order" or any auth-required action button should be rendered.
 */
import { describe, it, expect, vi } from 'vitest'
import * as fc from 'fast-check'
import { render } from '@testing-library/react'
import React from 'react'

// Mock dependencies
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => React.createElement('div', props, children),
  CardHeader: ({ children, ...props }: any) => React.createElement('div', props, children),
  CardTitle: ({ children, ...props }: any) => React.createElement('h3', props, children),
  CardContent: ({ children, ...props }: any) => React.createElement('div', props, children),
  CardFooter: ({ children, ...props }: any) => React.createElement('div', props, children),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => React.createElement('span', props, children),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => React.createElement('button', props, children),
}))

import { ServiceCard } from '../ServiceCard'

const CATEGORIES = [
  'clawbox_lite',
  'clawbox_pro',
  'clawbox_enterprise',
  'recommended_hardware',
  'accessories',
] as const

const categoryLabelsMap: Record<string, string> = {
  clawbox_lite: 'ClawBox Lite',
  clawbox_pro: 'ClawBox Pro',
  clawbox_enterprise: 'ClawBox Enterprise',
  recommended_hardware: 'Recommended Hardware',
  accessories: 'Accessories',
}

const serviceDataArb = fc.record({
  id: fc.oneof(fc.uuid(), fc.nat({ max: 99999 }).map(String)),
  name: fc.stringMatching(/^[A-Za-z0-9 ]{1,60}$/).filter((s) => s.trim().length > 0),
  description: fc.stringMatching(/^[A-Za-z0-9 .,!?]{1,200}$/).filter((s) => s.trim().length > 0),
  price: fc.double({ min: 0, max: 99999.99, noNaN: true, noDefaultInfinity: true }),
  category: fc.constantFrom(...CATEGORIES),
  locale: fc.constantFrom('zh', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'ur', 'vi', 'ms'),
})

// Feature: frontend-service-platform-redesign, Property 4: 未登录用户不可见订单操作按钮
describe('Property 4: 未登录用户不可见订单操作按钮', () => {
  it('对于任意服务数据，未登录状态下不渲染"加入订单"按钮', () => {
    // **Validates: Requirements 2.4**
    fc.assert(
      fc.property(serviceDataArb, (data) => {
        const translations = {
          viewDetails: 'View Details',
          price: 'Price',
          addToOrder: 'Add to Order',
          categories: categoryLabelsMap,
        }

        const { container } = render(
          React.createElement(ServiceCard, {
            ...data,
            isAuthenticated: false,
            translations,
          }),
        )

        const text = container.textContent || ''
        const links = container.querySelectorAll('a')
        const orderLinks = Array.from(links).filter((a) =>
          a.getAttribute('href')?.includes('/orders/'),
        )

        // No "Add to Order" text should be visible
        expect(text).not.toContain('Add to Order')
        // No order-related links should exist
        expect(orderLinks).toHaveLength(0)

        container.innerHTML = ''
      }),
      { numRuns: 100 },
    )
  })
})
