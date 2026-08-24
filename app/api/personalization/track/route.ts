import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/personalization/track
 * Track user interactions for personalization
 * 
 * Body: { type: 'view' | 'purchase', productId, category, color?, price }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current user (optional - we track even for anonymous)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            // Return success but don't track for anonymous users
            return NextResponse.json({ success: true, tracked: false })
        }

        const body = await request.json()
        const { type, productId, category, color, price } = body

        if (!productId || !category) {
            return NextResponse.json(
                { error: 'productId and category required' },
                { status: 400 }
            )
        }

        // Import dynamically to avoid issues
        const { PersonalizationService } = await import('@/lib/service/personalization')

        if (type === 'view') {
            await PersonalizationService.trackProductView(user.id, {
                productId,
                category,
                color,
                price: price || 0
            })
        } else if (type === 'purchase') {
            await PersonalizationService.trackPurchase(user.id, [
                { productId, category, color, price: price || 0 }
            ])
        }

        return NextResponse.json({ success: true, tracked: true })

    } catch (error) {
        console.error('Tracking error:', error)
        // Don't fail requests on tracking errors
        return NextResponse.json({ success: true, tracked: false })
    }
}
