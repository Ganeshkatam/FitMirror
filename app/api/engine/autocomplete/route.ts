import { NextResponse } from 'next/server'
import { StorefrontService } from '@/lib/service/storefront'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
        return NextResponse.json({ suggestions: [] })
    }

    try {
        const suggestions = await StorefrontService.getSuggestions(query)

        return NextResponse.json({
            suggestions: suggestions.map((s: any) => ({
                text: s.suggestion,
                type: s.type
            }))
        })
    } catch (e) {
        console.error("Autocomplete Error:", e)
        return NextResponse.json({ suggestions: [] })
    }
}
