'use server'

import { createClient } from '@/lib/supabase/server'

// Types
interface LoyaltyInfo {
    points: number
    max_discount: number
    total_earned: number
    total_redeemed: number
    can_redeem: boolean
}

interface RedemptionResult {
    success: boolean
    message?: string
    discount?: number
    points_used?: number
    remaining_points?: number
}

/**
 * Get user's loyalty points info
 */
export async function getUserLoyaltyInfo(): Promise<LoyaltyInfo | null> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase.rpc('get_loyalty_info', { p_user_id: user.id })

    if (error) {
        console.error('Failed to get loyalty info:', error)
        return null
    }

    return data as LoyaltyInfo
}

/**
 * Redeem points for discount
 * @param points - Number of points to redeem (minimum 100)
 */
export async function redeemPoints(points: number): Promise<RedemptionResult> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, message: 'Not authenticated' }
    }

    if (points < 100) {
        return { success: false, message: 'Minimum 100 points required' }
    }

    const { data, error } = await supabase.rpc('redeem_loyalty_points', {
        p_user_id: user.id,
        p_points: points
    })

    if (error) {
        console.error('Failed to redeem points:', error)
        return { success: false, message: 'Failed to redeem points' }
    }

    return data as RedemptionResult
}

/**
 * Get loyalty transaction history
 */
export async function getLoyaltyTransactions(limit: number = 10) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Failed to get transactions:', error)
        return []
    }

    return data
}
