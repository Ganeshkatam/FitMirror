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
    default_view?: 'shop'
    show_fit_confidence?: boolean
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
 */
export async function getUserPreferences(
    supabase: SupabaseClient,
    userId?: string
): Promise<UserPreferencesData | null> {
    try {
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

        if (error) return null

        return data?.preferences || null
    } catch {
        return null
    }
}
