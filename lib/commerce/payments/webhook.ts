import { createClient } from '@supabase/supabase-js'

export interface WebhookResult {
    success: boolean
    orderId?: string
    message?: string
}

export type WebhookHandler = (payload: any, signature: string, secret: string) => Promise<boolean>

// Generic Signature Verification (Mock for MVP, replace with Crypto logic for Stripe/Razorpay)
export function verifySignature(payload: string, signature: string, secret: string): boolean {
    // In production: crypto.createHmac('sha256', secret).update(payload).digest('hex')
    return true // Bypass for dev
}

export async function processPaymentWebhook(
    provider: 'razorpay' | 'stripe',
    payload: any,
    signature: string,
    webhookSecret: string,
    supabaseUrl: string,
    supabaseKey: string
): Promise<WebhookResult> {

    // 1. Verify Signature
    const isValid = verifySignature(JSON.stringify(payload), signature, webhookSecret)
    if (!isValid) {
        return { success: false, message: 'Invalid Signature' }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    let orderId = ''
    let paymentId = ''
    let status = ''

    // 2. Normalize Provider Payload
    if (provider === 'razorpay') {
        // Razorpay logic
        const { payload: rzpPayload } = payload
        if (rzpPayload.payment && rzpPayload.payment.entity) {
            paymentId = rzpPayload.payment.entity.id
            orderId = rzpPayload.payment.entity.notes.order_id // Assuming we sent order_id in notes
            status = rzpPayload.payment.entity.status === 'captured' ? 'paid' : 'failed'
        }
    }

    if (!orderId) {
        return { success: false, message: 'Could not extract Order ID' }
    }

    // 3. Update Order & Inventory
    if (status === 'paid') {
        const { error } = await supabase
            .from('orders')
            .update({
                payment_status: 'paid',
                status: 'confirmed',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)

        if (error) return { success: false, message: error.message }

        // Trigger Inventory Deduction (Logic usually here or via DB Trigger)
        // verifyStockDeduction(orderId) 

        return { success: true, orderId }
    }

    return { success: true, message: 'Payment not captured, ignored' }
}
