import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { createClient as createBrowserClient } from '@supabase/supabase-js'
import { MainCategory, SubCategory } from './types'

// Cache keys
const CATEGORIES_CACHE_TAG = 'categories'

// Create a lightweight, cookie-free Supabase client for cached public queries.
function createPublicClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

export const getAllMainCategories = unstable_cache(
    async (): Promise<MainCategory[]> => {
        const supabase = createPublicClient()

        // Check system first
        const { count } = await supabase
            .from('main_categories')
            .select('*', { count: 'exact', head: true })

        const usingNewSystem = count !== null && count > 0

        if (usingNewSystem) {
            const { data } = await supabase
                .from('main_categories')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true })
            return data || []
        }

        // Fallback to recursive categories table
        const { data: legacyData } = await supabase
            .from('categories')
            .select('*')
            .is('parent_id', null)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

        return legacyData || []
    },
    ['main-categories'],
    { revalidate: 60, tags: [CATEGORIES_CACHE_TAG] }
)

export const getAllSubCategories = unstable_cache(
    async (): Promise<SubCategory[]> => {
        const supabase = createPublicClient()

        // Check system usage via main_categories count (assuming they go together)
        const { count } = await supabase
            .from('main_categories')
            .select('*', { count: 'exact', head: true })

        const usingNewSystem = count !== null && count > 0

        if (usingNewSystem) {
            const { data } = await supabase
                .from('sub_categories')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true })
            return data || []
        }

        // Fallback
        const { data: legacyData } = await supabase
            .from('categories')
            .select('*')
            .not('parent_id', 'is', null)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

        return legacyData || []
    },
    ['sub-categories'],
    { revalidate: 60, tags: [CATEGORIES_CACHE_TAG] }
)

export const getCategoriesWithSubs = unstable_cache(
    async (): Promise<MainCategory[]> => {
        const supabase = createPublicClient()

        // 1. Check if we are using the new system (Main/Sub tables)
        // We check if ANY main categories exist (active or inactive) to determine system usage
        const { count } = await supabase
            .from('main_categories')
            .select('*', { count: 'exact', head: true })

        const usingNewSystem = count !== null && count > 0

        if (usingNewSystem) {
            // 1. Fetch Main Categories
            const { data: mainCats } = await supabase
                .from('main_categories')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true })

            // 2. Fetch Sub Categories
            const { data: subCats } = await supabase
                .from('sub_categories')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true })

            return (mainCats || []).map(main => ({
                ...main,
                sub_categories: subCats?.filter(sub => sub.main_category_id === main.id) || []
            }))
        }

        // --- FALLBACK: Recursive 'categories' table ---
        const { data: legacyMain } = await supabase
            .from('categories')
            .select('*')
            .is('parent_id', null)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

        const { data: legacySub } = await supabase
            .from('categories')
            .select('*')
            .not('parent_id', 'is', null)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

        if (!legacyMain) return []

        return legacyMain.map(main => ({
            ...main,
            sub_categories: legacySub?.filter(sub => sub.parent_id === main.id) || []
        }))
    },
    ['categories-with-subs'],
    { revalidate: 60, tags: [CATEGORIES_CACHE_TAG] }
)

// Alias for explicit server usage
export const getCategoriesWithSubsServer = getCategoriesWithSubs

export async function getMainCategories() {
    return getAllMainCategories()
}

// Helper for fetching Subs for a specific parent (Hybrid support)
export async function getSubCategories(parentId: string) {
    const supabase = await createClient()

    // Try sub_categories table first
    const { data: subData } = await supabase
        .from('sub_categories')
        .select('*')
        .eq('main_category_id', parentId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

    if (subData && subData.length > 0) return subData

    // Fallback to recursive
    const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', parentId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

    return data || []
}

export async function getCategoriesTree() {
    return getCategoriesWithSubs()
}
