'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { normalizeProductMedia } from '../service/media'

export async function getOrder(orderId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: order, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items(
                id,
                quantity,
                price,
                size,
                product:products(
                    id,
                    name,
                    product_media(*),
                    slug
                )
            ),
            payments(
                method,
                status
            )
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()

    if (error || !order) {
        return null
    }

    if (order.items) {
        order.items = order.items.map((item: any) => {
            if (item.product) {
                item.product.images = normalizeProductMedia(item.product.product_media)
            }
            return item
        })
    }

    return order
}

export async function cancelOrder(orderId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    // 1. Fetch Order to verify ownership and status
    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('id, status, items:order_items(product_id, size, quantity)')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()

    if (fetchError || !order) throw new Error("Order not found")

    // 2. Check if cancellable
    if (!['pending', 'placed', 'processing'].includes(order.status)) { // 'placed' is our main status
        throw new Error("Order cannot be cancelled at this stage")
    }

    // 3. Update Status
    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'cancelled', cancellation_reason: 'User cancelled' })
        .eq('id', orderId)

    if (updateError) throw new Error("Failed to cancel order")

    // 4. Restock Inventory
    // We reuse decrement_stock with negative quantity to increment
    if (order.items) {
        for (const item of order.items) {
            // @ts-ignore
            const { error: stockError } = await supabase.rpc('decrement_stock', {
                p_product_id: item.product_id,
                p_size: item.size,
                p_quantity: -item.quantity // Nitrogen!
            })
            if (stockError) console.error("Failed to restock item", item, stockError)
        }
    }

    revalidatePath(`/account/orders/${orderId}`)
    revalidatePath('/account/orders')
}
