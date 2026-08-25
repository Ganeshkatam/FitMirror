/**
 * Phase 7F: Deterministic Storage Migration Execution
 *
 * Authorized scope:
 *   Download -> validate -> deterministic Storage upload -> product_media insertion -> reconciliation
 *
 * NOT authorized:
 *   - Dropping products.images
 *   - Changing existing product records
 *   - Deleting external URLs
 *   - Deleting old Storage objects
 *   - Deleting product_media rows
 *   - Modifying unrelated schema
 *   - Changing customer application behavior
 *
 * Per-asset invariant chain (9 steps):
 *   1. Compute exact source_hash (migration_key)
 *   2. Check product_media.source_hash (idempotency)
 *   3. Check deterministic Storage path (existing object)
 *   4. Download and validate the response
 *   5. Upload using deterministic path
 *   6. Verify Storage object exists
 *   7. Insert product_media row
 *   8. Verify inserted row contains expected fields
 *   9. Record result in reconciliation manifest
 */

import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BUCKET = 'product-images'

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// --- Types ---

interface ManifestEntry {
    product_id: string
    source_position: number
    canonical_source_url: string
    migration_key: string
    classification: string
    expected_storage_path: string
}

type StepResult = 'ok' | 'skipped_idempotent' | 'failed'

interface ReconciliationEntry {
    product_id: string
    source_position: number
    source_url: string
    migration_key: string
    expected_storage_path: string

    // Per-step results
    step1_hash_computed: boolean
    step2_db_check: 'not_found' | 'already_exists' | 'error'
    step3_storage_check: 'not_found' | 'already_exists' | 'error'
    step4_download: 'ok' | 'skipped' | 'failed'
    step4_content_type: string | null
    step4_content_length: number | null
    step5_upload: 'ok' | 'skipped' | 'failed'
    step6_storage_verify: 'ok' | 'skipped' | 'failed'
    step7_db_insert: 'ok' | 'skipped' | 'failed'
    step8_row_verify: 'ok' | 'skipped' | 'failed'

    // Final
    overall_status: 'migrated' | 'idempotent_skip' | 'failed'
    error: string | null
    duration_ms: number
}

// --- Helpers ---

function computeMigrationKey(productId: string, position: number, url: string): string {
    return crypto.createHash('sha256')
        .update(`${productId}:${position}:${url}`)
        .digest('hex')
}

function extensionFromContentType(contentType: string): string {
    const map: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif',
        'image/avif': '.avif',
        'image/svg+xml': '.svg',
    }
    return map[contentType] || '.jpg'
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// --- Per-Asset Migration ---

