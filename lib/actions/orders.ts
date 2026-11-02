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

    // Atomic order cancellation and inventory restoration via RPC
    const { data, error } = await supabase.rpc('cancel_order', {
        p_order_id: orderId,
        p_user_id: user.id,
        p_reason: 'User cancelled'
    })

    if (error) {
        console.error("Failed to cancel order atomically:", error)
        throw new Error(error.message || "Failed to cancel order")
    }

    revalidatePath(`/account/orders/${orderId}`)
    revalidatePath('/account/orders')
    return data
}
