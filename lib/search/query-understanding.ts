import { SearchIntent, SearchSort } from './types'

export class QueryUnderstanding {
    static parse(requestUrl: string): SearchIntent {
        const url = new URL(requestUrl)
        const params = url.searchParams

        const originalQuery = params.get('q') || ''
        const rawSort = params.get('sort') || 'relevance'

        const filters = {
            category: params.get('category') || undefined,
            minPrice: params.get('min') ? parseFloat(params.get('min')!) : undefined,
            maxPrice: params.get('max') ? parseFloat(params.get('max')!) : undefined,
            sizes: params.get('sizes')?.split(',').filter(Boolean),
            fitTypes: params.get('fit')?.split(',').filter(Boolean),
            colors: params.get('colors')?.split(',').filter(Boolean),
        }

        let type: SearchIntent['type'] = 'browse'
        const queryLower = originalQuery.toLowerCase()

        if (originalQuery) {
            type = 'search'
            if (queryLower.includes('outfit for') || queryLower.includes('wear to')) {
                type = 'styling_advice'
            }
        }

        const normalizedQuery = originalQuery
        let finalSort = rawSort as SearchSort

        const signals = {
            isPriceSensitive: false,
            detectedOccasion: undefined as string | undefined
        }

        if (queryLower.includes('cheap') || queryLower.includes('under')) {
            signals.isPriceSensitive = true
            if (rawSort === 'relevance') {
                finalSort = 'price-low'
            }
        }

        const occasions = ['party', 'wedding', 'beach', 'office', 'gym']
        for (const occ of occasions) {
            if (queryLower.includes(occ)) {
                signals.detectedOccasion = occ
                break
            }
        }

        return {
            originalQuery,
            normalizedQuery,
            type,
            filters,
            sort: finalSort,
            signals
        }
    }
}
