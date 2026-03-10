/**
 * Feature: frontend-service-platform-redesign, Property 5: 分类筛选正确性
 * Validates: Requirements 5.2
 *
 * For any random list of services and any random selected category,
 * all filtered results must have category === selectedCategory.
 * When selectedCategory is null, all services should be returned.
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

const CATEGORIES = [
  'clawbox_lite',
  'clawbox_pro',
  'clawbox_enterprise',
  'recommended_hardware',
  'accessories',
] as const

type Category = (typeof CATEGORIES)[number]

interface Service {
  id: string
  name: string
  description: string
  price: number
  category: Category
}

/**
 * Replicates the filtering logic used in the service list page.
 * When selectedCategory is null, all services are returned (the "全部" option).
 * Otherwise, only services matching the selected category are returned.
 */
function filterServices(services: Service[], selectedCategory: string | null): Service[] {
  if (selectedCategory === null) return services
  return services.filter((s) => s.category === selectedCategory)
}

const serviceArb: fc.Arbitrary<Service> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ maxLength: 200 }),
  price: fc.nat({ max: 100000 }),
  category: fc.constantFrom(...CATEGORIES),
})

const serviceListArb = fc.array(serviceArb, { minLength: 0, maxLength: 30 })
const categoryArb = fc.constantFrom(...CATEGORIES)

// Feature: frontend-service-platform-redesign, Property 5: 分类筛选正确性
describe('Property 5: 分类筛选正确性', () => {
  it('对于任意服务列表和任意选中分类，筛选结果的 category 全部匹配选中分类', () => {
    // **Validates: Requirements 5.2**
    fc.assert(
      fc.property(serviceListArb, categoryArb, (services, selectedCategory) => {
        const filtered = filterServices(services, selectedCategory)

        // Every filtered service must have the selected category
        for (const service of filtered) {
          expect(service.category).toBe(selectedCategory)
        }

        // The filtered count must equal the number of services with that category
        const expectedCount = services.filter((s) => s.category === selectedCategory).length
        expect(filtered).toHaveLength(expectedCount)
      }),
      { numRuns: 200 },
    )
  })

  it('当 selectedCategory 为 null 时，返回所有服务', () => {
    // **Validates: Requirements 5.2**
    fc.assert(
      fc.property(serviceListArb, (services) => {
        const filtered = filterServices(services, null)

        expect(filtered).toHaveLength(services.length)
        expect(filtered).toEqual(services)
      }),
      { numRuns: 100 },
    )
  })
})
