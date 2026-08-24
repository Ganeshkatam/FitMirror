'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type InventoryChangeReason =
    | 'sale'
    | 'restock'
    | 'adjustment'
    | 'damaged'
    | 'returned'
    | 'initial_stock'
    | 'manual_update'

interface LogInventoryChangeParams {
    productId: string
    size: string
    previousStock: number
    newStock: number
    reason: InventoryChangeReason
    updatedBy?: string
}

/**
 * Log an inventory change to the inventory_logs table
 */
export async function logInventoryChange({
    productId,
    size,
    previousStock,
    newStock,
    reason,
    updatedBy
}: LogInventoryChangeParams) {
    const supabase = await createClient()

    // Get current user if not provided
    let userId = updatedBy
    if (!userId) {
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id
    }

    const { error } = await supabase.from('inventory_logs').insert({
        product_id: productId,
        size,
        previous_stock: previousStock,
        new_stock: newStock,
        reason,
        updated_by: userId || null
    })

    if (error) {
        console.error('Failed to log inventory change:', error)
        // Don't throw - logging failure shouldn't break inventory operations
    }
}

/**
 * Get inventory change history for a product
 */
export async function getInventoryLogs(productId: string, limit = 50) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('inventory_logs')
        .select(`
            *,
            profiles:updated_by (
                display_name,
                email
            )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Failed to fetch inventory logs:', error)
        return []
    }

    return data
}

/**
 * Get all inventory logs for a store (seller dashboard)
 */
export async function getStoreInventoryLogs(storeId: string, limit = 100) {
    const supabase = await createClient()

    // First get all product IDs for this store
    const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', storeId)

    if (!products || products.length === 0) return []

    const productIds = products.map(p => p.id)

    const { data, error } = await supabase
        .from('inventory_logs')
        .select(`
            *,
            products:product_id (
                name,
                image
            ),
            profiles:updated_by (
                display_name,
                email
            )
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Failed to fetch store inventory logs:', error)
        return []
    }

    return data
}

/**
 * Helper to update inventory WITH automatic logging
 */
export async function updateInventoryWithLog(
    productId: string,
    size: string,
    newStock: number,
    reason: InventoryChangeReason,
    updatedBy?: string
) {
    const supabase = await createClient()

    // Get current stock
    const { data: current } = await supabase
        .from('product_inventory')
        .select('stock')
        .eq('product_id', productId)
        .eq('size', size)
        .single()

    const previousStock = current?.stock ?? 0

    // Update stock
    const { error } = await supabase
        .from('product_inventory')
        .upsert({
            product_id: productId,
            size,
            stock: newStock,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'product_id,size'
        })

    if (error) {
        throw new Error(`Failed to update inventory: ${error.message}`)
    }

    // Log the change
    await logInventoryChange({
        productId,
        size,
        previousStock,
        newStock,
        reason,
        updatedBy
    })

    revalidatePath('/seller/inventory')
    revalidatePath('/platform-admin/inventory')

    return { previousStock, newStock }
}
