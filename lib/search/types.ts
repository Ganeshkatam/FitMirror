export type SearchSort = 'relevance' | 'price-low' | 'price-high' | 'newest' | 'rating';

export interface SearchFilters {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    colors?: string[];
    sizes?: string[]; // e.g. ["S", "M"]
    fitTypes?: string[]; // e.g. ["slim", "oversized"]
    gender?: 'men' | 'women' | 'unisex';
}

export interface SearchIntent {
    originalQuery: string;
    normalizedQuery: string;
    type: 'browse' | 'search' | 'tryon_request' | 'styling_advice';
    filters: SearchFilters;
    sort: SearchSort;
    // Signals extracted from query (e.g. "cheap" -> sort: price-low)
    signals: {
        isPriceSensitive: boolean;
        isTryOnIntent: boolean;
        detectedOccasion?: string; // e.g. "party", "wedding"
    };
}

export interface ProductCandidate {
    id: string;
    name: string;
    category: string;
    price: number;
    compare_price?: number;
    image?: string | null;
    image_url?: string | null;
    created_at: string;
    // Computed during ranking
    score?: number;
    debugScore?: string; // Explains why it ranked high
}

export interface SearchResult {
    products: ProductCandidate[];
    total: number;

    // FitMirror Special Fields
    tryonReady: boolean;
    explanationHints: string[]; // e.g. "Matched your size S preference"
}
