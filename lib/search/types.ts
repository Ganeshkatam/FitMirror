export type SearchSort = 'relevance' | 'price-low' | 'price-high' | 'newest' | 'rating'

export interface SearchFilters {
    category?: string
    minPrice?: number
    maxPrice?: number
    colors?: string[]
    sizes?: string[]
    fitTypes?: string[]
    gender?: 'men' | 'women' | 'unisex'
}

export interface SearchIntent {
    originalQuery: string
    normalizedQuery: string
    type: 'browse' | 'search' | 'styling_advice'
    filters: SearchFilters
    sort: SearchSort
    signals: {
        isPriceSensitive: boolean
        detectedOccasion?: string
    }
}

export interface ProductCandidate {
    id: string
    name: string
    category: string
    price: number
    compare_price?: number
    image?: string | null
    image_url?: string | null
    created_at: string
    score?: number
    debugScore?: string
}

export interface SearchResult {
    products: ProductCandidate[]
    total: number
    explanationHints: string[]
}
