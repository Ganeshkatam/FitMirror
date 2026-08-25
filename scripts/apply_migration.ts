/**
 * Apply migration via Supabase Management API SQL endpoint.
 * This uses the /pg endpoint with the service role key.
 */

import * as fs from 'fs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function executeSql(sql: string): Promise<{ success: boolean; error?: string; data?: any }> {
    // Try the Supabase SQL RPC endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({ sql_text: sql })
    })

    if (response.ok) {
        return { success: true, data: await response.json() }
    }

    // If exec_sql doesn't exist, try creating it first
    return { success: false, error: `${response.status}: ${await response.text()}` }
}

async function run() {
    console.log('==============================================')
    console.log('  Apply Schema Migration via SQL')
    console.log('==============================================')
    console.log()

    // First, try to create the exec_sql function if it doesn't exist
    // We'll use the Supabase SQL editor approach instead
    // The most reliable way is to use the Supabase Management API

    // Extract project ref from URL
    const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')
    console.log(`Project ref: ${projectRef}`)

    // Read migration SQL
    const sqlPath = 'supabase/migrations/20260825064900_add_product_media_migration_metadata.sql'
    const fullSql = fs.readFileSync(sqlPath, 'utf-8')

    // Split into executable statements (strip comments)
    const statements = fullSql
        .replace(/--[^\n]*/g, '') // Remove single-line comments
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 10) // Filter out empty/tiny fragments

    console.log(`Found ${statements.length} SQL statements to execute.`)
    console.log()

    // Execute each statement via the PostgREST rpc or direct fetch
    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i]
        console.log(`[${i + 1}/${statements.length}] ${stmt.substring(0, 100).replace(/\n/g, ' ')}...`)

        // Use the Supabase REST API to call a pg function
        // Since we can't run raw SQL via REST, we need to use the supabase CLI or dashboard
        // Let's try using the pg-meta endpoint
        const pgMetaResponse = await fetch(`${SUPABASE_URL}/pg-meta/default/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'x-connection-encrypted': 'false'
            },
            body: JSON.stringify({ query: stmt })
        })

        if (pgMetaResponse.ok) {
            const result = await pgMetaResponse.json()
            console.log(`  OK`)
        } else {
            const errText = await pgMetaResponse.text()
            console.log(`  Status: ${pgMetaResponse.status}`)
            console.log(`  Response: ${errText.substring(0, 200)}`)
        }
    }

    console.log()

    // Verify
    console.log('Verifying schema...')
    const verifyResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/product_media?select=source_hash,source_position,source_url,content_type,migrated_at&limit=0`,
        {
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`
            }
        }
    )

    if (verifyResponse.ok) {
        console.log('  SCHEMA VERIFICATION: PASSED')
        console.log('  All 5 new columns are accessible via REST API.')
    } else {
        const errText = await verifyResponse.text()
        console.log(`  SCHEMA VERIFICATION: FAILED`)
        console.log(`  ${errText.substring(0, 300)}`)
        console.log()
        console.log('  The migration must be applied manually via the Supabase SQL Editor.')
        console.log('  Open: https://supabase.com/dashboard/project/' + projectRef + '/sql')
        console.log('  Paste and execute the SQL from:')
        console.log(`  ${sqlPath}`)
    }

    console.log()
    console.log('==============================================')
}

run().catch(err => {
    console.error('Unhandled error:', err)
    process.exit(1)
})
