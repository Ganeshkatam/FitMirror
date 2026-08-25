import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyStorageInvariant() {
    console.log("=== Phase 7H: Storage Invariant Verification ===")
    
    const { data: rows, error: countError } = await supabase
        .from('product_media')
        .select('id, product_id, storage_path, migrated_at')
        .eq('media_type', 'image')
        
    if (countError) throw countError;
    
    const total = rows.length;
    const with_storage_path = rows.filter(r => r.storage_path !== null).length;
    const migrated = rows.filter(r => r.migrated_at !== null).length;
    
    console.log(`total = ${total}`);
    console.log(`with_storage_path = ${with_storage_path}`);
    console.log(`migrated = ${migrated}`);
    
    // Verify Storage Objects
    console.log("\nVerifying Storage Objects exist...");
    
    let missingCount = 0;
    
    for (const r of rows) {
        if (!r.storage_path) continue;
        
        const folder = r.product_id;
        const filename = r.storage_path.split('/').pop()!;
        
        const { data: files, error: listError } = await supabase.storage.from('product-images').list(folder);
        
        if (listError || !files || !files.some(f => f.name === filename)) {
            console.error(`MISSING IN STORAGE: ${r.storage_path}`);
            missingCount++;
        }
    }
    
    console.log(`Storage objects verified. Missing: ${missingCount}`);
    
    return { total, with_storage_path, migrated, missingCount };
}

verifyStorageInvariant().catch(console.error)
