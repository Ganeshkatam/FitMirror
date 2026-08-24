import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
    try {
        const body = await req.text()
        const headerPayload = await headers()
        const signature = headerPayload.get('x-razorpay-signature')

        if (!signature || !WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
        }

        const isValid = verifyWebhookSignature(body, signature, WEBHOOK_SECRET)

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        const event = JSON.parse(body)
        const payload = event.payload
        const supabase = await createClient()

        console.log(`Processing Webhook: ${event.event}`)

        if (event.event === 'payment.captured') {
            const payment = payload.payment.entity
            const orderId = payment.notes?.order_id // We must pass order_id in notes when creating order

            if (!orderId) {
                console.error('No order_id found in payment notes')
                return NextResponse.json({ received: true })
            }

            // 1. Update Payment Record
            const { error: paymentError } = await supabase
                .from('payments')
                .update({
                    status: 'captured',
                    gateway_payment_id: payment.id,
                    method: payment.method,
                    updated_at: new Date().toISOString()
                })
                .eq('gateway_order_id', payment.order_id)

            if (paymentError) console.error('Error updating payment:', paymentError)

            // 2. Update Order Status
            const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'confirmed' })
                .eq('id', orderId)

            if (orderError) console.error('Error updating order:', orderError)

            // 3. (Optional) Trigger Inventory Decrement here or via Trigger
        } else if (event.event === 'payment.failed') {
            const payment = payload.payment.entity

            await supabase
                .from('payments')
                .update({
                    status: 'failed',
                    error_code: payment.error_code,
                    error_description: payment.error_description,
                    updated_at: new Date().toISOString()
                })
                .eq('gateway_order_id', payment.order_id)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Webhook Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
