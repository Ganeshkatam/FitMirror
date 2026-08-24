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

async function splitVariants() {
    const productName = 'Denim Jacket'
    console.log(`Splitting variants for: ${productName}`)

    // 1. Get the parent product
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('name', productName)

    if (!products || products.length === 0) {
        console.error('Product not found')
        return
    }

    // Use the first matches as the "Base"
    const baseProduct = products[0]
    console.log(`Base Product ID: ${baseProduct.id}`)

    // 2. Get inventory to find colors
    const { data: inventory } = await supabase
        .from('product_inventory')
        .select('*')
        .eq('product_id', baseProduct.id)

    if (!inventory || inventory.length === 0) {
        console.error('No inventory found')
        return
    }

    const uniqueColors = [...new Set(inventory.map((i: any) => i.color).filter(Boolean))] as string[]
    console.log('Found colors:', uniqueColors)

    if (uniqueColors.length < 2) {
        console.log('Not enough colors to split.')
        // Even if 1 color, maybe we should ensure product.color is set?
        if (uniqueColors.length === 1 && !baseProduct.color) {
            console.log(`Updating base product color to ${uniqueColors[0]}`)
            await supabase.from('products').update({ color: uniqueColors[0] }).eq('id', baseProduct.id)
        }
        return
    }

    // 3. Assign one color to Base Product (e.g. first one)
    const baseColor = uniqueColors[0]
    console.log(`Assigning '${baseColor}' to Base Product ${baseProduct.id}`)

    await supabase.from('products')
        .update({ color: baseColor })
        .eq('id', baseProduct.id)

    // 4. Create new products for other colors
    const otherColors = uniqueColors.slice(1)

    for (const color of otherColors) {
        console.log(`Creating sibling product for color: ${color}`)

        // Clone base product details
        const { id, created_at, updated_at, image_url, sku, ...productData } = baseProduct as any

        // Ensure slug is unique
        const newSlug = `${baseProduct.slug}-${color.toLowerCase().replace(/\s+/g, '-')}`
        // Ensure SKU is unique
        const newSku = sku ? `${sku}-${color.toUpperCase()}` : undefined

        const { data: newProduct, error: createError } = await supabase
            .from('products')
            .insert({
                ...productData,
                sku: newSku,
                color: color,
                slug: newSlug
            })
            .select()
            .single()

        if (createError) {
            console.error(`Failed to create product for ${color}:`, createError)
            continue
        }

        console.log(`Created Sibling ID: ${newProduct.id}`)

        // 5. Move inventory items for this color to new product
        const { error: moveError } = await supabase
            .from('product_inventory')
            .update({ product_id: newProduct.id })
            .eq('product_id', baseProduct.id)
            .eq('color', color)

        if (moveError) {
            console.error(`Failed to move inventory for ${color}:`, moveError)
        } else {
            console.log(`Moved inventory for ${color} to ${newProduct.id}`)
        }
    }

    console.log('Split complete!')
}

splitVariants()
