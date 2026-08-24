import { SearchIntent, SearchSort } from './types';

/**
 * LAYER 1: Query Intake & Understanding
 * Normalizes raw input into a structured intent.
 */
export class QueryUnderstanding {
    static parse(requestUrl: string): SearchIntent {
        const url = new URL(requestUrl);
        const params = url.searchParams;

        const originalQuery = params.get('q') || '';
        const rawSort = params.get('sort') || 'relevance';

        // 1. Basic Filter Extraction
        const filters = {
            category: params.get('category') || undefined,
            minPrice: params.get('min') ? parseFloat(params.get('min')!) : undefined,
            maxPrice: params.get('max') ? parseFloat(params.get('max')!) : undefined,
            sizes: params.get('sizes')?.split(',').filter(Boolean),
            fitTypes: params.get('fit')?.split(',').filter(Boolean),
            colors: params.get('colors')?.split(',').filter(Boolean),
        };

        // 2. Intent Classification (Rule-based Phase 1)
        // Future: Replace with LLM or fast text classifier
        let type: SearchIntent['type'] = 'browse';
        const queryLower = originalQuery.toLowerCase();

        if (originalQuery) {
            type = 'search';
            if (queryLower.includes('how do i look') || queryLower.includes('try on')) {
                type = 'tryon_request';
            } else if (queryLower.includes('outfit for') || queryLower.includes('wear to')) {
                type = 'styling_advice';
            }
        }

        // 3. Signal Extraction given normalized query
        // E.g. "Cheap dresses" -> sort: price-low
        const normalizedQuery = originalQuery;
        let finalSort = rawSort as SearchSort;

        const signals = {
            isPriceSensitive: false,
            isTryOnIntent: type === 'tryon_request',
            detectedOccasion: undefined as string | undefined
        };

        // Keyword detection
        if (queryLower.includes('cheap') || queryLower.includes('under')) {
            signals.isPriceSensitive = true;
            // If user didn't explicitly sort, optimize for price
            if (rawSort === 'relevance') {
                finalSort = 'price-low';
            }
        }

        // Occasion detection (very basic list)
        const occasions = ['party', 'wedding', 'beach', 'office', 'gym'];
        for (const occ of occasions) {
            if (queryLower.includes(occ)) {
                signals.detectedOccasion = occ;
                break;
            }
        }

        return {
            originalQuery,
            normalizedQuery,
            type,
            filters,
            sort: finalSort,
            signals
        };
    }
}
