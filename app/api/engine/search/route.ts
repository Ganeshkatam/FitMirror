import { NextResponse } from 'next/server'
import { StorefrontService } from '@/lib/service/storefront'
import { detectIntent } from '@/lib/search/intent'

interface SearchRequest {
    query: string
    filters?: any
    store_id?: string
    sort?: string
}

export async function POST(req: Request) {
    try {
        const body = await req.json() as SearchRequest
        const { query, filters, sort } = body

        // 1. Detect Intent (Optional enhancement)
        const intent = detectIntent(query || '')

        // Merge intent filters if needed (logic can be inside StorefrontService or here)
        // For now, let's trust explicit filters + query

        const { results, meta } = await StorefrontService.searchProducts({
            query,
            filters,
            sort
        })

        return NextResponse.json({
            results: results.map((item: any) => ({
                id: item.product_id || item.id,
                name: item.title || item.name || item.title, // Fallback
                category: item.category,
                price: item.price,
                image: item.image,
                discount: 0 // Placeholder
            })),
            meta: {
                ...meta,
                intent
            }
        })

    } catch (e) {
        console.error('Search API Failed:', e)
        return NextResponse.json(
            { error: 'Search failed', details: e instanceof Error ? e.message : 'Unknown' },
            { status: 500 }
        )
    }
}
