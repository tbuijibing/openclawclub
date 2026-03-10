/**
 * Feature: frontend-service-platform-redesign
 * Property 1: 翻译键名不含 "product"
 * Property 2: 翻译文件键结构一致性
 * Validates: Requirements 1.7, 6.1, 4.3
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

const MESSAGES_DIR = path.resolve(__dirname, '../../../messages')
const LOCALE_FILES = ['zh', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'ur', 'vi', 'ms']
const CHECKED_NAMESPACES = ['services', 'nav', 'home', 'orders', 'common']

function loadLocale(locale: string): Record<string, unknown> {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`)
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function getKeyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getKeyPaths(value as Record<string, unknown>, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys.sort()
}

// Feature: frontend-service-platform-redesign, Property 1: 翻译键名不含 product
// **Validates: Requirements 1.7**
describe('Property 1: 翻译键名不含 product', () => {
  const localeArb = fc.constantFrom(...LOCALE_FILES)

  it('对于任意 locale 文件，services/nav/home/orders/common 命名空间中无 product/products 键名', () => {
    fc.assert(
      fc.property(localeArb, (locale) => {
        const data = loadLocale(locale)
        for (const ns of CHECKED_NAMESPACES) {
          const nsData = data[ns]
          if (!nsData || typeof nsData !== 'object') continue
          const keys = getKeyPaths(nsData as Record<string, unknown>, ns)
          for (const key of keys) {
            const segments = key.split('.')
            for (const segment of segments) {
              expect(segment.toLowerCase()).not.toMatch(/products?/)
            }
          }
        }
      }),
      { numRuns: 100 },
    )
  })
})

// Feature: frontend-service-platform-redesign, Property 2: 翻译文件键结构一致性
describe('Property 2: 翻译文件键结构一致性', () => {
  it('所有 10 个 locale 文件的键路径集合完全相同', () => {
    const allKeySets = LOCALE_FILES.map((locale) => {
      const data = loadLocale(locale)
      return getKeyPaths(data)
    })
    const referenceKeys = allKeySets[0]!
    for (let i = 1; i < allKeySets.length; i++) {
      const currentKeys = allKeySets[i]!
      const missing = referenceKeys.filter((k) => !currentKeys.includes(k))
      const extra = currentKeys.filter((k) => !referenceKeys.includes(k))
      expect(missing).toEqual([])
      expect(extra).toEqual([])
    }
  })
})