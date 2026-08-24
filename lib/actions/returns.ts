'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface ReturnItemInput {
    order_item_id: string
    quantity: number
    reason: string
    condition: string
    comment?: string
    images?: string[]
}

interface ReturnRequestInput {
    order_id: string
    items: ReturnItemInput[]
    type: 'return' | 'exchange'
    refund_method?: 'wallet' | 'bank_transfer' | 'original'
    pickup_address: any
}

export async function createReturnRequest(input: ReturnRequestInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    // 1. Fetch Order to verify eligibility
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items(*, product:products(seller_id, store_id))
        `)
        .eq('id', input.order_id)
        .eq('user_id', user.id)
        .single()

    if (orderError || !order) {
        throw new Error('Order not found')
    }

    // 2. Validate Return Window (7 Days)
    // Seller Override Logic: If seller age < 6 months, returns are mandatory.
    // For now, we enforce 7 days global rule as per plan.
    const deliveryDate = order.delivered_at ? new Date(order.delivered_at) : null
    if (!deliveryDate) {
        throw new Error('Order not delivered yet')
    }

    const diffTime = Math.abs(new Date().getTime() - deliveryDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays > 7) {
        throw new Error('Return window closed (7 days from delivery)')
    }

    // 3. Create Return Record
    const refundAmount = input.items.reduce((acc, item) => {
        const orderItem = order.items.find((i: any) => i.id === item.order_item_id)
        return acc + (orderItem ? orderItem.price * item.quantity : 0)
    }, 0)

    // TODO: Deduct return charges if any

    const { data: returnRecord, error: returnError } = await supabase
        .from('returns')
        .insert({
            order_id: input.order_id,
            user_id: user.id,
            store_id: order.items[0]?.product?.store_id, // Assuming single store order for now
            return_number: `RET-${Date.now()}`,
            status: 'requested',
            type: input.type,
            pickup_address: input.pickup_address,
            refund_amount: refundAmount,
            refund_method: input.refund_method || 'wallet',
            admin_notes: 'Created via web portal'
        })
        .select()
        .single()

    if (returnError) {
        console.error('Return creation error:', returnError)
        throw new Error('Failed to create return request')
    }

    // 4. Create Return Items
    const returnItemsData = input.items.map(item => ({
        return_id: returnRecord.id,
        order_item_id: item.order_item_id,
        quantity: item.quantity,
        reason: item.reason,
        condition: item.condition,
        comment: item.comment,
        images: item.images || []
    }))

    const { error: itemsError } = await supabase
        .from('return_items')
        .insert(returnItemsData)

    if (itemsError) {
        console.error('Return items error:', itemsError)
        // Cleanup return record? Or let it be failed?
        throw new Error('Failed to save return items')
    }

    // 5. Notify User (Email/SMS)
    try {
        const { sendReturnCreatedNotification } = await import('@/lib/notifications')
        // Using shipping address phone if user phone not available in auth metadata
        const phone = user.user_metadata?.phone || order.shipping_address?.mobile

        await sendReturnCreatedNotification(
            { email: user.email || '', phone },
            returnRecord.return_number,
            order.order_number
        )
    } catch (e) {
        console.error('Failed to send user notifications', e)
        // Don't fail the request if notification fails
    }

    revalidatePath(`/account/orders/${input.order_id}`)
    redirect(`/account/orders/${input.order_id}?tab=return`)
}
