export type PaymentProvider = 'razorpay' | 'stripe' | 'manual'

export interface PaymentIntent {
    id: string
    amount: number
    currency: string
    provider: PaymentProvider
    status: 'created' | 'requires_action' | 'succeeded' | 'failed'
    clientSecret?: string
}

// Pure Logic
export function formatPaymentAmount(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount)
}

export * from './webhook'
