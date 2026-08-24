/**
 * Calculate discounted price
 */
export function calculateDiscountedPrice(originalPrice: number, discountPercentage: number): number {
    if (discountPercentage <= 0 || discountPercentage > 100) return originalPrice
    return Math.round(originalPrice * (1 - discountPercentage / 100))
}

/**
 * Format price to currency string
 * @param amount Amount in smallest currency unit (e.g. cents) or float depending on currency
 * @param currency Currency code (default INR)
 */
export function formatPrice(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}
