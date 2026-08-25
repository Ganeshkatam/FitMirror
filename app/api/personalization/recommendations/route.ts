import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PersonalizationService } from '@/lib/service/personalization'
import { normalizeProductMedia } from '@/lib/service/media'

export const dynamic = 'force-dynamic'

/**
 * GET /api/personalization/recommendations
 * Get personalized product recommendations
 * 
 * Query params:
 * - limit: number (default 12)
 * - category: string (optional)
 * - exclude: comma-separated product IDs
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)

        const limit = parseInt(searchParams.get('limit') || '12')
        const category = searchParams.get('category') || undefined
        const exclude = searchParams.get('exclude')?.split(',').filter(Boolean) || []

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            // For anonymous users, return trending/new products
            const { data: products } = await supabase
                .from('products')
                .select('id, name, price, product_media(*), category, color, brand')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(limit)

            return NextResponse.json({
                products: (products || []).map(p => ({
                    ...p,
                    images: normalizeProductMedia(p.product_media)
                })),
                personalized: false,
                type: 'trending'
            })
        }

        // Get personalized recommendations
        const products = await PersonalizationService.getRecommendations(user.id, {
            limit,
            category,
            excludeProductIds: exclude
        })

        // Get user profile for debugging
        const profile = await PersonalizationService.getStyleProfile(user.id)

        return NextResponse.json({
            products,
            personalized: true,
            type: 'for_you',
            profile: {
                categories: profile?.preferredCategories || [],
                colors: profile?.preferredColors || [],
                priceRange: profile?.avgPriceRange
            }
        })

    } catch (error) {
        console.error('Recommendations error:', error)
        return NextResponse.json({ products: [], error: 'Failed to fetch' }, { status: 500 })
    }
}
