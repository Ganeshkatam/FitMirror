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

    // 1. Get Cart
    const cart = await getCart()
    if (!cart || !cart.items || cart.items.length === 0) {
        throw new Error("Cart is empty")
    }

    // 4. Parse Address (Moved up for validation)
    const addressData: Address = {
        fullName: formData.get('full_name') as string,
        line1: formData.get('address') as string,
        city: formData.get('city') as string,
        postalCode: formData.get('zip') as string,
        state: 'N/A', // Form data missing state, default or add field
        country: 'India',
        phone: formData.get('phone') as string,
        type: 'home'
    }

    // Validate Address
    const addressValidation = validateAddress(addressData)
    if (!addressValidation.valid) {
        throw new Error("Invalid Address: " + addressValidation.errors.join(', '))
    }

    // 2. Prepare Checkout Session for Validation
    const cartItems = cart.items.map((item: any) => ({
        productId: item.product_id,
        productName: item.product.name,
        productImage: item.product.image || item.product.image_url,
        price: item.product.price,
        size: item.size,
        quantity: item.quantity,
        storeId: item.product.store_id,
        variantId: item.variant_id // Added variantId
    }))

    // Calculate Summary using Engine
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

    // 3.1 Construct Calculation Payload for RPC
    // We map the intent data that the RPC requires
    const calculationPayload = {
        subtotalPaise: cartSummary.subtotal * 100, // assuming cartSummary is in INR
        discountPaise: cartSummary.discount * 100,
        taxPaise: cartSummary.tax * 100,
        shippingPaise: cartSummary.shipping * 100,
        totalPaise: cartSummary.total * 100,
        lines: cartItems.map((item: any) => ({
            productId: item.productId,
            offerId: item.offerId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPricePaise: item.price * 100,
            taxRuleId: null, // to be updated later if needed
            taxRateBps: 0,
            discountAmountPaise: 0,
            taxableAmountPaise: item.price * 100,
            taxAmountPaise: 0,
            totalAmountPaise: (item.price * item.quantity) * 100
        }))
    }

    const idempotencyKey = session.id

    // 4. Create Order via RPC (Handles stock lock, invariants, and snapshotting)
    const { data: orderId, error } = await supabase.rpc('create_order_snapshot', {
        p_idempotency_key: idempotencyKey,
        p_user_id: user.id,
        p_coupon_id: null, // Future: Handle coupon application
        p_shipping_method_id: null,
        p_calculation: calculationPayload
    })

    if (error) {
        console.error("Checkout Failed - RPC Error:", error)
        throw new Error("Checkout failed during processing. " + error.message)
    }

    // 5. Update Order with Address (since the RPC doesn't handle shipping details yet)
    await supabase.from('orders').update({
        shipping_address: addressData,
        payment_method: 'cod' // Assuming COD for now
    }).eq('id', orderId)

    // 6. Clear Cart
    await supabase.from('cart_items').delete().eq('cart_id', cart.id)

    // Analytics
    await analytics.track('Order Completed', {
        orderId,
        total: cartSummary.total,
        currency: 'INR',
        itemCount: cartItems.length
    }, user.id)

    // 7. Redirect
    redirect(`/order-confirmation?orders=${orderId}`)
}

export async function finalizeOrder(razorpayOrderId: string) {
    const supabase = await createClient()

    // 1. Get Order Item to find user/validation
    const { data: payment, error } = await supabase
        .from('payments')
        .select('order_id, id, related_orders')
        .eq('gateway_order_id', razorpayOrderId)
        .single()

    if (error || !payment) {
        throw new Error("Payment record not found")
    }

    // 2. Clear Cart
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        // We can find the cart by user_id
        await supabase.from('cart_items').delete().eq('user_id', user.id)

        // Ensure cart is fully cleared (redundancy)
        const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).single()
        if (cart) {
            await supabase.from('cart_items').delete().eq('cart_id', cart.id)
        }
    }

    // 3. Redirect
    const orderIds = payment.related_orders && payment.related_orders.length > 0
        ? payment.related_orders.join(',')
        : payment.order_id

    redirect(`/order-confirmation?orders=${orderIds}`)
}