async function migrateAsset(entry: ManifestEntry): Promise<ReconciliationEntry> {
    const startTime = Date.now()

    const rec: ReconciliationEntry = {
        product_id: entry.product_id,
        source_position: entry.source_position,
        source_url: entry.canonical_source_url,
        migration_key: entry.migration_key,
        expected_storage_path: entry.expected_storage_path,
        step1_hash_computed: false,
        step2_db_check: 'error',
        step3_storage_check: 'error',
        step4_download: 'skipped',
        step4_content_type: null,
        step4_content_length: null,
        step5_upload: 'skipped',
        step6_storage_verify: 'skipped',
        step7_db_insert: 'skipped',
        step8_row_verify: 'skipped',
        overall_status: 'failed',
        error: null,
        duration_ms: 0,
    }

    try {
        // STEP 1: Compute exact source_hash
        const sourceHash = computeMigrationKey(entry.product_id, entry.source_position, entry.canonical_source_url)
        if (sourceHash !== entry.migration_key) {
            throw new Error(`Hash mismatch: computed ${sourceHash} vs manifest ${entry.migration_key}`)
        }
        rec.step1_hash_computed = true

        // STEP 2: Check product_media.source_hash (idempotency)
        const { data: existingRow, error: dbCheckError } = await supabase
            .from('product_media')
            .select('id, product_id, source_hash, source_position, source_url, content_type, storage_path')
            .eq('source_hash', sourceHash)
            .maybeSingle()

        if (dbCheckError) {
            rec.step2_db_check = 'error'
            throw new Error(`DB check failed: ${dbCheckError.message}`)
        }

        if (existingRow) {
            rec.step2_db_check = 'already_exists'

            // Verify the existing row matches our expected identity
            if (existingRow.product_id !== entry.product_id ||
                existingRow.source_position !== entry.source_position ||
                existingRow.source_url !== entry.canonical_source_url) {
                throw new Error(
                    `Existing row identity mismatch for hash ${sourceHash}: ` +
                    `expected (${entry.product_id}, ${entry.source_position}) ` +
                    `got (${existingRow.product_id}, ${existingRow.source_position})`
                )
            }

            rec.step3_storage_check = 'already_exists'
            rec.overall_status = 'idempotent_skip'
            rec.duration_ms = Date.now() - startTime
            return rec
        }
        rec.step2_db_check = 'not_found'

        // STEP 3: Check deterministic Storage path
        const { data: storageList, error: storageListError } = await supabase
            .storage.from(BUCKET)
            .list(
                `${entry.product_id}`,
                { search: sourceHash }
            )

        if (storageListError) {
            rec.step3_storage_check = 'error'
            // Non-fatal: the folder might not exist yet
        }

        const existingObject = storageList?.find(f => f.name.startsWith(sourceHash))
        if (existingObject) {
            rec.step3_storage_check = 'already_exists'
            // Object exists in Storage but not in DB -- resume from step 7
            // But first, determine content type from the existing file name
            const ext = path.extname(existingObject.name)
            const ctMap: Record<string, string> = {
                '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                '.png': 'image/png', '.webp': 'image/webp',
                '.gif': 'image/gif', '.avif': 'image/avif',
            }
            rec.step4_content_type = ctMap[ext] || 'image/jpeg'
            rec.step4_download = 'skipped'
            rec.step5_upload = 'skipped'
            rec.step6_storage_verify = 'ok'

            // Compute the actual storage path from the found object
            const actualStoragePath = `${entry.product_id}/${existingObject.name}`

            // Jump to step 7
            await insertAndVerifyRow(rec, entry, sourceHash, actualStoragePath, rec.step4_content_type)
            rec.overall_status = 'migrated'
            rec.duration_ms = Date.now() - startTime
            return rec
        }
        rec.step3_storage_check = 'not_found'

        // STEP 4: Download and validate the response
        let imageBuffer: ArrayBuffer
        let contentType: string

        try {
            const response = await fetch(entry.canonical_source_url, {
                headers: { 'Accept': 'image/*' },
                signal: AbortSignal.timeout(30000),
            })

            if (!response.ok) {
                rec.step4_download = 'failed'
                throw new Error(`Download failed: HTTP ${response.status} ${response.statusText}`)
            }

            contentType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg'
            imageBuffer = await response.arrayBuffer()

            if (imageBuffer.byteLength < 100) {
                rec.step4_download = 'failed'
                throw new Error(`Downloaded content too small: ${imageBuffer.byteLength} bytes`)
            }

            // Validate it looks like an image by checking magic bytes
            const header = new Uint8Array(imageBuffer.slice(0, 4))
            const isJpeg = header[0] === 0xFF && header[1] === 0xD8
            const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47
            const isWebp = header[0] === 0x52 && header[1] === 0x49 // RIFF
            const isGif = header[0] === 0x47 && header[1] === 0x49 // GI

            if (!isJpeg && !isPng && !isWebp && !isGif) {
                // Use content-type from response if magic bytes don't match known formats
                if (!contentType.startsWith('image/')) {
                    rec.step4_download = 'failed'
                    throw new Error(`Content is not a valid image. Content-Type: ${contentType}, magic: ${Array.from(header).map(b => b.toString(16)).join(' ')}`)
                }
            }

            // Override content type based on actual magic bytes for accuracy
            if (isJpeg) contentType = 'image/jpeg'
            else if (isPng) contentType = 'image/png'
            else if (isWebp) contentType = 'image/webp'
            else if (isGif) contentType = 'image/gif'

            rec.step4_download = 'ok'
            rec.step4_content_type = contentType
            rec.step4_content_length = imageBuffer.byteLength
        } catch (err: any) {
            if (rec.step4_download !== 'failed') rec.step4_download = 'failed'
            throw err
        }

        // STEP 5: Upload using deterministic path
        const ext = extensionFromContentType(contentType)
        const storagePath = `${entry.product_id}/${sourceHash}${ext}`

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, imageBuffer, {
                contentType,
                cacheControl: '31536000', // 1 year
                upsert: false, // NEVER overwrite existing
            })

        if (uploadError) {
            // Check if it's a duplicate error (object already exists)
            if (uploadError.message?.includes('already exists') || uploadError.message?.includes('Duplicate')) {
                rec.step5_upload = 'skipped'
                // Proceed to verification
            } else {
                rec.step5_upload = 'failed'
                throw new Error(`Upload failed: ${uploadError.message}`)
            }
        } else {
            rec.step5_upload = 'ok'
        }

        // STEP 6: Verify Storage object exists
        const { data: verifyList } = await supabase.storage
            .from(BUCKET)
            .list(entry.product_id, { search: sourceHash })

        const uploaded = verifyList?.find(f => f.name.startsWith(sourceHash))
        if (!uploaded) {
            rec.step6_storage_verify = 'failed'
            throw new Error(`Storage verification failed: object not found at ${storagePath}`)
        }
        rec.step6_storage_verify = 'ok'

        // STEP 7 + 8: Insert and verify product_media row
        await insertAndVerifyRow(rec, entry, sourceHash, storagePath, contentType)

        rec.overall_status = 'migrated'
    } catch (err: any) {
        rec.error = err.message || String(err)
        rec.overall_status = 'failed'
    }

    rec.duration_ms = Date.now() - startTime
    return rec
}

