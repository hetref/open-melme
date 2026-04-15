import 'dotenv/config'
import { Client } from 'pg'

const requiredEnv = ['DATABASE_URL']
for (const name of requiredEnv) {
  if (!process.env[name]) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
})

async function ensureNonEmptyAliasPersonalEmail() {
  await client.query('BEGIN')

  try {
    await client.query(`
      ALTER TABLE "aliases"
      ADD COLUMN IF NOT EXISTS "personalEmail" TEXT
    `)

    const backfillResult = await client.query(`
      UPDATE "aliases" AS a
      SET "personalEmail" = lower(trim(u."email"))
      FROM "user" AS u
      WHERE a."userId" = u."id"
        AND a."personalEmail" IS DISTINCT FROM lower(trim(u."email"))
    `)

    await client.query(`
      UPDATE "aliases"
      SET "personalEmail" = lower(trim("personalEmail"))
      WHERE "personalEmail" IS NOT NULL
    `)

    const remainingResult = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM "aliases"
      WHERE "personalEmail" IS NULL OR btrim("personalEmail") = ''
    `)

    const remaining = remainingResult.rows[0]?.count ?? 0
    if (remaining > 0) {
      throw new Error(
        `Cannot enforce mandatory personalEmail: ${remaining} alias rows still have NULL/empty personalEmail`
      )
    }

    await client.query(`
      ALTER TABLE "aliases"
      ALTER COLUMN "personalEmail" SET NOT NULL
    `)

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'aliases_personal_email_not_empty'
        ) THEN
          ALTER TABLE "aliases"
          ADD CONSTRAINT "aliases_personal_email_not_empty"
          CHECK (char_length(btrim("personalEmail")) > 0);
        END IF;
      END $$
    `)

    const totalResult = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM "aliases"
    `)

    await client.query('COMMIT')

    console.log('Alias personalEmail backfill completed successfully.')
    console.log(`Rows updated from owner email: ${backfillResult.rowCount}`)
    console.log(`Total aliases checked: ${totalResult.rows[0]?.count ?? 0}`)
    console.log('Enforced constraints: NOT NULL + non-empty CHECK.')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

async function main() {
  await client.connect()

  try {
    await ensureNonEmptyAliasPersonalEmail()
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Failed to backfill alias personalEmail:', error)
  process.exit(1)
})
