import { CheckoutSession } from '../checkout'
import { CartItem } from '../cart/types'

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface OrderItem {
    id: string
    productId: string
    variantId?: string | null
    title: string
    size: string
    quantity: number
    price: number
    total: number
    sku?: string
    image?: string
}

export interface Order {
    id: string
    customerId: string
    email: string
    items: OrderItem[]
    currency: string
    subtotal: number
    tax: number
    shipping: number
    discountTotal: number
    total: number
    status: OrderStatus
    paymentStatus: PaymentStatus

    // Address Snapshots
    shippingAddress: any
    billingAddress: any

    createdAt: Date
    updatedAt: Date
}

// Pure Logic
export function canCancelOrder(order: Order): boolean {
    return ['pending', 'confirmed', 'processing'].includes(order.status)
}

export function createOrderFromCheckout(session: CheckoutSession): Order {
    if (!session.shippingAddress) throw new Error("Shipping address missing")

    const items: OrderItem[] = session.cartItems.map(item => ({
        id: crypto.randomUUID(),
        productId: item.productId,
        variantId: item.variantId,
        title: item.productName,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        sku: item.sku,
        image: item.productImage
    }))

    return {
        id: crypto.randomUUID(),
        customerId: 'guest', // Should be replaced by actual user ID
        email: session.customerEmail || '',
        items,
        currency: session.cartSummary.currency,
        subtotal: session.cartSummary.subtotal,
        tax: session.cartSummary.tax,
        shipping: session.cartSummary.shipping,
        discountTotal: session.cartSummary.discountTotal,
        total: session.cartSummary.total,
        status: 'pending',
        paymentStatus: 'pending',
        shippingAddress: session.shippingAddress,
        billingAddress: session.billingAddress || session.shippingAddress,
        createdAt: new Date(),
        updatedAt: new Date()
    }
}

export function calculateOrderTotal(items: OrderItem[], tax: number, shipping: number): number {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    return subtotal + tax + shipping
}
