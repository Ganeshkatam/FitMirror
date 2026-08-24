import { createClient } from '@/lib/supabase/server';
import { SearchIntent, ProductCandidate } from './types';

/**
 * LAYER 3: Candidate Retrieval
 * Fetches raw candidates from the database.
 * Optimized for speed: No heavy joins per row if possible.
 */
export class RetrievalEngine {
    static async fetchCandidates(intent: SearchIntent, limit: number = 24, offset: number = 0): Promise<{ products: ProductCandidate[], total: number }> {
        const supabase = await createClient();

        // 1. Build Base Query
        let dbQuery = supabase
            .from('products')
            .select('id, name, category, price, compare_price, image, created_at', { count: 'exact' })
            .eq('is_active', true);

        // 2. Apply Intent Filters
        if (intent.type === 'search' && intent.normalizedQuery) {
            const q = intent.normalizedQuery;
            dbQuery = dbQuery.or(`name.ilike.%${q}%,category.ilike.%${q}%,description.ilike.%${q}%`);
        }

        if (intent.filters.category && intent.filters.category !== 'all') {
            dbQuery = dbQuery.eq('category', intent.filters.category);
        }

        if (intent.filters.minPrice) dbQuery = dbQuery.gte('price', intent.filters.minPrice);
        if (intent.filters.maxPrice) dbQuery = dbQuery.lte('price', intent.filters.maxPrice);

        // Fit Type Removed (Schema Change)
        // if (intent.filters.fitTypes && intent.filters.fitTypes.length > 0) {
        //    dbQuery = dbQuery.in('fit_type', intent.filters.fitTypes);
        // }

        // Apply Sorting at DB level for basic sorts (Pagination needs this)
        // Complexity: If we do custom Ranking (Layer 4), we might need to fetch MORE than limit, 
        // then rank, then slice. For MVP, we use DB sort for basic cases.
        switch (intent.sort) {
            case 'price-low': dbQuery = dbQuery.order('price', { ascending: true }); break;
            case 'price-high': dbQuery = dbQuery.order('price', { ascending: false }); break;
            case 'newest': dbQuery = dbQuery.order('created_at', { ascending: false }); break;
            case 'relevance': default:
                // For text search, Supabase doesn't have native relevance sort easily without full text search setup.
                // We'll fall back to created_at or name for now, and let Ranking layer refine.
                // In a real PG FTS setup, we'd use `order by rank`.
                dbQuery = dbQuery.order('created_at', { ascending: false });
                break;
        }

        // Pagination
        // Note: If we have post-DB filtering (like inventory), we might get fewer results than limit.
        // For strict pagination with post-filtering, we'd need to fetch more. 
        // We'll assume "Fetch extra" strategy: Fetch 2x limit to allow for some filtering.
        const fetchLimit = intent.filters.sizes ? limit * 3 : limit;
        dbQuery = dbQuery.range(offset, offset + fetchLimit - 1);

        const { data, count, error } = await dbQuery;

        if (error) {
            console.error('Search Retrieval Error:', error);
            throw new Error('Database retrieval failed');
        }

        let candidates = (data || []) as unknown as ProductCandidate[];

        // 3. Post-DB Filtering (Inventory)
        // This is "expensive" so we do it only if needed.
        if (intent.filters.sizes && intent.filters.sizes.length > 0) {
            const sizeArray = intent.filters.sizes;
            const productIds = candidates.map(p => p.id);

            if (productIds.length > 0) {
                const { data: inventoryData } = await supabase
                    .from('product_inventory')
                    .select('product_id')
                    .in('product_id', productIds)
                    .in('size', sizeArray)
                    .gt('stock', 0);

                const availableIds = new Set(inventoryData?.map(i => i.product_id));
                candidates = candidates.filter(p => availableIds.has(p.id));
            }
        }

        // Normalize image
        candidates = candidates.map(p => ({
            ...p,
            image_url: (p as any).image // Handle legacy schema if needed
        }));

        // Slice to actual limit (since we might have fetched extra)
        const finalProducts = candidates.slice(0, limit);

        return { products: finalProducts, total: count || 0 };
    }
}
