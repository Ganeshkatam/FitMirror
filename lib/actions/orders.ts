'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getOrder(orderId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: order, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items (
                *,
                product:products (
                    name,
                    brand
                )
            ),
            shipping_address:addresses!orders_shipping_address_id_fkey (*),
            billing_address:addresses!orders_billing_address_id_fkey (*)
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()

    if (error) {
        console.error("Error fetching order:", error)
        return null
    }

    return order
}

export async function getOrders() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items (
                *,
                product:products (
                    name
                )
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching orders:", error)
        return []
    }

    return orders
}

export async function getOrderByNumber(orderNumber: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: order, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items (
                *,
                product:products (
                    name,
                    brand
                )
            ),
            shipping_address:addresses!orders_shipping_address_id_fkey (*),
            billing_address:addresses!orders_billing_address_id_fkey (*)
        `)
        .eq('order_number', orderNumber)
        .eq('user_id', user.id)
        .single()

    if (error) {
        console.error("Error fetching order by number:", error)
        return null
    }

    return order
}

export async function cancelOrder(orderId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    // Atomic order cancellation and inventory restoration via RPC bound to auth.uid()
    const { data, error } = await supabase.rpc('cancel_order', {
        p_order_id: orderId,
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
