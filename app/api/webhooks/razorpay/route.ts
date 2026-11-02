import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function POST(req: NextRequest) {
    let claimantId: string | null = null
    let eventId: string | null = null
    let supabaseClient: any = null

    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
        const body = await req.text()
        const signature = req.headers.get('x-razorpay-signature')
        eventId = req.headers.get('x-razorpay-event-id')

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
        supabaseClient = supabase
        claimantId = crypto.randomUUID()

        // 1. Atomic CAS Webhook Event Claiming
        const { data: claimResult, error: claimError } = await supabase.rpc('claim_payment_webhook_event', {
            p_event_id: eventId,
            p_event_type: event.event,
            p_claimant_id: claimantId,
            p_lease_seconds: 60
        })

        if (claimError) {
            console.error('Error claiming webhook event:', claimError)
            throw claimError
        }

        if (!claimResult?.claimed) {
            if (claimResult?.action === 'already_processed') {
                return NextResponse.json({ status: 'success', message: 'Event already processed' }, { status: 200 })
            }
            if (claimResult?.action === 'terminal_failure') {
                return NextResponse.json({ status: 'ignored', message: 'Terminal event failure previously recorded' }, { status: 200 })
            }
            if (claimResult?.action === 'in_flight_locked') {
                return NextResponse.json({ status: 'in_flight', message: 'Event currently processing' }, { status: 200 })
            }
            return NextResponse.json({ status: 'ignored', message: 'Event ignored by claim policy' }, { status: 200 })
        }

        // 2. Transactional Event Processing with Monotonic Invariant Enforcement
        if (event.event === 'payment.captured') {
            const payment = payload.payment?.entity
            if (!payment) {
                throw new Error('Malformed payment entity in captured payload')
            }

            const dbOrderId = payment.notes?.order_id || (payment.receipt ? payment.receipt.replace('receipt_', '') : null)

            if (!dbOrderId) {
                const { error: markTerminalError } = await supabase
                    .from('payment_webhook_events')
                    .update({
                        status: 'failed_terminal',
                        error_message: 'No order_id in payment notes or receipt',
                        claimed_by: null,
                        lease_expires_at: null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('event_id', eventId)

                if (markTerminalError) throw markTerminalError
                return NextResponse.json({ received: true })
            }

            const { data: captureResult, error: captureError } = await supabase.rpc('record_captured_payment', {
                p_order_id: dbOrderId,
                p_event_id: eventId,
                p_claimant_id: claimantId,
                p_razorpay_payment_id: payment.id,
                p_razorpay_order_id: payment.order_id || null,
                p_amount: payment.amount,
                p_currency: payment.currency
            })

            if (captureError) {
                console.error('Error in record_captured_payment RPC:', captureError)
                throw captureError
            }

            if (!captureResult?.success) {
                if (captureResult?.terminal) {
                    console.warn(`Terminal capture failure recorded: ${captureResult?.error}`)
                    return NextResponse.json({ status: 'terminal_failure', reason: captureResult?.error }, { status: 200 })
                }
                throw new Error(captureResult?.error || 'Failed to capture payment')
            }

            return NextResponse.json({ status: 'success', order_id: dbOrderId })
        } else if (event.event === 'payment.authorized' || event.event === 'payment.failed') {
            const payment = payload.payment?.entity
            const dbOrderId = payment?.notes?.order_id || (payment?.receipt ? payment.receipt.replace('receipt_', '') : null)
            const newStatus = event.event === 'payment.authorized' ? 'authorized' : 'failed'

            if (dbOrderId) {
                const { data: statusResult, error: statusError } = await supabase.rpc('record_payment_status', {
                    p_order_id: dbOrderId,
                    p_event_id: eventId,
                    p_claimant_id: claimantId,
                    p_razorpay_payment_id: payment?.id || null,
                    p_razorpay_order_id: payment?.order_id || null,
                    p_new_status: newStatus
                })

                if (statusError) {
                    console.error('Error in record_payment_status RPC:', statusError)
                    throw statusError
                }
            } else {
                // Mark processed even if dbOrderId is absent
                const { error: markError } = await supabase
                    .from('payment_webhook_events')
                    .update({
                        status: 'processed',
                        processed_at: new Date().toISOString(),
                        claimed_by: null,
                        lease_expires_at: null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('event_id', eventId)

                if (markError) throw markError
            }

            return NextResponse.json({ status: 'success' })
        } else {
            // Unhandled event types marked processed to avoid duplicate delivery retries
            const { error: markUnhandledError } = await supabase
                .from('payment_webhook_events')
                .update({
                    status: 'processed',
                    processed_at: new Date().toISOString(),
                    claimed_by: null,
                    lease_expires_at: null,
                    updated_at: new Date().toISOString()
                })
                .eq('event_id', eventId)

            if (markUnhandledError) throw markUnhandledError
            return NextResponse.json({ received: true })
        }
    } catch (err: any) {
        console.error('Webhook processing exception:', err)

        if (supabaseClient && eventId && claimantId) {
            try {
                await supabaseClient.rpc('release_webhook_claim_on_failure', {
                    p_event_id: eventId,
                    p_claimant_id: claimantId,
                    p_error_message: err.message || 'Unknown processing error'
                })
            } catch (releaseErr) {
                console.error('Failed to release webhook claim on failure:', releaseErr)
            }
        }

        return NextResponse.json({ error: 'Webhook processing failed', details: err.message }, { status: 500 })
    }
}
