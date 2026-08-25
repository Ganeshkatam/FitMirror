import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { razorpay } from '@/lib/razorpay'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            db_order_ids // Currently passed from checkout as an array [orderId]
        } = body

        if (!db_order_ids || db_order_ids.length === 0) {
            return NextResponse.json({ error: 'Missing local order ID' }, { status: 400 })
        }
        const dbOrderId = db_order_ids[0]

        // 1. Verify Signature
        const bodyStr = razorpay_order_id + "|" + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(bodyStr.toString())
            .digest("hex")

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid Payment Signature' }, { status: 400 })
        }

        // 2. Fetch authoritative provider payment details
        const rzpPayment = await razorpay.payments.fetch(razorpay_payment_id)
        if (!rzpPayment) {
            return NextResponse.json({ error: 'Payment not found in provider' }, { status: 404 })
        }

        // 3. Fetch local authoritative order
        const supabase = await createClient()
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, total_amount, currency, status, user_id')
            .eq('id', dbOrderId)
            .single()

        if (orderError || !order) {
            return NextResponse.json({ error: 'Local order not found' }, { status: 404 })
        }

        // 4. Invariant Validation (C10, C11)
        if (rzpPayment.order_id !== razorpay_order_id) {
            return NextResponse.json({ error: 'Provider order ID mismatch' }, { status: 400 })
        }
        if (rzpPayment.currency !== 'INR' || order.currency !== 'INR') {
            return NextResponse.json({ error: 'Currency violation' }, { status: 400 })
        }
        // Strict integer paise comparison
        if (rzpPayment.amount !== Number(order.total_amount)) {
            return NextResponse.json({ error: 'Amount mismatch violation' }, { status: 400 })
        }

        // 5. Check payment status
        if (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized') {
            return NextResponse.json({ error: `Payment not captured: ${rzpPayment.status}` }, { status: 400 })
        }

        // 6. Idempotent State Transition (C12, C13)
        if (order.status === 'placed' || order.status === 'confirmed') {
            // Already processed
            return NextResponse.json({ status: 'success', paymentId: razorpay_payment_id })
        }

        // Attempt transition using PostgreSQL atomic function
        const { data: transitioned, error: transitionError } = await supabase.rpc('transition_order_status', {
            p_order_id: dbOrderId,
            p_expected_state: 'pending_payment',
            p_next_state: 'placed'
        })

        if (transitionError) {
            console.error("State transition error:", transitionError)
            return NextResponse.json({ error: 'Failed to transition order state' }, { status: 500 })
        }

        if (!transitioned) {
            // Did not transition, probably already transitioned concurrently
            return NextResponse.json({ status: 'success', message: 'Order state already advanced', paymentId: razorpay_payment_id })
        }

        // Update payment specific facts
        await supabase
            .from('orders')
            .update({
                is_paid: true,
                payment_status: 'captured' // DB enum matches
            })
            .eq('id', dbOrderId)

        // Note: Inventory was already atomically decremented during `create_order_snapshot`
        // We do not decrement stock here to prevent double-deduction.

        // Track purchase for personalization
        const { data: orderItems } = await supabase
            .from('order_items')
            .select('product_id, products(category, color, price)')
            .eq('order_id', dbOrderId)

        if (orderItems && orderItems.length > 0) {
            const { PersonalizationService } = await import('@/lib/service/personalization')
            const itemsToTrack = orderItems.map((item: any) => ({
                productId: item.product_id,
                category: item.products?.category,
                color: item.products?.color,
                price: item.products?.price
            }))
            await PersonalizationService.trackPurchase(order.user_id, itemsToTrack).catch(err =>
                console.error('Failed to track purchase', err)
            )
        }

        return NextResponse.json({ status: 'success', paymentId: razorpay_payment_id })

    } catch (error: any) {
        console.error('Razorpay Verify Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
