import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Standard Engine Interface
interface TryOnApplyRequest {
    product_id: string
    avatar_id?: string
    store_id?: string // Client might send, or we fetch
}

export async function POST(req: Request) {
    try {
        const body = await req.json() as TryOnApplyRequest
        const { product_id, avatar_id } = body

        if (!product_id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 })

        const supabase = await createClient()

        // 1. Fetch Product & Garment Asset
        // We join products with garment_assets to get the latest correct asset
        const { data: garment, error } = await supabase
            .from('garment_assets')
            .select('*')
            .eq('product_id', product_id)
            .single()

        if (error || !garment) {
            return NextResponse.json({ error: 'Try-on asset not found for this product' }, { status: 404 })
        }

        // 2. Fetch User Avatar (if provided)
        let avatarData = null
        if (avatar_id) {
            const { data: avatar } = await supabase
                .from('user_avatars')
                .select('body_data')
                .eq('id', avatar_id)
                .single()
            avatarData = avatar?.body_data
        }

        // 3. Log Analytics (Async - Fire & Forget)
        // We don't await this to keep latency low
        try {
            const { error: logError } = await supabase
                .from('tryon_events')
                .insert({
                    store_id: garment.store_id || '00000000-0000-0000-0000-000000000000', // Fallback or fetched
                    product_id: product_id,
                    garment_layer: garment.layer_index
                })
            if (logError) console.error('Analytics Log Failed', logError)
        } catch (logEx) {
            console.error('Analytics Log Exception', logEx)
        }

        // 4. Construct Render Payload
        // This is what the Client-Side Renderer needs
        return NextResponse.json({
            render_type: 'client',
            asset: {
                url: garment.asset_url,
                type: garment.asset_type,
                layer: garment.layer_index,
                anchors: garment.config.anchors,
                scale_rules: garment.config.scale_rules
            },
            body_context: avatarData
        })

    } catch (e) {
        console.error('Try-On Engine Error:', e)
        return NextResponse.json(
            { error: 'Try-On Apply failed' },
            { status: 500 }
        )
    }
}
