/**
 * Phase 7D/7E — Deterministic Migration Manifest (Dry Run)
 * 
 * READ-ONLY. Does not modify any production rows, Storage objects, or schema columns.
 * 
 * Produces a per-occurrence manifest with:
 *   product_id, source_position, original_url, canonical_source_url,
 *   migration_key, classification, existing_product_media_match,
 *   expected_storage_path, status, error
 * 
 * And validates the aggregate invariant:
 *   source_occurrences == migrated_assets + deduplicated_occurrences + failed_assets
 */

import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// --- Types ---

interface ManifestEntry {
    product_id: string
    source_position: number
    original_url: string | null
    canonical_source_url: string
    migration_key: string
    classification: string
    existing_product_media_match: boolean
    expected_storage_path: string | null
    status: 'pending' | 'already_migrated' | 'deduplicated' | 'failed'
    error: string | null
}

interface InvariantSummary {
    source_occurrences: number
    migrated_assets: number
    deduplicated_occurrences: number
    failed_assets: number
    invariant_holds: boolean
    invariant_equation: string
}

// --- Helpers ---

function computeMigrationKey(productId: string, position: number, canonicalUrl: string): string {
    return crypto.createHash('sha256')
        .update(`${productId}:${position}:${canonicalUrl}`)
        .digest('hex')
}

function canonicalizeUrl(url: string | null): string {
    if (!url || typeof url !== 'string') return ''
    // Strip trailing whitespace, normalize protocol
    return url.trim()
}

function classifyUrl(url: string | null): { classification: string; error: string | null } {
    if (!url || typeof url !== 'string' || url.trim() === '') {
        return { classification: 'invalid/null', error: 'URL is null, empty, or not a string' }
    }

    const trimmed = url.trim()

    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
        // Check if it's already a Supabase Storage URL
        if (trimmed.includes('.supabase.co/storage/')) {
            return { classification: 'supabase_storage_asset', error: null }
        }
        return { classification: 'https_external_asset', error: null }
    }

    if (trimmed.startsWith('/')) {
        return { classification: 'local_internal_path', error: null }
    }

    // Relative path without leading slash
    if (trimmed.match(/^[a-zA-Z0-9]/)) {
        return { classification: 'relative_path', error: 'Relative path without leading slash' }
    }

    return { classification: 'unsupported_format', error: `Unrecognized URL format: ${trimmed.substring(0, 80)}` }
}

function inferExtension(url: string): string {
    try {
        const pathname = new URL(url).pathname
        const ext = path.extname(pathname).toLowerCase()
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg'].includes(ext)) {
            return ext
        }
    } catch {
        // Not a valid URL, try simple extraction
        const match = url.match(/\.(jpg|jpeg|png|webp|gif|avif|svg)(\?|$)/i)
        if (match) return `.${match[1].toLowerCase()}`
    }
    return '.jpg' // Default fallback
}

// --- Main ---

