import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."_locales" ADD VALUE IF NOT EXISTS 'ur';
    ALTER TYPE "public"."_locales" ADD VALUE IF NOT EXISTS 'vi';
    ALTER TYPE "public"."_locales" ADD VALUE IF NOT EXISTS 'ms';
    ALTER TYPE "public"."language_preference" ADD VALUE IF NOT EXISTS 'ur';
    ALTER TYPE "public"."language_preference" ADD VALUE IF NOT EXISTS 'vi';
    ALTER TYPE "public"."language_preference" ADD VALUE IF NOT EXISTS 'ms';
    ALTER TYPE "public"."enum_site_settings_default_language" ADD VALUE IF NOT EXISTS 'ur';
    ALTER TYPE "public"."enum_site_settings_default_language" ADD VALUE IF NOT EXISTS 'vi';
    ALTER TYPE "public"."enum_site_settings_default_language" ADD VALUE IF NOT EXISTS 'ms';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // PostgreSQL does not support removing values from enum types.
  // To fully reverse this migration, you would need to recreate the enum types
  // without the new values and update all referencing columns.
  // This is intentionally left as a no-op for safety.
}
