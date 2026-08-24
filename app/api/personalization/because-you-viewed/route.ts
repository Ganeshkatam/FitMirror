import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PersonalizationService } from '@/lib/service/personalization'

export const dynamic = 'force-dynamic'

/**
 * GET /api/personalization/because-you-viewed
 * Query params: productId
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')

        if (!productId) {
            return NextResponse.json({ products: [] })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Even anonymous users can see "Because You Viewed" based on the current item
        // But if logged in, we might pass userId for future advanced logic
        const products = await PersonalizationService.getBecauseYouViewed(
            user?.id || 'anon',
            productId
        )

        return NextResponse.json({
            products,
            type: 'similar'
        })
    } catch (error) {
        console.error('Because You Viewed error:', error)
        return NextResponse.json({ products: [], error: 'Failed' }, { status: 500 })
    }
}