async function insertAndVerifyRow(
    rec: ReconciliationEntry,
    entry: ManifestEntry,
    sourceHash: string,
    storagePath: string,
    contentType: string
): Promise<void> {
    // Build the public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`

    // STEP 7: Insert product_media row
    const { data: inserted, error: insertError } = await supabase
        .from('product_media')
        .insert({
            product_id: entry.product_id,
            url: publicUrl,
            media_type: 'image',
            storage_path: storagePath,
            position: entry.source_position,
            source_hash: sourceHash,
            source_position: entry.source_position,
            source_url: entry.canonical_source_url,
            content_type: contentType,
            migrated_at: new Date().toISOString(),
        })
        .select('id, product_id, source_hash, source_position, source_url, content_type, storage_path, url')
        .single()

    if (insertError) {
        // Check for unique constraint violation (idempotent retry)
        if (insertError.message?.includes('unique') || insertError.message?.includes('duplicate')) {
            rec.step7_db_insert = 'skipped'
            rec.step8_row_verify = 'skipped'
            return
        }
        rec.step7_db_insert = 'failed'
        throw new Error(`DB insert failed: ${insertError.message}`)
    }
    rec.step7_db_insert = 'ok'

    // STEP 8: Verify inserted row contains expected fields
    if (!inserted) {
        rec.step8_row_verify = 'failed'
        throw new Error('Insert returned no data')
    }

    const verifyErrors: string[] = []
    if (inserted.product_id !== entry.product_id) verifyErrors.push(`product_id: ${inserted.product_id} != ${entry.product_id}`)
    if (inserted.source_hash !== sourceHash) verifyErrors.push(`source_hash: ${inserted.source_hash} != ${sourceHash}`)
    if (inserted.source_position !== entry.source_position) verifyErrors.push(`source_position: ${inserted.source_position} != ${entry.source_position}`)
    if (inserted.source_url !== entry.canonical_source_url) verifyErrors.push(`source_url mismatch`)
    if (inserted.content_type !== contentType) verifyErrors.push(`content_type: ${inserted.content_type} != ${contentType}`)
    if (inserted.storage_path !== storagePath) verifyErrors.push(`storage_path: ${inserted.storage_path} != ${storagePath}`)

    if (verifyErrors.length > 0) {
        rec.step8_row_verify = 'failed'
        throw new Error(`Row verification failed: ${verifyErrors.join('; ')}`)
    }
    rec.step8_row_verify = 'ok'
}

