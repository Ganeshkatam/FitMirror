import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL
// Wait, do I have DATABASE_URL in .env.local?
// Usually DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

if (!connectionString) {
    console.error('Missing DATABASE_URL in .env.local')
    // Fallback construct
    // postgres://postgres:postgres@127.0.0.1:54322/postgres
}

async function run() {
    const client = new Client({
        connectionString: connectionString || "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    })

    try {
        await client.connect()
        console.log('Connected to DB')

        const sql = `
        alter table "public"."products" add column if not exists "is_featured" boolean default false;
        create index if not exists "products_is_featured_idx" on "public"."products" ("is_featured");
        `

        await client.query(sql)
        console.log('Migration Applied Successfully')
    } catch (e: any) {
        console.error('Error applying migration:', e.message)
    } finally {
        await client.end()
    }
}

run()
