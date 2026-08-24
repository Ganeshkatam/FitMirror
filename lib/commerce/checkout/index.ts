import { CartItem, CartSummary } from '../cart/types'

export type CheckoutStatus = 'idle' | 'active' | 'completed' | 'abandoned'
export type CheckoutStep = 'cart' | 'address' | 'delivery' | 'payment' | 'confirmation'

export interface Address {
    id?: string
    fullName: string
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone: string
    type: 'home' | 'work' | 'other'
}

export interface CheckoutSession {
    id: string
    status: CheckoutStatus
    step: CheckoutStep
    cartItems: CartItem[]
    cartSummary: CartSummary
    customerEmail?: string
    shippingAddress?: Address | null
    billingAddress?: Address | null
    paymentIntentId?: string | null
    createdAt: Date
    updatedAt: Date
}

export interface ValidationResult {
    valid: boolean
    errors: string[]
}

// State Machine Logic
const STEPS_ORDER: CheckoutStep[] = ['cart', 'address', 'delivery', 'payment', 'confirmation']

export function getNextStep(current: CheckoutStep): CheckoutStep | null {
    const idx = STEPS_ORDER.indexOf(current)
    if (idx === -1 || idx === STEPS_ORDER.length - 1) return null
    return STEPS_ORDER[idx + 1]
}

export function canTransitionTo(session: CheckoutSession, target: CheckoutStep): ValidationResult {
    const errors: string[] = []

    // Always allow going back
    const currentIdx = STEPS_ORDER.indexOf(session.step)
    const targetIdx = STEPS_ORDER.indexOf(target)

    if (targetIdx < currentIdx) return { valid: true, errors: [] }

    // Logic for forward transition
    if (target === 'address') {
        if (session.cartItems.length === 0) errors.push('Cart is empty')
    }

    if (target === 'delivery') {
        if (!session.shippingAddress) errors.push('Shipping address required')
    }

    if (target === 'payment') {
        if (!session.shippingAddress) errors.push('Shipping address required')
        // if (!session.deliveryMethod) errors.push('Delivery method required')
    }

    if (target === 'confirmation') {
        if (!session.paymentIntentId) errors.push('Payment not confirmed')
    }

    return {
        valid: errors.length === 0,
        errors
    }
}

export function validateAddress(addr: Address): ValidationResult {
    const errors: string[] = []
    if (!addr.fullName) errors.push('Name is required')
    if (!addr.line1) errors.push('Address Line 1 is required')
    if (!addr.city) errors.push('City is required')
    if (!addr.state) errors.push('State is required')
    if (!addr.postalCode) errors.push('Pincode is required')
    if (!addr.phone || addr.phone.length < 10) errors.push('Valid phone number is required')

    return { valid: errors.length === 0, errors }
}

