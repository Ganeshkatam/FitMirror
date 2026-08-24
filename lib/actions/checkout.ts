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

    // 3.1 Stock Validation
    const { checkStockAvailability } = await import('@/lib/actions/inventory-reservations')

    for (const item of cartItems) {
        const stockStatus = await checkStockAvailability(
            item.productId,
            item.size,
            item.quantity,
            item.variantId,
            undefined
        )

        if (!stockStatus.available) {
            throw new Error(`Item ${item.productName} (${item.size}) is out of stock. Available: ${stockStatus.actualStock - stockStatus.reservedStock}`)
        }
    }

    // 5. Group Items by Store (Marketplace Logic)
    const storeOrders = new Map<string, typeof cartItems>()

    cartItems.forEach((item: any) => {
        const storeId = item.storeId
        if (!storeId) return // Skip invalid items
        if (!storeOrders.has(storeId)) {
            storeOrders.set(storeId, [])
        }
        storeOrders.get(storeId)?.push(item)
    })

    if (storeOrders.size === 0) {
        throw new Error("No valid items to checkout")
    }

    // 6. Create Transactions
    const orderIds = []

    try {
        for (const [storeId, items] of storeOrders) {
            // Engine Calculation
            // We map CartItem to OrderItem structure implicitly for calc if needed, 
            // but calculateOrderTotal accepts {total: number}[] 
            // We need to implement calculateItemsTotal or just loop. 
            // Let's use the reduction here but relying on Engine Types if we had them fully mapped DB-side.
            // For MVP, we stick to the simple reduce but ensure it handles floats safely if we used currency lib.

            // Re-map to Order Item Schema for DB
            const orderItems = items.map((item: any) => ({
                product_id: item.productId,
                name: item.productName,
                price: item.price,
                quantity: item.quantity,
                size: item.size,
                variant_id: item.variantId, // Added variant_id
                image: item.productImage,
                total: item.price * item.quantity
            }))

            const total = calculateOrderTotal(orderItems, 0, 0) // tax=0, shipping=0 for now

            // Insert Order
            const { data: order, error } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    store_id: storeId,
                    items: orderItems, // JSONB
                    total_amount: total,
                    status: 'placed',
                    payment_status: 'cod',
                    shipping_address: addressData,
                    created_at: new Date().toISOString()
                })
                .select('id')
                .single()

            if (error) throw error
            orderIds.push(order.id)
        }

        // 7. Clear Cart
        await supabase.from('cart_items').delete().eq('cart_id', cart.id)

        // Analytics
        await analytics.track('Order Completed', {
            orderIds,
            total: cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
            currency: 'INR',
            itemCount: cartItems.length
        }, user.id)

    } catch (err) {
        console.error("Checkout Failed", err)
        throw new Error("Checkout Failed, please try again.")
    }

    // 8. Redirect
    redirect(`/order-confirmation?orders=${orderIds.join(',')}`)
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
