'use server'

import { createClient } from '@/lib/supabase/server'

// Reservation expires after 15 minutes
const RESERVATION_EXPIRY_MINUTES = 15

interface ReserveStockParams {
    orderId?: string
    cartId?: string
    items: {
        productId: string
        size: string
        quantity: number
        variantId?: string
        color?: string
    }[]
}

/**
 * Reserve stock for items during checkout
 */
export async function reserveStock({ orderId, cartId, items }: ReserveStockParams) {
    const supabase = await createClient()

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + RESERVATION_EXPIRY_MINUTES)

    const reservations = items.map(item => ({
        order_id: orderId || null,
        cart_id: cartId || null,
        product_id: item.productId,
        variant_id: item.variantId || null,
        size: item.size,
        color: item.color || null,
        quantity: item.quantity,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
        .from('inventory_reservations')
        .insert(reservations)
        .select()

    if (error) {
        console.error('Failed to create reservations:', error)
        throw new Error('Failed to reserve stock')
    }

    return data
}

/**
 * Check if stock is available (considering existing reservations)
 */
export async function checkStockAvailability(
    productId: string,
    size: string,
    requestedQty: number,
    variantId?: string,
    color?: string
): Promise<{ available: boolean; actualStock: number; reservedStock: number }> {
    const supabase = await createClient()

    // Get current inventory
    let query = supabase
        .from('product_inventory')
        .select('stock')
        .eq('product_id', productId)
        .eq('size', size)

    // Precise lookup if variantId is known
    if (variantId) {
        query = query.eq('variant_id', variantId)
    } else if (color) {
        // Fallback to color if variantId unknown
        query = query.eq('color', color)
    }

    const result = typeof (query as any).single === 'function' ? await (query as any).single() : await query
    const inventoryData = result?.data

    let actualStock = 0
    if (Array.isArray(inventoryData)) {
        actualStock = inventoryData.reduce((sum, item) => sum + (item.stock || 0), 0)
    } else if (inventoryData && typeof (inventoryData as any).stock === 'number') {
        actualStock = (inventoryData as any).stock
    }

    // Get active reservations (not expired)
    let resQuery = supabase
        .from('inventory_reservations')
        .select('quantity')
        .eq('product_id', productId)
        .eq('size', size)
        .gt('expires_at', new Date().toISOString())

    if (variantId) {
        resQuery = resQuery.eq('variant_id', variantId)
    } else if (color) {
        resQuery = resQuery.eq('color', color)
    }

    const { data: reservations } = await resQuery

    let reservedStock = 0
    if (Array.isArray(reservations)) {
        reservedStock = reservations.reduce((sum, r) => sum + (r.quantity || 0), 0)
    } else if (reservations && typeof (reservations as any).quantity === 'number') {
        reservedStock = (reservations as any).quantity
    }

    const availableStock = actualStock - reservedStock

    return {
        available: availableStock >= requestedQty,
        actualStock,
        reservedStock
    }
}

/**
 * Cleanup expired reservations
 */
export async function cleanupExpiredReservations() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('inventory_reservations')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select()

    if (error) {
        console.error('Failed to cleanup expired reservations:', error)
        return { cleaned: 0 }
    }

    return { cleaned: data?.length || 0 }
}

/**
 * Get all active reservations for a store
 */
export async function getStoreReservations(storeId: string) {
    const supabase = await createClient()

    // Get product IDs for this store
    const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', storeId)

    if (!products?.length) return []

    const productIds = products.map(p => p.id)

    const { data, error } = await supabase
        .from('inventory_reservations')
        .select(`
            *,
            products:product_id (name, image)
        `)
        .in('product_id', productIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to fetch reservations:', error)
        return []
    }

    return data
}
