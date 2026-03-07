import { Pool, type PoolClient } from 'pg'

export interface MigrationResult {
  table: string
  status: 'success' | 'failed' | 'skipped'
  rowsAffected: number
  error?: string
}

export interface DbClient {
  query(sql: string): Promise<{ rows: Array<Record<string, unknown>>; rowCount: number | null }>
  beginTransaction(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>
}

export type TableMigrationFn = (client: DbClient) => Promise<number>

/**
 * Migrate a single table with transaction isolation.
 * If the migration function throws, the transaction is rolled back for this table only.
 */
export async function migrateTable(
  client: DbClient,
  tableName: string,
  migrateFn: TableMigrationFn,
): Promise<MigrationResult> {
  try {
    await client.beginTransaction()
    const rowsAffected = await migrateFn(client)
    await client.commit()
    return { table: tableName, status: 'success', rowsAffected }
  } catch (error) {
    await client.rollback()
    return {
      table: tableName,
      status: 'failed',
      rowsAffected: 0,
      error: (error as Error).message,
    }
  }
}

/**
 * Run migrations for multiple tables. Each table gets its own transaction.
 * Failed tables are rolled back independently; successful tables remain committed.
 */
export async function migrateAllTables(
  client: DbClient,
  tableMigrations: Array<{ name: string; migrate: TableMigrationFn }>,
): Promise<MigrationResult[]> {
  const results: MigrationResult[] = []
  for (const { name, migrate } of tableMigrations) {
    const result = await migrateTable(client, name, migrate)
    results.push(result)
  }
  console.log('\n=== 迁移报告 ===')
  for (const r of results) {
    console.log(`[${r.status.toUpperCase()}] ${r.table}: ${r.rowsAffected} 行 ${r.error ? `- ${r.error}` : ''}`)
  }
  return results
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(level: string, message: string) {
  const ts = new Date().toISOString()
  console.log(`[${ts}] [${level}] ${message}`)
}

function wrapPoolClient(client: PoolClient): DbClient {
  return {
    query: async (sql: string) => {
      const res = await client.query(sql)
      return { rows: res.rows, rowCount: res.rowCount }
    },
    beginTransaction: async () => { await client.query('BEGIN') },
    commit: async () => { await client.query('COMMIT') },
    rollback: async () => { await client.query('ROLLBACK') },
  }
}

async function columnExists(client: DbClient, table: string, column: string): Promise<boolean> {
  const res = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = '${column}' LIMIT 1`,
  )
  return res.rowCount !== null && res.rowCount > 0
}

async function tableExists(client: DbClient, table: string): Promise<boolean> {
  const res = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}' LIMIT 1`,
  )
  return res.rowCount !== null && res.rowCount > 0
}

// ---------------------------------------------------------------------------
// Table-specific migration functions
// ---------------------------------------------------------------------------

async function migrateUsersPasswordHash(client: DbClient): Promise<number> {
  const hasPasswordHash = await columnExists(client, 'users', 'password_hash')
  const hasHash = await columnExists(client, 'users', 'hash')
  if (!hasPasswordHash || !hasHash) return 0

  const result = await client.query(`
    UPDATE users SET hash = password_hash
    WHERE password_hash IS NOT NULL AND (hash IS NULL OR hash = '')
  `)
  await client.query(`UPDATE users SET salt = '' WHERE salt IS NULL AND hash IS NOT NULL`)
  return result.rowCount ?? 0
}

async function validateTableIntegrity(client: DbClient, table: string): Promise<number> {
  const exists = await tableExists(client, table)
  if (!exists) return 0
  const countRes = await client.query(`SELECT COUNT(*)::int AS count FROM "${table}"`)
  return Number(countRes.rows[0].count)
}

// ---------------------------------------------------------------------------
// Table definitions
// ---------------------------------------------------------------------------

const CORE_TABLES = [
  'users', 'orders', 'payments', 'install_orders',
  'delivery_reports', 'service_reviews', 'hardware_products', 'audit_logs',
]

// ---------------------------------------------------------------------------
// Main migration orchestrator
// ---------------------------------------------------------------------------

interface MigrationSummary {
  results: MigrationResult[]
  totalSuccess: number
  totalFailed: number
  totalSkipped: number
  startedAt: Date
  completedAt: Date
}

export async function migrateFromTypeORM(connectionString?: string): Promise<MigrationSummary> {
  const connStr =
    connectionString || process.env.DATABASE_URI || 'postgresql://justin@localhost:5432/openclaw_club'

  const pool = new Pool({ connectionString: connStr })
  const startedAt = new Date()

  log('INFO', '=== Starting TypeORM → Payload CMS migration ===')

  const tableMigrations: Array<{ name: string; migrate: TableMigrationFn }> = [
    { name: 'users (password hash)', migrate: migrateUsersPasswordHash },
    ...CORE_TABLES.map((table) => ({
      name: table,
      migrate: (c: DbClient) => validateTableIntegrity(c, table),
    })),
  ]

  const pgClient = await pool.connect()
  const dbClient = wrapPoolClient(pgClient)
  const results = await migrateAllTables(dbClient, tableMigrations)
  pgClient.release()
  await pool.end()

  const completedAt = new Date()
  const summary: MigrationSummary = {
    results,
    totalSuccess: results.filter((r) => r.status === 'success').length,
    totalFailed: results.filter((r) => r.status === 'failed').length,
    totalSkipped: results.filter((r) => r.status === 'skipped').length,
    startedAt,
    completedAt,
  }

  printSummary(summary)
  return summary
}

function printSummary(summary: MigrationSummary) {
  const durationMs = summary.completedAt.getTime() - summary.startedAt.getTime()
  console.log('\n' + '='.repeat(60))
  console.log('  Migration Summary')
  console.log(`  Duration: ${durationMs}ms | Success: ${summary.totalSuccess} | Failed: ${summary.totalFailed} | Skipped: ${summary.totalSkipped}`)
  console.log('='.repeat(60) + '\n')
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('migrate-from-typeorm.ts') || process.argv[1].endsWith('migrate-from-typeorm.js'))

if (isDirectRun) {
  migrateFromTypeORM()
    .then((summary) => process.exit(summary.totalFailed > 0 ? 1 : 0))
    .catch((err) => { console.error('Migration crashed:', err); process.exit(2) })
}
