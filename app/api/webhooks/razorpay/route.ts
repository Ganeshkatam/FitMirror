import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function POST(req: NextRequest) {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
        const body = await req.text()
        const signature = req.headers.get('x-razorpay-signature')
        const eventId = req.headers.get('x-razorpay-event-id')

        if (!signature || !webhookSecret || !eventId) {
            return NextResponse.json({ error: 'Missing signature, secret or event ID' }, { status: 400 })
        }

        const isValid = verifyWebhookSignature(body, signature, webhookSecret)
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        const event = JSON.parse(body)
        const payload = event.payload
        const supabase = createServiceRoleClient()

        // 1. Durable Idempotency & Claim Lifecycle
        const { data: existingEvent } = await supabase
            .from('payment_webhook_events')
            .select('event_id, status, created_at, updated_at')
            .eq('event_id', eventId)
            .maybeSingle()

        if (existingEvent) {
            if (existingEvent.status === 'processed' || existingEvent.status === 'ignored') {
                return NextResponse.json({ status: 'success', message: 'Event already processed' }, { status: 200 })
            }
            if (existingEvent.status === 'failed_terminal') {
                return NextResponse.json({ status: 'ignored', message: 'Terminal event failure previously recorded' }, { status: 200 })
            }
            if (existingEvent.status === 'processing') {
                const lastUpdated = new Date(existingEvent.updated_at || existingEvent.created_at).getTime()
                const ageSeconds = (Date.now() - lastUpdated) / 1000
                // If claim is recent (< 60s), consider it in flight to prevent duplicate concurrency
                if (ageSeconds < 60) {
                    return NextResponse.json({ status: 'in_flight', message: 'Event currently processing' }, { status: 200 })
                }
                // Stale claim: worker timed out or died; reclaim for retry
                await supabase
                    .from('payment_webhook_events')
                    .update({ status: 'processing', updated_at: new Date().toISOString() })
                    .eq('event_id', eventId)
            } else if (existingEvent.status === 'failed_retryable') {
                // Retryable failure: reclaim event
                await supabase
                    .from('payment_webhook_events')
                    .update({ status: 'processing', updated_at: new Date().toISOString() })
                    .eq('event_id', eventId)
            }
        } else {
            // New event: claim idempotency key
            const { error: insertError } = await supabase
                .from('payment_webhook_events')
                .insert({
                    event_id: eventId,
                    event_type: event.event,
                    status: 'processing'
                })

            if (insertError) {
                if (insertError.code === '23505') { // Unique constraint violation (concurrent race)
                    return NextResponse.json({ status: 'success', message: 'Event already claimed' }, { status: 200 })
                }
                throw insertError
            }
        }

        // 2. Transactional Event Processing with Monotonic Ordering Protections
        try {
            if (event.event === 'payment.captured') {
                const payment = payload.payment?.entity
                if (!payment) {
                    throw new Error('Malformed payment entity in captured payload')
                }

                const dbOrderId = payment.notes?.order_id || (payment.receipt ? payment.receipt.replace('receipt_', '') : null)

                if (!dbOrderId) {
                    await supabase
                        .from('payment_webhook_events')
                        .update({ status: 'failed_terminal', error_message: 'No order_id in payment notes or receipt' })
                        .eq('event_id', eventId)
                    return NextResponse.json({ received: true })
                }

                // 3. Load authoritative order
                const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .select('id, total_amount, currency, status, payment_status, is_paid')
                    .eq('id', dbOrderId)
                    .maybeSingle()

                if (orderError || !order) {
                    await supabase
                        .from('payment_webhook_events')
                        .update({ status: 'failed_terminal', error_message: 'Authoritative order not found' })
                        .eq('event_id', eventId)
                    return NextResponse.json({ received: true })
                }

                // 4. Invariant Validation
                if (payment.currency !== 'INR' || order.currency !== 'INR') {
                    await supabase
                        .from('payment_webhook_events')
                        .update({ status: 'failed_terminal', error_message: 'Currency violation' })
                        .eq('event_id', eventId)
                    return NextResponse.json({ error: 'Currency violation' }, { status: 400 })
                }
                if (payment.amount !== Number(order.total_amount)) {
                    await supabase
                        .from('payment_webhook_events')
                        .update({ status: 'failed_terminal', error_message: 'Amount mismatch violation' })
                        .eq('event_id', eventId)
                    return NextResponse.json({ error: 'Amount mismatch violation' }, { status: 400 })
                }

                // 5. State Transition: transition to placed if not already placed or confirmed
                if (order.status !== 'placed' && order.status !== 'confirmed') {
                    await supabase.rpc('transition_order_status', {
                        p_order_id: dbOrderId,
                        p_expected_state: 'pending_payment',
                        p_next_state: 'placed'
                    })
                }

                // Monotonic paid update: MUST mark order as paid & captured regardless of whether
                // status was already placed/confirmed earlier (e.g. via client verification)
                await supabase.from('orders').update({
                    is_paid: true,
                    payment_status: 'captured',
                    updated_at: new Date().toISOString()
                }).eq('id', dbOrderId)

                await supabase.from('payment_webhook_events').update({
                    status: 'processed',
                    processed_at: new Date().toISOString()
                }).eq('event_id', eventId)

            } else if (event.event === 'payment.authorized') {
                const payment = payload.payment?.entity
                const dbOrderId = payment?.notes?.order_id

                if (dbOrderId) {
                    const { data: order } = await supabase
                        .from('orders')
                        .select('id, payment_status, is_paid')
                        .eq('id', dbOrderId)
                        .maybeSingle()

                    // Monotonic check: Never downgrade an already captured payment
                    if (order && !order.is_paid && order.payment_status !== 'captured') {
                        await supabase.from('orders').update({
                            payment_status: 'authorized',
                            updated_at: new Date().toISOString()
                        }).eq('id', dbOrderId)
                    }
                }

                await supabase.from('payment_webhook_events').update({
                    status: 'processed',
                    processed_at: new Date().toISOString()
                }).eq('event_id', eventId)

            } else if (event.event === 'payment.failed') {
                const payment = payload.payment?.entity
                const dbOrderId = payment?.notes?.order_id

                if (dbOrderId) {
                    const { data: order } = await supabase
                        .from('orders')
                        .select('id, payment_status, is_paid')
                        .eq('id', dbOrderId)
                        .maybeSingle()

                    // Monotonic check: Never downgrade an already captured payment to failed
                    if (order && !order.is_paid && order.payment_status !== 'captured') {
                        await supabase.from('orders').update({
                            payment_status: 'failed',
                            updated_at: new Date().toISOString()
                        }).eq('id', dbOrderId)
                    }
                }

                await supabase.from('payment_webhook_events').update({
                    status: 'processed',
                    processed_at: new Date().toISOString()
                }).eq('event_id', eventId)

            } else {
                await supabase.from('payment_webhook_events').update({
                    status: 'ignored',
                    processed_at: new Date().toISOString()
                }).eq('event_id', eventId)
            }

            return NextResponse.json({ received: true })
        } catch (processError: any) {
            console.error('Webhook processing exception:', processError)
            // Record retryable failure so subsequent webhook attempts can reclaim
            await supabase.from('payment_webhook_events').update({
                status: 'failed_retryable',
                error_message: processError?.message || 'Processing failed',
                updated_at: new Date().toISOString()
            }).eq('event_id', eventId)

            return NextResponse.json({ error: 'Processing failure; retry requested' }, { status: 500 })
        }

    } catch (error: any) {
        console.error('Webhook Ingestion Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
