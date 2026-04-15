import 'dotenv/config'
import { Client } from 'pg'

if (!process.env.DATABASE_URL) {
  console.error('Missing required environment variable: DATABASE_URL')
  process.exit(1)
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
})

async function ensureMailboxTagsColumn() {
  await client.query('BEGIN')

  try {
    await client.query(`
      ALTER TABLE "mailboxes"
      ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
    `)

    await client.query(`
      UPDATE "mailboxes"
      SET "tags" = ARRAY[]::TEXT[]
      WHERE "tags" IS NULL
    `)

    await client.query(`
      ALTER TABLE "mailboxes"
      ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[]
    `)

    await client.query(`
      ALTER TABLE "mailboxes"
      ALTER COLUMN "tags" SET NOT NULL
    `)

    await client.query('COMMIT')
    console.log('Mailbox tags column is ready (TEXT[] NOT NULL DEFAULT []).')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

async function main() {
  await client.connect()

  try {
    await ensureMailboxTagsColumn()
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Failed to ensure mailbox tags column:', error)
  process.exit(1)
})
