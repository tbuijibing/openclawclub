/**
 * Property: 迁移表级回滚
 * Validates: Requirements 13.5
 *
 * Verifies that when a single table migration fails, that table is rolled back
 * while other tables are committed successfully. The migration summary correctly
 * reports successes and failures.
 */
import { describe, it, expect, vi } from 'vitest'
import * as fc from 'fast-check'
import {
  migrateTable,
  migrateAllTables,
  type DbClient,
  type TableMigrationFn,
} from '../migrate-from-typeorm'

/** Create a mock DbClient that tracks transaction calls */
function createMockClient() {
  const calls: string[] = []
  const client: DbClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    beginTransaction: vi.fn(async () => { calls.push('begin') }),
    commit: vi.fn(async () => { calls.push('commit') }),
    rollback: vi.fn(async () => { calls.push('rollback') }),
  }
  return { client, calls }
}

/** Arbitrary for table names */
const tableNameArb = fc.stringMatching(/^[a-z][a-z_]{0,19}$/)

/** Arbitrary for a non-empty list of table names (unique) */
const tableNamesArb = fc.uniqueArray(tableNameArb, { minLength: 2, maxLength: 8 })

/** Arbitrary for a non-empty subset of indices from an array */
function subsetIndicesArb(length: number) {
  return fc
    .uniqueArray(fc.nat({ max: length - 1 }), { minLength: 1, maxLength: length })
}

describe('Property: 迁移表级回滚', () => {
  it('failed table is rolled back, not committed', async () => {
    await fc.assert(
      fc.asyncProperty(tableNameArb, async (tableName) => {
        const { client, calls } = createMockClient()
        const failingMigration: TableMigrationFn = async () => {
          throw new Error('migration error')
        }

        const result = await migrateTable(client, tableName, failingMigration)

        expect(result.status).toBe('failed')
        expect(result.rowsAffected).toBe(0)
        expect(result.error).toBe('migration error')
        expect(calls).toContain('begin')
        expect(calls).toContain('rollback')
        expect(calls).not.toContain('commit')
      }),
      { numRuns: 50 },
    )
  })

  it('successful table is committed, not rolled back', async () => {
    await fc.assert(
      fc.asyncProperty(
        tableNameArb,
        fc.nat({ max: 1000 }),
        async (tableName, rowCount) => {
          const { client, calls } = createMockClient()
          const successMigration: TableMigrationFn = async () => rowCount

          const result = await migrateTable(client, tableName, successMigration)

          expect(result.status).toBe('success')
          expect(result.rowsAffected).toBe(rowCount)
          expect(result.error).toBeUndefined()
          expect(calls).toContain('begin')
          expect(calls).toContain('commit')
          expect(calls).not.toContain('rollback')
        },
      ),
      { numRuns: 50 },
    )
  })

  it('with random failures, failed tables rollback and successful tables commit', async () => {
    await fc.assert(
      fc.asyncProperty(
        tableNamesArb.chain((names) =>
          fc.tuple(
            fc.constant(names),
            subsetIndicesArb(names.length),
          ),
        ),
        async ([tableNames, failIndices]) => {
          const failSet = new Set(failIndices)
          const perTableCalls: Map<string, string[]> = new Map()

          const migrations = tableNames.map((name, idx) => {
            const tableCalls: string[] = []
            perTableCalls.set(name, tableCalls)

            return {
              name,
              migrate: (async () => {
                if (failSet.has(idx)) {
                  throw new Error(`fail-${name}`)
                }
                return idx + 1
              }) as TableMigrationFn,
            }
          })

          // Create a client that tracks calls per-table by using a counter
          let currentTable = 0
          const allTableCalls: string[][] = tableNames.map(() => [])
          const client: DbClient = {
            query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
            beginTransaction: vi.fn(async () => {
              allTableCalls[currentTable].push('begin')
            }),
            commit: vi.fn(async () => {
              allTableCalls[currentTable].push('commit')
              currentTable++
            }),
            rollback: vi.fn(async () => {
              allTableCalls[currentTable].push('rollback')
              currentTable++
            }),
          }

          const results = await migrateAllTables(client, migrations)

          // Verify result count matches table count
          expect(results.length).toBe(tableNames.length)

          for (let i = 0; i < tableNames.length; i++) {
            const result = results[i]
            const tableTxCalls = allTableCalls[i]

            if (failSet.has(i)) {
              // Failed table: rolled back, status=failed, rowsAffected=0
              expect(result.status).toBe('failed')
              expect(result.rowsAffected).toBe(0)
              expect(result.error).toBeDefined()
              expect(tableTxCalls).toContain('begin')
              expect(tableTxCalls).toContain('rollback')
              expect(tableTxCalls).not.toContain('commit')
            } else {
              // Successful table: committed, status=success
              expect(result.status).toBe('success')
              expect(result.rowsAffected).toBe(i + 1)
              expect(result.error).toBeUndefined()
              expect(tableTxCalls).toContain('begin')
              expect(tableTxCalls).toContain('commit')
              expect(tableTxCalls).not.toContain('rollback')
            }
          }

          // Summary: count of successes + failures = total tables
          const successes = results.filter((r) => r.status === 'success').length
          const failures = results.filter((r) => r.status === 'failed').length
          expect(successes + failures).toBe(tableNames.length)
          expect(failures).toBe(failSet.size)
        },
      ),
      { numRuns: 100 },
    )
  })
})
