import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/tryon/assets/[productId]
 * Fetch garment asset for a single product
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ productId: string }> }
) {
    try {
        const supabase = await createClient()
        const { productId } = await context.params

        const { data, error } = await supabase
            .from('garment_assets')
            .select('*')
            .eq('product_id', productId)
            .eq('status', 'approved')
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // No asset found - return null (product may not have try-on asset)
                return NextResponse.json(null, { status: 404 })
            }
            throw error
        }

        // Transform to frontend format
        const asset = {
            id: data.id,
            productId: data.product_id,
            assetUrl: data.asset_url,
            assetType: data.asset_type,
            layerIndex: data.layer_index,
            category: data.category,
            anchorPoints: data.anchor_points || {},
            scaleRules: data.scale_rules || {},
            thumbnailUrl: data.thumbnail_url
        }

        return NextResponse.json(asset)

    } catch (error) {
        console.error('Failed to fetch garment asset:', error)
        return NextResponse.json(
            { error: 'Failed to fetch asset' },
            { status: 500 }
        )
    }
}