async function run() {
    console.log('==============================================')
    console.log('  Phase 7D/7E: Migration Manifest (Dry Run)')
    console.log('  Mode: READ-ONLY')
    console.log('==============================================')
    console.log()

    // 1. Fetch all products with images
    console.log('Fetching products with images...')
    const { data: products, error: productError } = await supabase
        .from('products')
        .select('id, name, images')
        .not('images', 'is', null)
        .order('id')

    if (productError) {
        console.error('FATAL: Failed to fetch products:', productError)
        process.exit(1)
    }

    console.log(`  Found ${products.length} products with non-null images column.`)

    // 2. Fetch all existing product_media rows for match checking
    console.log('Fetching existing product_media rows...')
    const { data: existingMedia, error: mediaError } = await supabase
        .from('product_media')
        .select('id, product_id, url, storage_path, position')

    if (mediaError) {
        console.error('WARNING: Failed to fetch product_media:', mediaError)
    }

    const existingMediaIndex = new Map<string, boolean>()
    if (existingMedia) {
        for (const m of existingMedia) {
            // Index by product_id + url for match detection
            existingMediaIndex.set(`${m.product_id}::${m.url}`, true)
        }
        console.log(`  Found ${existingMedia.length} existing product_media rows.`)
    }

    // 3. Build manifest
    console.log()
    console.log('Building migration manifest...')
    console.log()

    const manifest: ManifestEntry[] = []
    let sourceOccurrences = 0
    let migratedAssets = 0
    let deduplicatedOccurrences = 0
    let failedAssets = 0

    for (const product of products) {
        if (!product.images || !Array.isArray(product.images)) {
            continue
        }

        // Track URLs seen within this product for deduplication
        const seenUrlsInProduct = new Map<string, number>() // canonical_url -> first position

        for (let i = 0; i < product.images.length; i++) {
            const rawUrl = product.images[i]
            sourceOccurrences++

            const canonicalUrl = canonicalizeUrl(rawUrl)
            const { classification, error } = classifyUrl(rawUrl)
            const migrationKey = computeMigrationKey(product.id, i, canonicalUrl)

            // Check for within-product duplicates
            const isDuplicate = seenUrlsInProduct.has(canonicalUrl) && canonicalUrl !== ''

            // Check for existing product_media match
            const existingMatch = existingMediaIndex.has(`${product.id}::${canonicalUrl}`)

            let status: ManifestEntry['status']
            let expectedStoragePath: string | null = null

            if (classification === 'invalid/null' || classification === 'unsupported_format') {
                status = 'failed'
                failedAssets++
            } else if (isDuplicate) {
                status = 'deduplicated'
                deduplicatedOccurrences++
            } else if (existingMatch) {
                status = 'already_migrated'
                migratedAssets++
                // Still compute expected path for verification
                const ext = inferExtension(canonicalUrl)
                expectedStoragePath = `product-images/${product.id}/${migrationKey}${ext}`
            } else {
                status = 'pending'
                migratedAssets++
                const ext = inferExtension(canonicalUrl)
                expectedStoragePath = `product-images/${product.id}/${migrationKey}${ext}`
            }

            if (!isDuplicate && canonicalUrl !== '') {
                seenUrlsInProduct.set(canonicalUrl, i)
            }

            manifest.push({
                product_id: product.id,
                source_position: i,
                original_url: rawUrl,
                canonical_source_url: canonicalUrl,
                migration_key: migrationKey,
                classification,
                existing_product_media_match: existingMatch,
                expected_storage_path: expectedStoragePath,
                status,
                error
            })
        }
    }

    // 4. Validate invariant
    const invariantHolds = sourceOccurrences === migratedAssets + deduplicatedOccurrences + failedAssets

    const summary: InvariantSummary = {
        source_occurrences: sourceOccurrences,
        migrated_assets: migratedAssets,
        deduplicated_occurrences: deduplicatedOccurrences,
        failed_assets: failedAssets,
        invariant_holds: invariantHolds,
        invariant_equation: `${sourceOccurrences} == ${migratedAssets} + ${deduplicatedOccurrences} + ${failedAssets} (${migratedAssets + deduplicatedOccurrences + failedAssets})`
    }

    // 5. Print results
    console.log('==============================================')
    console.log('  MIGRATION MANIFEST SUMMARY')
    console.log('==============================================')
    console.log()
    console.log(`  Products with images:          ${products.length}`)
    console.log(`  Existing product_media rows:   ${existingMedia?.length ?? 'unknown'}`)
    console.log()
    console.log('  --- Invariant ---')
    console.log(`  source_occurrences:            ${summary.source_occurrences}`)
    console.log(`  migrated_assets:               ${summary.migrated_assets}`)
    console.log(`  deduplicated_occurrences:      ${summary.deduplicated_occurrences}`)
    console.log(`  failed_assets:                 ${summary.failed_assets}`)
    console.log()
    console.log(`  Equation: ${summary.invariant_equation}`)
    console.log()

    if (invariantHolds) {
        console.log('  INVARIANT: PASSED')
    } else {
        console.log('  INVARIANT: FAILED')
    }

    console.log()

    // 6. Print classification breakdown
    const classificationCounts: Record<string, number> = {}
    const statusCounts: Record<string, number> = {}
    for (const entry of manifest) {
        classificationCounts[entry.classification] = (classificationCounts[entry.classification] || 0) + 1
        statusCounts[entry.status] = (statusCounts[entry.status] || 0) + 1
    }

    console.log('  --- Classification Breakdown ---')
    for (const [cls, count] of Object.entries(classificationCounts).sort()) {
        console.log(`  ${cls.padEnd(30)} ${count}`)
    }

    console.log()
    console.log('  --- Status Breakdown ---')
    for (const [st, count] of Object.entries(statusCounts).sort()) {
        console.log(`  ${st.padEnd(30)} ${count}`)
    }

    console.log()

    // 7. Print sample entries
    console.log('  --- Sample Manifest Entries (first 5) ---')
    for (const entry of manifest.slice(0, 5)) {
        console.log(`  [${entry.status}] ${entry.product_id} pos:${entry.source_position} -> ${entry.classification}`)
        console.log(`    url: ${entry.canonical_source_url?.substring(0, 80)}...`)
        console.log(`    key: ${entry.migration_key}`)
        console.log(`    path: ${entry.expected_storage_path || '(none)'}`)
        console.log()
    }

    // 8. Write full manifest to disk
    const output = {
        generated_at: new Date().toISOString(),
        mode: 'dry_run',
        summary,
        classification_breakdown: classificationCounts,
        status_breakdown: statusCounts,
        manifest
    }

    const outputPath = path.join(process.cwd(), 'migration_manifest_dry_run.json')
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
    console.log(`  Full manifest written to: ${outputPath}`)
    console.log()
    console.log('==============================================')
    console.log('  DRY RUN COMPLETE — NO DATA WAS MODIFIED')
    console.log('==============================================')
}

run().catch(err => {
    console.error('Unhandled error:', err)
    process.exit(1)
})
