export interface CartItem {
    productId: string
    productName: string
    productImage: string
    price: number // in cents/lowest unit
    size: string
    quantity: number
    storeId: string
    // Optional metadata that might be useful for engines
    sku?: string
    currency?: string
    variantId?: string
    color?: string
    // Discount specific to this item
    discount?: number
}

export interface CartSummary {
    total: number // Final amount to charge
    itemCount: number
    subtotal: number // Sum of items * price
    tax: number
    shipping: number
    discountTotal: number
    currency: string
}

// Pure Logic
export function isValidCartItem(item: CartItem): boolean {
    return item.quantity > 0 && item.price >= 0 && !!item.productId && !!item.size
}

export function areItemsEqual(a: CartItem, b: CartItem): boolean {
    return a.productId === b.productId &&
        a.size === b.size &&
        a.variantId === b.variantId
}
