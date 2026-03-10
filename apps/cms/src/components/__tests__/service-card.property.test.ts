/**
 * Feature: frontend-service-platform-redesign, Property 6: 服务卡片包含必要信息
 * Validates: Requirements 5.6
 *
 * For any valid service data (name, description, price, category),
 * the ServiceCard component's rendered output must contain:
 * - The service name
 * - The description text
 * - The formatted price
 * - The category label (translated or fallback)
 */
import { describe, it, expect, vi } from 'vitest'
import * as fc from 'fast-check'
import { render } from '@testing-library/react'
import React from 'react'

// Mock @/i18n/navigation — Link renders as a plain <a>
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}))

// Mock shadcn/ui components to render simple HTML wrappers
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'card', ...props }, children),
  CardHeader: ({ children, ...props }: any) => React.createElement('div', props, children),
  CardTitle: ({ children, ...props }: any) => React.createElement('h3', props, children),
  CardContent: ({ children, ...props }: any) => React.createElement('div', props, children),
  CardFooter: ({ children, ...props }: any) => React.createElement('div', props, children),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => React.createElement('span', { 'data-testid': 'badge', ...props }, children),
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

/** Arbitrary for generating valid ServiceCard props */
const serviceDataArb = fc.record({
  id: fc.oneof(fc.uuid(), fc.nat({ max: 99999 }).map(String)),
  name: fc.stringMatching(/^[A-Za-z0-9 ]{1,60}$/).filter((s) => s.trim().length > 0),
  description: fc.stringMatching(/^[A-Za-z0-9 .,!?]{1,200}$/).filter((s) => s.trim().length > 0),
  price: fc.double({ min: 0, max: 99999.99, noNaN: true, noDefaultInfinity: true }),
  category: fc.constantFrom(...CATEGORIES),
  locale: fc.constantFrom('zh', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'ur', 'vi', 'ms'),
  isAuthenticated: fc.boolean(),
})

// Feature: frontend-service-platform-redesign, Property 6: 服务卡片包含必要信息
describe('Property 6: 服务卡片包含必要信息', () => {
  it('对于任意有效服务数据，ServiceCard 渲染输出包含名称、描述、价格和分类标签', () => {
    // **Validates: Requirements 5.6**
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
            translations,
          }),
        )

        const text = container.textContent || ''

        // Service name must be present
        expect(text).toContain(data.name)

        // Description must be present
        expect(text).toContain(data.description)

        // Price must be present (formatted with toFixed(2))
        expect(text).toContain(data.price.toFixed(2))

        // Category label must be present (translated label from categories map)
        const expectedCategoryLabel = categoryLabelsMap[data.category] || data.category
        expect(text).toContain(expectedCategoryLabel)

        // Cleanup
        container.innerHTML = ''
      }),
      { numRuns: 150 },
    )
  })
})
