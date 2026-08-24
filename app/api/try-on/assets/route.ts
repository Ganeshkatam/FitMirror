import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/tryon/assets
 * Fetch multiple garment assets by product IDs (batch)
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { productIds } = await request.json()

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json(
                { error: 'productIds array required' },
                { status: 400 }
            )
        }

        // Limit batch size
        const limitedIds = productIds.slice(0, 50)

        const { data, error } = await supabase
            .from('garment_assets')
            .select('*')
            .in('product_id', limitedIds)
            .eq('status', 'approved')

        if (error) throw error

        // Transform to frontend format
        const assets = (data || []).map(item => ({
            id: item.id,
            productId: item.product_id,
            assetUrl: item.asset_url,
            assetType: item.asset_type,
            layerIndex: item.layer_index,
            category: item.category,
            anchorPoints: item.anchor_points || {},
            scaleRules: item.scale_rules || {},
            thumbnailUrl: item.thumbnail_url
        }))

        return NextResponse.json(assets)

    } catch (error) {
        console.error('Failed to fetch garment assets:', error)
        return NextResponse.json(
            { error: 'Failed to fetch assets' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/tryon/assets?category=tops
 * Fetch all assets by category
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')

        let query = supabase
            .from('garment_assets')
            .select(`
                *,
                product:products(id, name, price, images)
            `)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(100)

        if (category) {
            query = query.eq('category', category)
        }

        const { data, error } = await query

        if (error) throw error

        // Transform with product data
        const assets = (data || []).map(item => ({
            id: item.id,
            productId: item.product_id,
            assetUrl: item.asset_url,
            assetType: item.asset_type,
            layerIndex: item.layer_index,
            category: item.category,
            anchorPoints: item.anchor_points || {},
            scaleRules: item.scale_rules || {},
            thumbnailUrl: item.thumbnail_url,
            product: item.product ? {
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                image: item.product.images?.[0]
            } : null
        }))

        return NextResponse.json(assets)

    } catch (error) {
        console.error('Failed to fetch garment assets:', error)
        return NextResponse.json(
            { error: 'Failed to fetch assets' },
            { status: 500 }
        )
    }
}
