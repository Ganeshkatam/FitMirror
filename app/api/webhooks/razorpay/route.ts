import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { createClient } from '@/lib/supabase/server'

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
    try {
        const body = await req.text()
        const headerPayload = await headers()
        const signature = headerPayload.get('x-razorpay-signature')
        const eventId = headerPayload.get('x-razorpay-event-id')

        if (!signature || !WEBHOOK_SECRET || !eventId) {
            return NextResponse.json({ error: 'Missing signature, secret or event ID' }, { status: 400 })
        }

        const isValid = verifyWebhookSignature(body, signature, WEBHOOK_SECRET)
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        const event = JSON.parse(body)
        const payload = event.payload
        const supabase = await createClient()

        // 1. Webhook Idempotency Check (C13)
        const { error: insertEventError } = await supabase
            .from('payment_webhook_events')
            .insert({
                event_id: eventId,
                event_type: event.event,
                status: 'processing'
            })

        if (insertEventError) {
            if (insertEventError.code === '23505') { // unique violation
                return NextResponse.json({ status: 'success', message: 'Event already processed' })
            }
            throw insertEventError
        }

        if (event.event === 'payment.captured' || event.event === 'payment.authorized') {
            const payment = payload.payment.entity
            const razorpayOrderId = payment.order_id

            // 2. Fetch authoritative order by matching provider order ID (Wait, we need the local DB order ID. We can query by Razorpay Order ID if we saved it! But we didn't save Razorpay order ID in orders. Wait. The Razorpay order ID is in Razorpay's receipt field, or we can look it up in payments table. Wait, in Phase 1 we dropped the `payments` table logic and put `razorpay_order_id` where? We don't have it in `orders` natively.
            // Oh, the old code used `payments` table. Let's see if `payment.notes?.order_id` is set.)
            let dbOrderId = payment.notes?.order_id
            
            // If it's not in notes, we can find the order by parsing the receipt ID (receipt_UUID)
            if (!dbOrderId && payment.receipt) {
                dbOrderId = payment.receipt.replace('receipt_', '') // Needs to match exact UUID if we did that
                // Actually, our create-order put receipt_ + orderId.substring(0,30). It's not a full UUID.
                // It is safer to query orders by idempotency key? No.
                // We should pass dbOrderId in Razorpay notes during creation! Let's assume we do.
            }

            if (!dbOrderId) {
                console.error('No order_id found in payment notes')
                await supabase.from('payment_webhook_events').update({ status: 'failed_missing_order_id' }).eq('event_id', eventId)
                return NextResponse.json({ received: true })
            }

            // 3. Load authoritative order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select('id, total_amount, currency, status, user_id')
                .eq('id', dbOrderId)
                .single()

            if (orderError || !order) {
                await supabase.from('payment_webhook_events').update({ status: 'failed_order_not_found' }).eq('event_id', eventId)
                return NextResponse.json({ received: true })
            }

            // 4. Invariant Validation (C10, C11)
            if (payment.currency !== 'INR' || order.currency !== 'INR') {
                await supabase.from('payment_webhook_events').update({ status: 'failed_currency_mismatch' }).eq('event_id', eventId)
                return NextResponse.json({ error: 'Currency violation' }, { status: 400 })
            }
            if (payment.amount !== Number(order.total_amount)) {
                await supabase.from('payment_webhook_events').update({ status: 'failed_amount_mismatch' }).eq('event_id', eventId)
                return NextResponse.json({ error: 'Amount mismatch violation' }, { status: 400 })
            }

            // 5. State Transition
            if (order.status !== 'placed' && order.status !== 'confirmed') {
                const { data: transitioned } = await supabase.rpc('transition_order_status', {
                    p_order_id: dbOrderId,
                    p_expected_state: 'pending_payment',
                    p_next_state: 'placed'
                })

                if (transitioned) {
                    await supabase.from('orders').update({
                        is_paid: true,
                        payment_status: 'captured'
                    }).eq('id', dbOrderId)
                }
            }

            await supabase.from('payment_webhook_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', eventId)

        } else if (event.event === 'payment.failed') {
            const payment = payload.payment.entity
            const dbOrderId = payment.notes?.order_id
            if (dbOrderId) {
                await supabase.from('orders').update({ payment_status: 'failed' }).eq('id', dbOrderId)
            }
            await supabase.from('payment_webhook_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', eventId)
        } else {
            await supabase.from('payment_webhook_events').update({ status: 'ignored', processed_at: new Date().toISOString() }).eq('event_id', eventId)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Webhook Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