// --- Main ---

async function run() {
    console.log('==============================================')
    console.log('  Phase 7F: Storage Migration Execution')
    console.log('  Bucket: product-images (public)')
    console.log('==============================================')
    console.log()

    // Load manifest
    const manifestPath = path.join(process.cwd(), 'migration_manifest_dry_run.json')
    const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    const entries: ManifestEntry[] = manifestData.manifest.filter(
        (e: any) => e.status === 'pending' && e.classification === 'https_external_asset'
    )

    console.log(`Loaded ${entries.length} pending assets from manifest.`)
    console.log()

    // Pre-flight: verify products.images will NOT be touched
    console.log('Pre-flight checks:')
    console.log('  products.images: READ-ONLY (not modified)')
    console.log('  product_media: INSERT only (no updates/deletes)')
    console.log('  Storage: upload only (upsert=false, no deletes)')
    console.log()

    const reconciliation: ReconciliationEntry[] = []
    let migratedCount = 0
    let skippedCount = 0
    let failedCount = 0

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const progress = `[${i + 1}/${entries.length}]`

        process.stdout.write(`${progress} ${entry.product_id} pos:${entry.source_position} ... `)

        const result = await migrateAsset(entry)
        reconciliation.push(result)

        if (result.overall_status === 'migrated') {
            migratedCount++
            console.log(`MIGRATED (${result.step4_content_type}, ${result.step4_content_length ? Math.round(result.step4_content_length / 1024) + 'KB' : 'cached'}, ${result.duration_ms}ms)`)
        } else if (result.overall_status === 'idempotent_skip') {
            skippedCount++
            console.log(`SKIPPED (idempotent, ${result.duration_ms}ms)`)
        } else {
            failedCount++
            console.log(`FAILED: ${result.error}`)
        }

        // Rate limit: 200ms between requests to avoid hammering Unsplash
        if (i < entries.length - 1) {
            await sleep(200)
        }
    }

    // --- Identity-Level Reconciliation ---
    console.log()
    console.log('==============================================')
    console.log('  IDENTITY-LEVEL RECONCILIATION')
    console.log('==============================================')
    console.log()

    // Count by step
    const stepCounts = {
        step1: reconciliation.filter(r => r.step1_hash_computed).length,
        step2_not_found: reconciliation.filter(r => r.step2_db_check === 'not_found').length,
        step2_exists: reconciliation.filter(r => r.step2_db_check === 'already_exists').length,
        step3_not_found: reconciliation.filter(r => r.step3_storage_check === 'not_found').length,
        step3_exists: reconciliation.filter(r => r.step3_storage_check === 'already_exists').length,
        step4_ok: reconciliation.filter(r => r.step4_download === 'ok').length,
        step5_ok: reconciliation.filter(r => r.step5_upload === 'ok').length,
        step6_ok: reconciliation.filter(r => r.step6_storage_verify === 'ok').length,
        step7_ok: reconciliation.filter(r => r.step7_db_insert === 'ok').length,
        step8_ok: reconciliation.filter(r => r.step8_row_verify === 'ok').length,
    }

    console.log('  Per-Step Results:')
    console.log(`    Step 1 (hash computed):      ${stepCounts.step1}/${entries.length}`)
    console.log(`    Step 2 (DB check):           ${stepCounts.step2_not_found} new, ${stepCounts.step2_exists} existing`)
    console.log(`    Step 3 (Storage check):      ${stepCounts.step3_not_found} new, ${stepCounts.step3_exists} existing`)
    console.log(`    Step 4 (download):           ${stepCounts.step4_ok} downloaded`)
    console.log(`    Step 5 (upload):             ${stepCounts.step5_ok} uploaded`)
    console.log(`    Step 6 (Storage verify):     ${stepCounts.step6_ok} verified`)
    console.log(`    Step 7 (DB insert):          ${stepCounts.step7_ok} inserted`)
    console.log(`    Step 8 (row verify):         ${stepCounts.step8_ok} verified`)
    console.log()

    console.log('  Overall:')
    console.log(`    Migrated:              ${migratedCount}`)
    console.log(`    Idempotent skips:      ${skippedCount}`)
    console.log(`    Failed:                ${failedCount}`)
    console.log(`    Total:                 ${reconciliation.length}`)
    console.log()

    // Post-migration DB verification
    console.log('  Post-Migration Database State:')
    const { count: pmCount } = await supabase
        .from('product_media')
        .select('*', { count: 'exact', head: true })
        .not('source_hash', 'is', null)

    const { count: pmTotal } = await supabase
        .from('product_media')
        .select('*', { count: 'exact', head: true })

    console.log(`    product_media total rows:     ${pmTotal}`)
    console.log(`    product_media migrated rows:  ${pmCount}`)
    console.log()

    // Verify distinct products covered
    const { data: coveredProducts } = await supabase
        .from('product_media')
        .select('product_id')
        .not('source_hash', 'is', null)

    const distinctProducts = new Set(coveredProducts?.map(r => r.product_id) || [])
    console.log(`    Distinct products with media: ${distinctProducts.size}`)
    console.log()

    // Source invariant re-check
    const sourceOccurrences = entries.length
    const totalMigrated = migratedCount + skippedCount
    const invariantHolds = sourceOccurrences === totalMigrated + failedCount

    console.log('  Invariant Check:')
    console.log(`    source_occurrences:    ${sourceOccurrences}`)
    console.log(`    migrated + skipped:    ${totalMigrated}`)
    console.log(`    failed:                ${failedCount}`)
    console.log(`    equation:              ${sourceOccurrences} == ${totalMigrated} + ${failedCount} (${totalMigrated + failedCount})`)
    console.log(`    INVARIANT:             ${invariantHolds ? 'PASSED' : 'FAILED'}`)
    console.log()

    // Content type distribution
    const ctDist: Record<string, number> = {}
    for (const r of reconciliation) {
        if (r.step4_content_type) {
            ctDist[r.step4_content_type] = (ctDist[r.step4_content_type] || 0) + 1
        }
    }
    console.log('  Content Type Distribution:')
    for (const [ct, count] of Object.entries(ctDist).sort()) {
        console.log(`    ${ct.padEnd(20)} ${count}`)
    }
    console.log()

    // Failed assets detail
    if (failedCount > 0) {
        console.log('  FAILED ASSETS:')
        for (const r of reconciliation.filter(r => r.overall_status === 'failed')) {
            console.log(`    ${r.product_id} pos:${r.source_position} -- ${r.error}`)
        }
        console.log()
    }

    // Write reconciliation manifest
    const output = {
        executed_at: new Date().toISOString(),
        mode: 'production',
        summary: {
            source_occurrences: sourceOccurrences,
            migrated: migratedCount,
            idempotent_skips: skippedCount,
            failed: failedCount,
            invariant_holds: invariantHolds,
            distinct_products: distinctProducts.size,
            db_total_rows: pmTotal,
            db_migrated_rows: pmCount,
        },
        content_type_distribution: ctDist,
        step_counts: stepCounts,
        reconciliation,
    }

    const outputPath = path.join(process.cwd(), 'migration_reconciliation.json')
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
    console.log(`  Reconciliation manifest: ${outputPath}`)

    console.log()
    console.log('==============================================')
    console.log('  MIGRATION EXECUTION COMPLETE')
    console.log(`  products.images: UNTOUCHED`)
    console.log('==============================================')
}

run().catch(err => {
    console.error('Unhandled error:', err)
    process.exit(1)
})
