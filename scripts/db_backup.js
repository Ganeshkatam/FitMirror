const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function backup() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log("Starting logical backup of products table...");
    
    // Backup products
    const { data: products, error: pErr } = await supabase.from('products').select('*');
    if (pErr) throw pErr;
    fs.writeFileSync('supabase/products_backup.json', JSON.stringify(products, null, 2));
    
    console.log(`Backed up ${products.length} products to supabase/products_backup.json`);
    console.log("Logical backup complete.");
}

backup().catch(console.error);
