import { SupabaseClient } from '@supabase/supabase-js'

export type UserPreferencesData = {
    auto_select_size?: boolean
    preferred_fit?: 'slim' | 'regular' | 'relaxed' | null
    hide_out_of_stock?: boolean
    auto_wishlist_oos?: boolean
    confirm_cart_removal?: boolean
    persist_cart?: boolean
    reduce_motion?: boolean
    image_quality?: 'auto' | 'low' | 'high'
    default_view?: 'shop' | 'tryon'
    body_profile_mode?: 'avatar' | 'static_tryon'
    auto_apply_body_profile?: boolean
    remember_last_tryon?: boolean
    show_fit_confidence?: boolean
    retain_tryon_images?: boolean
    recently_viewed_days?: number
    show_data_usage_hints?: boolean
    order_update_level?: 'important_only' | 'all'
    promo_offers?: boolean
    promo_new_arrivals?: boolean
    promo_style_tips?: boolean
}

/**
 * Safely fetch user preferences from Supabase.
 * Returns null if table doesn't exist, user not logged in, or any error occurs.
 * This prevents 406/400 console errors when the table hasn't been migrated.
 */
export async function getUserPreferences(
    supabase: SupabaseClient,
    userId?: string
): Promise<UserPreferencesData | null> {
    try {
        // If no userId provided, try to get current user
        let uid = userId
        if (!uid) {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return null
            uid = user.id
        }

        const { data, error } = await supabase
            .from('user_preferences')
            .select('preferences')
            .eq('user_id', uid)
            .maybeSingle()

        // Silently handle all errors (table not found, RLS, etc.)
        if (error) return null

        return data?.preferences || null
    } catch {
        // Network or other errors
        return null
    }
}

/**
 * Get a specific preference value with a default fallback.
 */
export async function getUserPreference<K extends keyof UserPreferencesData>(
    supabase: SupabaseClient,
    key: K,
    defaultValue: UserPreferencesData[K]
): Promise<UserPreferencesData[K]> {
    const prefs = await getUserPreferences(supabase)
    if (prefs && prefs[key] !== undefined) {
        return prefs[key] as UserPreferencesData[K]
    }
    return defaultValue
}
