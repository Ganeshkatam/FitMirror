import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            order_metadata // Passed from frontend to help us sync with our DB order if needed
        } = body

        // 1. Verify Signature
        const bodyStr = razorpay_order_id + "|" + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(bodyStr.toString())
            .digest("hex")

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid Payment Signature' }, { status: 400 })
        }

        // 2. Lookup related order via Payments table
        const supabase = await createClient()

        // Find the payment record associated with this Razorpay Order ID
        const { data: paymentRecord, error: payFetchError } = await supabase
            .from('payments')
            .select('order_id, id, related_orders, status')
            .eq('gateway_order_id', razorpay_order_id)
            .single()

        if (payFetchError || !paymentRecord) {
            console.error("Payment Record not found for order", razorpay_order_id)
        } else {
            // Idempotency Check
            if (paymentRecord.status === 'success') {
                return NextResponse.json({ status: 'success', message: 'Payment already processed', paymentId: razorpay_payment_id })
            }

            // Update Payment Status
            await supabase
                .from('payments')
                .update({
                    status: 'success',
                    gateway_payment_id: razorpay_payment_id
                })
                .eq('id', paymentRecord.id)

            // Determine impacted orders
            let orderIdsToUpdate: string[] = []
            if (paymentRecord.related_orders && paymentRecord.related_orders.length > 0) {
                orderIdsToUpdate = paymentRecord.related_orders
            } else if (paymentRecord.order_id) {
                orderIdsToUpdate = [paymentRecord.order_id]
            }

            if (orderIdsToUpdate.length > 0) {
                // Update Order Status
                await supabase
                    .from('orders')
                    .update({ status: 'placed', is_paid: true }) // Added is_paid
                    .in('id', orderIdsToUpdate)

                // Deduct Stock & Track Purchase
                const { data: orderDetails } = await supabase
                    .from('orders')
                    .select('user_id, order_items(product_id, size, quantity, products(category, color, price))')
                    .in('id', orderIdsToUpdate)

                if (orderDetails && orderDetails.length > 0) {
                    const { PersonalizationService } = await import('@/lib/service/personalization')

                    for (const order of orderDetails) {
                        const itemsToTrack: any[] = []

                        if (order.order_items) {
                            for (const item of order.order_items) {
                                // 1. Deduct Stock
                                const { error } = await supabase.rpc('decrement_stock', {
                                    p_product_id: item.product_id,
                                    p_size: item.size,
                                    p_quantity: item.quantity
                                })
                                if (error) console.error(`Failed to decrement stock for ${item.product_id}:`, error)

                                // 2. Prepare tracking data
                                if (item.products) {
                                    // @ts-ignore
                                    itemsToTrack.push({
                                        productId: item.product_id,
                                        // @ts-ignore
                                        category: item.products.category,
                                        // @ts-ignore
                                        color: item.products.color,
                                        // @ts-ignore
                                        price: item.products.price
                                    })
                                }
                            }
                        }

                        // 3. Track Purchase for Personalization
                        if (order.user_id && itemsToTrack.length > 0) {
                            await PersonalizationService.trackPurchase(order.user_id, itemsToTrack).catch(err =>
                                console.error('Failed to track purchase', err)
                            )
                        }
                    }
                }
            }
        }

        return NextResponse.json({ status: 'success', paymentId: razorpay_payment_id })

    } catch (error: any) {
        console.error('Razorpay Verify Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
