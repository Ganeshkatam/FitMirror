import { CartItem, CartSummary } from './types'

/**
 * Calculate cart total amount (Subtotal)
 */
export function calculateCartTotal(items: CartItem[]): number {
    return items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
}

/**
 * Calculate total number of items in cart
 */
export function calculateItemCount(items: CartItem[]): number {
    return items.reduce((acc, item) => acc + item.quantity, 0)
}

/**
 * Calculate full cart summary including tax/shipping
 * Expects prices in lowest currency unit (e.g. paisa/cents)
 */
export function calculateCartSummary(items: CartItem[], shippingCost: number = 0, taxRate: number = 0): CartSummary {
    const subtotal = calculateCartTotal(items)

    // Calculate item-level discounts if any (future proofing)
    const discountTotal = items.reduce((acc, item) => acc + ((item.discount || 0) * item.quantity), 0)

    // Tax defaults to 0 if not provided, can be complex logic later
    const taxableAmount = Math.max(0, subtotal - discountTotal)
    const tax = Math.round(taxableAmount * taxRate)

    const total = Math.max(0, subtotal - discountTotal + tax + shippingCost)

    return {
        subtotal,
        tax,
        shipping: shippingCost,
        discountTotal,
        total,
        itemCount: calculateItemCount(items),
        currency: items[0]?.currency || 'INR'
    }
}
