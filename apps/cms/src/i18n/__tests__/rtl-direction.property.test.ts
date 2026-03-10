/**
 * Feature: frontend-service-platform-redesign, Property 7: RTL 方向正确性
 * Validates: Requirements 6.7
 *
 * For any locale, when locale is 'ur', the document direction should be 'rtl'.
 * For all other 9 locales, the direction should be 'ltr'.
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { locales, rtlLocales } from '../routing'

/**
 * Replicates the direction logic from [locale]/layout.tsx:
 *   const dir = (rtlLocales as readonly string[]).includes(locale) ? 'rtl' : 'ltr'
 */
function getDirection(locale: string): 'rtl' | 'ltr' {
  return (rtlLocales as readonly string[]).includes(locale) ? 'rtl' : 'ltr'
}

// Feature: frontend-service-platform-redesign, Property 7: RTL 方向正确性
describe('Property 7: RTL 方向正确性', () => {
  const localeArb = fc.constantFrom(...locales)

  it('对于任意 locale，ur 时 dir 为 rtl，其他为 ltr', () => {
    // **Validates: Requirements 6.7**
    fc.assert(
      fc.property(localeArb, (locale) => {
        const dir = getDirection(locale)

        if (locale === 'ur') {
          expect(dir).toBe('rtl')
        } else {
          expect(dir).toBe('ltr')
        }
      }),
      { numRuns: 200 },
    )
  })

  it('rtlLocales 仅包含 ur', () => {
    expect(rtlLocales).toEqual(['ur'])
  })

  it('所有非 ur locale 的方向均为 ltr', () => {
    const nonUrLocales = locales.filter((l) => l !== 'ur')
    for (const locale of nonUrLocales) {
      expect(getDirection(locale)).toBe('ltr')
    }
  })
})
