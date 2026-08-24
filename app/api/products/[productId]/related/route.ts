import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/products/[productId]/related
 * Get related products for "Complete the Look" feature
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ productId: string }> }
) {
    try {
        const supabase = await createClient()
        const { productId } = await context.params

        // Try to use the RPC function first
        const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_complete_look', {
                p_product_id: productId,
                p_limit: 4
            })

        if (!rpcError && rpcData && rpcData.length > 0) {
            // RPC function exists and returned data
            const related = rpcData.map((item: any) => ({
                productId: item.product_id,
                name: item.name,
                price: item.price,
                imageUrl: item.image_url,
                category: item.category,
                relationType: item.relation_type
            }))

            return NextResponse.json(related)
        }

        // Fallback: Query product_relations directly
        const { data: relations, error: relError } = await supabase
            .from('product_relations')
            .select(`
                related_product_id,
                relation_type,
                product:products!product_relations_related_product_id_fkey(
                    id,
                    name,
                    price,
                    images,
                    category
                )
            `)
            .eq('product_id', productId)
            .in('relation_type', ['matches', 'complete_the_look'])
            .order('confidence', { ascending: false })
            .limit(4)

        if (relError) {
            // If product_relations doesn't exist, return empty
            if (relError.code === '42P01') { // Table not found
                return NextResponse.json([])
            }
            throw relError
        }

        if (!relations || relations.length === 0) {
            // No relations found - try to get products from same category
            const { data: currentProduct } = await supabase
                .from('products')
                .select('category')
                .eq('id', productId)
                .single()

            if (currentProduct) {
                const { data: similar } = await supabase
                    .from('products')
                    .select('id, name, price, images, category')
                    .eq('category', getComplementaryCategory(currentProduct.category))
                    .eq('is_active', true)
                    .neq('id', productId)
                    .limit(4)

                if (similar) {
                    const fallback = similar.map((p: any) => ({
                        productId: p.id,
                        name: p.name,
                        price: p.price,
                        imageUrl: p.images?.[0] || null,
                        category: p.category,
                        relationType: 'similar_style'
                    }))

                    return NextResponse.json(fallback)
                }
            }

            return NextResponse.json([])
        }

        // Transform relations data
        const related = relations
            .filter((r: any) => r.product)
            .map((r: any) => ({
                productId: r.product.id,
                name: r.product.name,
                price: r.product.price,
                imageUrl: r.product.images?.[0] || null,
                category: r.product.category,
                relationType: r.relation_type
            }))

        return NextResponse.json(related)

    } catch (error) {
        console.error('Failed to fetch related products:', error)
        return NextResponse.json([])
    }
}

/**
 * Get complementary category for outfit suggestions
 */
function getComplementaryCategory(category: string): string {
    const categoryMap: Record<string, string> = {
        'tops': 'bottoms',
        'bottoms': 'tops',
        't-shirts': 'jeans',
        'jeans': 't-shirts',
        'shirts': 'pants',
        'pants': 'shirts',
        'dresses': 'accessories',
        'skirts': 'tops',
        'jackets': 'tops'
    }

    return categoryMap[category.toLowerCase()] || 'accessories'
}
