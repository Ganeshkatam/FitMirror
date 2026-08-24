'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateDiscountedPrice } from '@/lib/utils/pricing'

// Re-export for convenience
export { calculateDiscountedPrice }

interface GlobalDiscountResult {
    hasDiscount: boolean
    discountPercentage: number
    isActive: boolean
    startDate: string | null
    endDate: string | null
}

/**
 * Get the current active global discount from seller settings
 */
export async function getActiveGlobalDiscount(): Promise<GlobalDiscountResult> {
    const supabase = await createClient()

    // Get the first seller settings (primary seller)
    const { data: settings } = await supabase
        .from('seller_settings')
        .select('global_discount, discount_start, discount_end')
        .limit(1)
        .single()

    if (!settings || !settings.global_discount || settings.global_discount <= 0) {
        return {
            hasDiscount: false,
            discountPercentage: 0,
            isActive: false,
            startDate: null,
            endDate: null
        }
    }

    const now = new Date()
    const startDate = settings.discount_start ? new Date(settings.discount_start) : null
    const endDate = settings.discount_end ? new Date(settings.discount_end) : null

    // Check if discount is currently active
    const isActive = (!startDate || now >= startDate) && (!endDate || now <= endDate)

    return {
        hasDiscount: true,
        discountPercentage: settings.global_discount,
        isActive,
        startDate: settings.discount_start,
        endDate: settings.discount_end
    }
}

/**
 * Apply global discount to a price
 */
export async function applyGlobalDiscount(originalPrice: number): Promise<{
    finalPrice: number
    originalPrice: number
    discount: GlobalDiscountResult
}> {
    const discount = await getActiveGlobalDiscount()

    const finalPrice = discount.isActive
        ? calculateDiscountedPrice(originalPrice, discount.discountPercentage)
        : originalPrice

    return {
        finalPrice,
        originalPrice,
        discount
    }
}
