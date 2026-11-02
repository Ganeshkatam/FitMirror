import Razorpay from 'razorpay'
import crypto from 'crypto'

let _razorpay: Razorpay | null = null

export function getRazorpay(): Razorpay {
    if (!_razorpay) {
        const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        const key_secret = process.env.RAZORPAY_KEY_SECRET

        if (!key_id || !key_secret) {
            throw new Error('Razorpay credentials missing: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set')
        }

        _razorpay = new Razorpay({
            key_id,
            key_secret,
        })
    }
    return _razorpay
}

// Lazy proxy so importing razorpay during build time or in webhook routes does not throw when env vars are absent
export const razorpay = new Proxy({} as Razorpay, {
    get(_target, prop) {
        const instance = getRazorpay()
        const value = (instance as any)[prop]
        if (typeof value === 'function') {
            return value.bind(instance)
        }
        return value
    }
})

export function verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
): boolean {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex')

    return expectedSignature === signature
}

export function verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) return false
    const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex')

    return generatedSignature === signature
}
