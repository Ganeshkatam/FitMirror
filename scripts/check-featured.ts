import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProducts() {
    // Check total products
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true })
    console.log('Total Products:', count)

    // Check featured
    const { data: featured, error } = await supabase
        .from('products')
        .select('id, name, is_featured, is_active')
        .eq('is_featured', true)

    if (error) console.error('Error:', error)
    else console.log('Featured Products:', featured?.length, featured?.map(p => p.name))

    // Check if we have any active products
    const { data: active } = await supabase
        .from('products')
        .select('id, name')
        .eq('is_active', true)
        .limit(5)

    console.log('Active Products Sample:', active)

    // If no featured, feature some
    if (!featured || featured.length === 0) {
        if (active && active.length > 0) {
            console.log('Marking 5 products as featured...')
            const ids = active.map(p => p.id)
            const { error: updateError } = await supabase
                .from('products')
                .update({ is_featured: true })
                .in('id', ids)

            if (updateError) console.error('Update error:', updateError)
            else console.log('Updated safely.')
        }
    }
}

checkProducts()
