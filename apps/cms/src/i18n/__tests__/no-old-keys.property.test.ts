/**
 * Feature: frontend-service-platform-redesign, Property 8: 源代码无旧翻译键引用
 * Validates: Requirements 1.8
 *
 * For any .tsx or .ts file under apps/cms/src/, there should be no references
 * to deprecated translation keys like 'products.', 'nav.products',
 * 'home.browseProducts', 'home.featuredProducts', 'home.noProducts',
 * 'orders.selectProduct', 'orders.product', 'orders.productRequired'.
 */
import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const SRC_DIR = path.resolve(__dirname, '../../')

const DEPRECATED_PATTERNS = [
  /useTranslations\(\s*['"]products['"]\s*\)/,
  /getTranslations\(\s*['"]products['"]\s*\)/,
  /getTranslations\(\s*\{\s*namespace:\s*['"]products['"]/,
  /t\(\s*['"]browseProducts['"]\s*\)/,
  /t\(\s*['"]featuredProducts['"]\s*\)/,
  /t\(\s*['"]noProducts['"]\s*\)/,
  /t\(\s*['"]selectProduct['"]\s*\)/,
  /t\(\s*['"]productRequired['"]\s*\)/,
]

function getAllSourceFiles(dir: string): string[] {
  const files: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__' || entry.name === '.next') continue
      files.push(...getAllSourceFiles(fullPath))
    } else if (/\.(tsx?|ts)$/.test(entry.name)) {
      files.push(fullPath)
    }
  }
  return files
}

// Feature: frontend-service-platform-redesign, Property 8: 源代码无旧翻译键引用
describe('Property 8: 源代码无旧翻译键引用', () => {
  it('apps/cms/src/ 下所有 .tsx/.ts 文件不包含已废弃的翻译键引用', () => {
    // **Validates: Requirements 1.8**
    const sourceFiles = getAllSourceFiles(SRC_DIR)

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const relativePath = path.relative(SRC_DIR, filePath)

      for (const pattern of DEPRECATED_PATTERNS) {
        const match = content.match(pattern)
        expect(
          match,
          `File "${relativePath}" contains deprecated key reference: ${match?.[0]}`,
        ).toBeNull()
      }
    }
  })
})
