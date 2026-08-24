import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

// Create a public client for cached requests (no cookies)
const getPublicClient = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export class StorefrontService {
    // --- Layout Data ---

    static async getStoreSettings() {
        return unstable_cache(
            async () => {
                try {
                    const supabase = getPublicClient()
                    const { data } = await supabase
                        .from('store_settings')
                        .select('store_open, pause_message')
                        .limit(1)
                        .single()
                    return data || { store_open: true } // Default to open if DB fails
                } catch (e) {
                    console.error('getStoreSettings failed', e)
                    return { store_open: true }
                }
            },
            ['store-settings-hero'],
            { revalidate: 3600, tags: ['settings'] }
        )()
    }

    static async getAllCategories() {
        return unstable_cache(
            async () => {
                try {
                    const supabase = getPublicClient()
                    const { data } = await supabase
                        .from('main_categories')
                        .select('*')
                        .eq('is_active', true)
                        .order('sort_order', { ascending: true })
                    return data || []
                } catch (e) {
                    console.error('getAllCategories failed', e)
                    return []
                }
            },
            ['all-categories-list'],
            { revalidate: 3600, tags: ['categories'] }
        )()

    }

    static async getCategoryBySlug(slug: string) {
        return unstable_cache(
            async () => {
                try {
                    const supabase = getPublicClient()
                    const { data } = await supabase
                        .from('main_categories')
                        .select('*, sub_categories(*)')
                        .eq('slug', slug)
                        .eq('is_active', true)
                        .single()
                    return data
                } catch (e) {
                    console.error('getCategoryBySlug failed', e)
                    return null
                }
            },
            [`category-${slug}`],
            { revalidate: 3600, tags: [`category-${slug}`] }
        )()
    }

    static async getMegaMenuData() {
        return unstable_cache(
            async () => {
                try {
                    const supabase = getPublicClient()
                    // Fetch full hierarchy: Main -> Categories -> SubCategories
                    const { data } = await supabase
                        .from('main_categories')
                        .select(`
                            name, 
                            slug, 
                            featured_discount_text, 
                            is_featured_home, 
                            hero_image_url,
                            categories (
                                name,
                                sub_categories (name, slug)
                            )
                        `)
                        .eq('is_active', true)
                        .order('sort_order', { ascending: true })

                    if (!data) return []

                    // Transform to Menu Structure
                    return data.map(main => ({
                        label: main.name,
                        href: `/shop/${main.slug}`,
                        color: 'hover:border-primary', // Default color
                        // Map 2nd level categories to columns
                        columns: main.categories?.map((cat: any) => ({
                            heading: cat.name,
                            items: cat.sub_categories?.map((sub: any) => sub.name) || []
                        })) || [],
                        // Featured Data
                        featured: {
                            text: main.featured_discount_text,
                            image: main.hero_image_url
                        }
                    }))
                } catch (e) {
                    console.error('getMegaMenuData failed', e)
                    return []
                }
            },
            ['mega-menu'],
            { revalidate: 3600, tags: ['categories', 'menu'] }
        )()
    }



    // --- Homepage Data ---

    static async getFeaturedProducts() {
        return unstable_cache(
            async () => {
                try {
                    const supabase = getPublicClient()
                    const { data } = await supabase
                        .from('products')
                        .select('*, product_inventory(size, stock)')
                        .eq('is_active', true)
                        .order('created_at', { ascending: false })
                        .limit(8)
                    return data || []
                } catch (e) {
                    console.error('getFeaturedProducts failed', e)
                    return []
                }
            },
            ['featured-products-v2'],
            { revalidate: 600, tags: ['products'] }
        )()
    }

    static async getTrendingProducts() {
        return unstable_cache(
            async () => {
                try {
                    const supabase = getPublicClient()
                    const { data } = await supabase
                        .from('products')
                        .select('id, name, images, price, brand, category, is_active')
                        .eq('is_active', true)
                        .order('created_at', { ascending: false }) // Trending = Newest for now, or use velocity
                        .limit(12)
                    return data || []
                } catch (e) {
                    console.error('getTrendingProducts failed', e)
                    return []
                }
            },
            ['trending-products-v2'],
            { revalidate: 600, tags: ['products'] }
        )()
    }

    static async getRecommendedProducts() {
        return unstable_cache(
            async () => {
                try {
                    const supabase = getPublicClient()
                    // Recommendations based on global popularity (velocity)
                    const { data } = await supabase
                        .from('products')
                        .select('id, name, images, price, brand, category')
                        .eq('is_active', true)
                        .order('velocity', { ascending: false })
                        .limit(8)
                    return data || []
                } catch (e) {
                    console.error('getRecommendedProducts failed', e)
                    return []
                }
            },
            ['recommended-products-v2'],
            { revalidate: 3600, tags: ['products'] }
        )()
    }

    static async getTryOnProducts() {
        return unstable_cache(
            async () => {
                try {
                    const supabase = getPublicClient()
                    // Products with virtual try-on assets
                    // Assuming 'tryon_asset_ref' or checking garment_assets join
                    // For now, let's filter by a flag or just take featured ones that support it
                    const { data } = await supabase
                        .from('products')
                        .select('id, name, images, price, brand, category')
                        .eq('is_active', true)
                        // .not('tryon_asset_ref', 'is', null) // Uncomment if column exists
                        .limit(6)
                    return data || []
                } catch (e) {
                    console.error('getTryOnProducts failed', e)
                    return []
                }
            },
            ['tryon-products'],
            { revalidate: 3600, tags: ['products', 'tryon'] }
        )()
    }

    static async getCollections() {
        return unstable_cache(
            async () => {
                try {
                    const supabase = getPublicClient()
                    const { data } = await supabase
                        .from('collections')
                        .select('*')
                        .eq('is_active', true)
                        .order('sort_order', { ascending: true })
                    return data || []
                } catch (e) {
                    console.error('getCollections failed', e)
                    return []
                }
            },
            ['collections-list'],
            { revalidate: 3600, tags: ['collections'] }
        )()
    }

    static async getHomeStats() {
        return unstable_cache(
            async () => {
                try {
                    const supabase = getPublicClient()
                    const { data } = await supabase.rpc('get_home_stats')
                    return data
                } catch (e) {
                    console.error('getHomeStats failed', e)
                    return null
                }
            },
            ['home-stats'],
            { revalidate: 300, tags: ['stats'] }
        )()
    }

    // --- PDP Data ---

    static async getProductById(id: string) {
        // Direct fetch for debugging - no cache
        try {
            const supabase = getPublicClient()
            const { data, error } = await supabase
                .from('products')
                .select(`
                *,
                store:stores(
                    name, 
                    id, 
                    logo_url,
                    seller:sellers(
                        seller_profiles(business_name, support_email, business_address)
                    )
                ),
                product_inventory(size, color, stock),
                product_media(id, url, media_type, storage_path)
            `)
                .eq('id', id)
                .single()

            if (error) {
                console.error('Detailed Supabase Error:', error)
                return { error }
            }
            return data
        } catch (e) {
            console.error('getProductById failed', e)
            return { error: e }
        }
    }

    static async getProductReviews(productId: string) {
        return unstable_cache(
            async () => {
                try {
                    const supabase = getPublicClient()
                    const { data } = await supabase
                        .from('reviews')
                        .select('*, profiles(display_name, avatar_url)')
                        .eq('product_id', productId)
                        .order('created_at', { ascending: false })
                    return data || []
                } catch (e) {
                    console.error('getProductReviews failed', e)
                    return []
                }
            },
            [`reviews-${productId}`],
            { revalidate: 300, tags: [`reviews-${productId}`] }
        )()
    }

    static async getFeaturedReviews() {
        return unstable_cache(
            async () => {
                try {
                    const supabase = getPublicClient()
                    const { data } = await supabase
                        .from('reviews')
                        .select('*, profiles(display_name, avatar_url), products(name)')
                        .eq('rating', 5)
                        .not('text', 'is', null)
                        .order('created_at', { ascending: false })
                        .limit(6)

                    return data?.map((r: any) => ({
                        id: r.id,
                        name: r.profiles?.display_name || 'Verified Buyer',
                        avatar: r.profiles?.avatar_url || null,
                        role: 'Verified Customer',
                        rating: r.rating,
                        text: r.text,
                        product: r.products?.name
                    })) || []
                } catch (e) {
                    console.error('getFeaturedReviews failed', e)
                    return []
                }
            },
            ['featured-reviews'],
            { revalidate: 3600, tags: ['reviews'] }
        )()
    }

    static async getCoupons(storeId?: string) {
        return unstable_cache(
            async () => {
                try {
                    const supabase = getPublicClient()
                    let query = supabase
                        .from('coupons')
                        .select('id, code, discount_type, discount_value, min_order_amount')
                        .eq('is_active', true)
                        .gt('expires_at', new Date().toISOString())

                    if (storeId) {
                        // Specific store + Global
                        query = query.or(`store_id.eq.${storeId},store_id.is.null`)
                    } else {
                        // Global only
                        query = query.is('store_id', null)
                    }

                    const { data } = await query.limit(5)
                    return data || []
                } catch (e) {
                    console.error('getCoupons failed', e)
                    return []
                }
            },
            [`coupons-${storeId}`],
            { revalidate: 600, tags: ['coupons'] }
        )()
    }

    static async getRelatedProducts(category: string, currentId: string, gender?: string) {
        const key = `related-${category}-${gender || 'all'}-${currentId}`
        return unstable_cache(
            async () => {
                try {
                    const supabase = getPublicClient()
                    const { data } = await supabase.rpc('universal_search', {
                        search_query: null,
                        filter_category: category || null,
                        filter_genders: gender ? [gender] : null,
                        page_size: 8
                    })
                    return (data || []).filter((p: any) => p.product_id !== currentId).slice(0, 4)
                } catch (e) {
                    console.error('getRelatedProducts failed', e)
                    return []
                }
            },
            [key],
            { revalidate: 3600, tags: ['products'] }
        )()
    }

    static async getProductColorVariants(name: string, currentId: string) {
        // Find other products with the same name but different color
        // This assumes variants share the EXACT same name
        return unstable_cache(
            async () => {
                try {
                    const supabase = getPublicClient()
                    const { data } = await supabase
                        .from('products')
                        .select('id, color, images')
                        .eq('name', name)
                        .eq('is_active', true)
                        .neq('id', currentId)
                        .not('color', 'is', null)

                    return data || []
                } catch (e) {
                    console.error('getProductColorVariants failed', e)
                    return []
                }
            },
            [`variants-${currentId}`],
            { revalidate: 3600, tags: ['products'] }
        )()
    }

    // --- Search / Shop Page ---

    static async getSuggestions(query: string) {
        if (!query || query.length < 2) return []

        try {
            const supabase = getPublicClient()
            const { data } = await supabase.rpc('get_search_suggestions', {
                search_query: query,
                limit_count: 6
            })
            return data || []
        } catch (e) {
            console.error('getSuggestions failed', e)
            return []
        }
    }

    static async searchProducts(payload: any) {
        const isDefault = !payload.query && Object.values(payload.filters || {}).every(v => !v || (Array.isArray(v) && v.length === 0));

        if (isDefault) {
            return unstable_cache(
                async () => {
                    try {
                        const supabase = getPublicClient()
                        const { data } = await supabase.rpc('universal_search', {
                            search_query: null,
                            page_size: 20
                        })
                        return { results: data || [], meta: { facets: {} } }
                    } catch (e) {
                        console.error('searchProducts (default) failed', e)
                        return { results: [], meta: { facets: {} } }
                    }
                },
                ['default-shop-search'],
                { revalidate: 600, tags: ['products'] }
            )()
        }

        try {
            // Direct call for filtered search (no cache)
            const supabase = getPublicClient()
            const { query, filters, sort } = payload

            const { data } = await supabase.rpc('universal_search', {
                search_query: query || null,
                filter_categories: filters?.category || null,
                filter_genders: filters?.gender || null,
                filter_colors: filters?.color || null,
                filter_sizes: filters?.size || null,
                filter_brands: filters?.brand || null,
                // New Dynamic Filters
                filter_patterns: filters?.pattern || null,
                filter_occasions: filters?.occasion || null,
                filter_sleeves: filters?.sleeve || null,
                filter_necks: filters?.neck || null,
                filter_fits: filters?.fit || null,
                filter_materials: filters?.material || null,
                // Rating & Stock & Age
                filter_rating: filters?.rating ? parseFloat(filters.rating) : null,
                filter_in_stock: filters?.inStock === 'true' ? true : null,
                filter_age_groups: filters?.age ? (Array.isArray(filters.age) ? filters.age : [filters.age]) : null,
                // Range & Sort
                min_price: filters?.minPrice,
                max_price: filters?.maxPrice,
                sort_by: sort,
                page_size: 20
            })

            return { results: data || [], meta: { facets: {} } }
        } catch (e) {
            console.error('searchProducts (filtered) failed', e)
            return { results: [], meta: { facets: {} } }
        }
    }

    // --- SEO Data ---

    static async getAllProductsForSitemap() {
        return unstable_cache(
            async () => {
                try {
                    const supabase = getPublicClient()
                    const { data } = await supabase
                        .from('products')
                        .select('id, updated_at')
                        .eq('is_active', true)
                    return data || []
                } catch (e) {
                    console.error('getAllProductsForSitemap failed', e)
                    return []
                }
            },
            ['sitemap-products'],
            { revalidate: 3600, tags: ['products'] }
        )()
    }
    static async getDeals() {
        return unstable_cache(
            async () => {
                try {
                    const supabase = getPublicClient()
                    // Fetch products that likely have a discount
                    const { data } = await supabase
                        .from('products')
                        .select('*, product_inventory(size, stock)')
                        .eq('is_active', true)
                        // optimizations: fetch rows where original_price or mrp is not null
                        // .or('original_price.neq.null,mrp.neq.null') 
                        .limit(50)

                    if (!data) return []

                    // Filter and Sort by discount %
                    const deals = data.filter((p: any) => {
                        const op = p.original_price || p.mrp
                        return op && p.price < op
                    }).map((p: any) => ({
                        ...p,
                        discountPercent: Math.round((1 - p.price / (p.original_price || p.mrp)) * 100)
                    })).sort((a: any, b: any) => b.discountPercent - a.discountPercent)

                    return deals
                } catch (e) {
                    console.error('getDeals failed', e)
                    return []
                }
            },
            ['deals-list'],
            { revalidate: 600, tags: ['products'] }
        )()
    }
}
