import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function runDbScan() {
    console.log("=== Phase 7H: DB Dependency Scan ===")
    
    // We can't query pg_catalog directly with PostgREST in Supabase standard setups
    // unless we have an RPC function or execute_sql.
    // Let's try to query pg_catalog using an RPC or standard view.
    // If not, we will output instructions to run in SQL Editor.
    
    // Attempting a direct fetch from information_schema (which is exposed sometimes)
    try {
        const { data: routines, error } = await supabase.from('information_schema.routines')
            .select('routine_name, routine_definition')
            .not('routine_definition', 'is', null)
        
        if (error) throw error;
        
        const violations = routines.filter(r => 
            r.routine_definition.includes('products.images') || 
            r.routine_definition.includes('images') // generic check
        );
        
        console.log(`Found ${violations.length} routines with 'images'`);
        violations.forEach(v => console.log(` - ${v.routine_name}`));
    } catch (e) {
        console.log("Could not access information_schema via API. Will generate SQL for direct execution.");
    }
}

runDbScan().catch(console.error)
