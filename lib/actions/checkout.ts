'use server'

import { createClient } from '@/lib/supabase/server'
import { getCart } from '@/lib/actions/cart'
import { redirect } from 'next/navigation'
import { validateAddress, Address, CheckoutSession } from '@/lib/commerce/checkout'
import { calculateOrderTotal, OrderItem } from '@/lib/commerce/orders'
import { analytics } from '@/lib/analytics/server'

export async function placeOrder(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Must be logged in to checkout")
    }

    const cart = await getCart()
    if (!cart || !cart.items || cart.items.length === 0) {
        throw new Error("Cart is empty")
    }

    const addressData: Address = {
        fullName: formData.get('full_name') as string,
        line1: formData.get('address') as string,
        city: formData.get('city') as string,
        postalCode: formData.get('zip') as string,
        state: 'N/A',
        country: 'India',
        phone: formData.get('phone') as string,
        type: 'home'
    }

    const addressValidation = validateAddress(addressData)
    if (!addressValidation.valid) {
        throw new Error("Invalid Address: " + addressValidation.errors.join(', '))
    }

    const cartItems = cart.items.map((item: any) => ({
        productId: item.product_id,
        productName: item.product.name,
        productImage: item.product.image || item.product.image_url,
        price: item.product.price,
        size: item.size,
        quantity: item.quantity,
        offerId: item.offer_id,
        variantId: item.variant_id
    }))

    const { calculateCartSummary } = await import('@/lib/commerce/cart/calculations')
    const cartSummary = calculateCartSummary(cartItems)

    const session: CheckoutSession = {
        id: crypto.randomUUID(),
        status: 'active',
        step: 'confirmation',
        cartItems,
        cartSummary,
        customerEmail: user.email,
        shippingAddress: addressData,
        createdAt: new Date(),
        updatedAt: new Date()
    }

    const linesPayload = cartItems.map((item: any) => ({
        productId: item.productId,
        offerId: item.offerId,
        variantId: item.variantId,
        quantity: item.quantity
    }))

    const { data: orderId, error } = await supabase.rpc('create_order_snapshot', {
        p_idempotency_key: session.id,
        p_user_id: user.id,
        p_coupon_id: null,
        p_shipping_method_id: null,
        p_address_id: null,
        p_shipping_address: addressData,
        p_payment_method: 'cod',
        p_lines: linesPayload
    })

    if (error) {
        console.error("Checkout Failed - RPC Error:", error)
        throw new Error("Checkout failed during processing. " + error.message)
    }

    const { error: clearError } = await supabase.from('cart_items').delete().eq('cart_id', cart.id)
    if (clearError) throw clearError

    await analytics.track('Order Completed', {
        orderId,
        total: cartSummary.total,
        currency: 'INR',
        itemCount: cartItems.length
    }, user.id)

    redirect(`/order-confirmation?orders=${orderId}`)
}

export async function finalizeOrder(razorpayOrderId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: payment, error } = await supabase
        .from('payments')
        .select('order_id, id, related_orders')
        .eq('gateway_order_id', razorpayOrderId)
        .single()

    if (error || !payment) throw new Error("Payment record not found")

    if (user) {
        const { data: cart, error: cartError } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()

        if (cartError) throw cartError
        if (cart) {
            const { error: clearError } = await supabase.from('cart_items').delete().eq('cart_id', cart.id)
            if (clearError) throw clearError
        }
    }

    const orderIds = payment.related_orders && payment.related_orders.length > 0
        ? payment.related_orders.join(',')
        : payment.order_id

    redirect(`/order-confirmation?orders=${encodeURIComponent(orderIds)}`)
}
