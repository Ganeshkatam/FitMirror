/**
 * User Style Profile (Matches user_style_profiles table)
 */
export interface UserStyleProfile {
    userId: string
    preferredCategories: string[]
    preferredColors: string[]
    preferredFit?: 'slim' | 'regular' | 'relaxed' | string
    preferredStyle?: 'casual' | 'formal' | 'sporty' | 'bohemian' | 'minimalist' | string
    avgPriceRange: { min: number; max: number }
    bodyType?: string
    styleVector: Record<string, number>
    totalViews: number
    totalPurchases: number
    lastUpdated?: string

    // Legacy/Derived (Optional)
    brandAffinity?: Record<string, number>
    colorAffinity?: Record<string, number>
}

export interface ProductViewEvent {
    productId: string
    category: string
    color?: string
    brand?: string
    price: number
    timeSpent?: number
}
