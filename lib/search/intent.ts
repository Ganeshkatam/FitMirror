import { SearchIntent, SearchFilters, SearchSort } from './types'

const CATEGORY_KEYWORDS: Record<string, string[]> = {
    'tops': ['shirt', 't-shirt', 'top', 'blouse', 'tee', 'hoodie', 'sweatshirt', 'jacket', 'coat'],
    'bottoms': ['jeans', 'pant', 'trousers', 'skirt', 'short', 'legging', 'jogger'],
    'dresses': ['dress', 'gown', 'frock', 'jumpsuit', 'lehenga', 'saree'],
    'shoes': ['shoe', 'sneaker', 'boot', 'sandal', 'heel'],
    'accessories': ['bag', 'belt', 'hat', 'cap', 'jewelry', 'necklace', 'earring']
}

const PRICE_KEYWORDS: Record<string, number> = {
    'cheap': 500,
    'budget': 1000,
    'premium': 5000,
    'luxury': 10000,
    'under 500': 500,
    'under 1000': 1000,
    'under 2000': 2000,
    'under 5000': 5000
}

export function detectIntent(query: string): SearchIntent {
    const q = query.toLowerCase().trim()
    const filters: SearchFilters = {}

    // 1. Detect Category
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(k => q.includes(k))) {
            filters.category = cat // Simple single category for now
            break
        }
    }

    // 2. Detect Gender
    if (q.includes('men') && !q.includes('women')) filters.gender = 'men'
    else if (q.includes('women') || q.includes('lady') || q.includes('girl')) filters.gender = 'women'
    else if (q.includes('kid') || q.includes('boy') || q.includes('baby')) filters.gender = 'unisex' // mapped 'kids' to unisex or specific if supported

    // 3. Detect Price Intent
    const underMatch = q.match(/under\s?(\d+)/)
    if (underMatch) {
        filters.maxPrice = parseInt(underMatch[1])
        filters.minPrice = 0
    } else {
        for (const [key, max] of Object.entries(PRICE_KEYWORDS)) {
            if (q.includes(key)) {
                filters.maxPrice = max
                filters.minPrice = 0
                break
            }
        }
    }

    // 4. Detect Signals & Type
    const isTryOn = q.includes('try') || q.includes('wear') || q.includes('see') || q.includes('virtual')
    const type = isTryOn ? 'tryon_request' : 'search'

    return {
        originalQuery: query,
        normalizedQuery: q, // In V2, remove stop words
        type,
        filters,
        sort: 'relevance', // Default
        signals: {
            isPriceSensitive: !!filters.maxPrice,
            isTryOnIntent: isTryOn,
            detectedOccasion: undefined
        }
    }
}
