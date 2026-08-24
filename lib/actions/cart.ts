'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Database } from '@/lib/database.types'
import { analytics } from '@/lib/analytics/server'



const CART_SESSION_COOKIE = 'fitmirror_cart_session'

// Helper: Get or Create Session ID
async function getCartSessionId(): Promise<string> {
    const cookieStore = await cookies()
    let sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value

    if (!sessionId) {
        sessionId = crypto.randomUUID()
        cookieStore.set(CART_SESSION_COOKIE, sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        })
    }
    return sessionId
}

// Fetch Cart (Guest or User)
export async function getCart() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase.from('carts').select('*, items:cart_items(*, product:products(*), variant:product_variants(*))')

    if (user) {
        query = query.eq('user_id', user.id)
    } else {
        const sessionId = await getCartSessionId()
        query = query.eq('session_id', sessionId)
    }

    const { data: carts } = await query.single()
    return carts
}

// Ensure Cart Exists
async function getOrCreateCartId(): Promise<string> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let cartId: string | undefined

    // 1. Try to find existing cart
    if (user) {
        const { data } = await supabase.from('carts').select('id').eq('user_id', user.id).single()
        cartId = data?.id
    } else {
        const sessionId = await getCartSessionId()
        const { data } = await supabase.from('carts').select('id').eq('session_id', sessionId).single()
        cartId = data?.id
    }

    // 2. Create if not exists
    if (!cartId) {
        if (user) {
            const { data, error } = await supabase.from('carts').insert({ user_id: user.id }).select('id').single()
            if (error) throw error
            cartId = data.id
        } else {
            const sessionId = await getCartSessionId()
            const { data, error } = await supabase.from('carts').insert({ session_id: sessionId }).select('id').single()
            if (error) throw error
            cartId = data.id
        }
    }

    if (!cartId) throw new Error('Failed to retrieve or create cart ID')

    return cartId
}

// Add Item
export async function addToCart(productId: string, size: string, quantity: number = 1, variantId?: string) {
    const supabase = await createClient()
    const cartId = await getOrCreateCartId()

    // Check if item exists (Now considering variantId if present)
    let query = supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .eq('size', size)

    if (variantId) {
        query = query.eq('variant_id', variantId)
    }

    const { data: existingItem } = await query.single()

    if (existingItem) {
        const { error } = await supabase
            .from('cart_items')
            .update({ quantity: existingItem.quantity + quantity })
            .eq('id', existingItem.id)
        if (error) throw error
    } else {
        const { error } = await supabase
            .from('cart_items')
            .insert({
                cart_id: cartId,
                product_id: productId,
                size,
                quantity,
                variant_id: variantId || null
            })
        if (error) throw error
    }

    // Analytics
    const { data: { user } } = await supabase.auth.getUser()
    const sessionId = (await cookies()).get(CART_SESSION_COOKIE)?.value

    // Fetch product details for analytics
    const { data: product } = await supabase.from('products').select('name, price, category').eq('id', productId).single()

    if (product) {
        await analytics.track('Item Added to Cart', {
            productId,
            name: product.name,
            price: product.price,
            category: product.category,
            size,
            quantity,
            variantId
        }, user?.id || sessionId)
    }

    // Return updated cart
    return getCart()
}

// Update Quantity
export async function updateCartItemQuantity(productId: string, size: string, quantity: number) {
    const supabase = await createClient()
    const cartId = await getOrCreateCartId()

    if (quantity <= 0) {
        return removeFromCart(productId, size)
    }

    const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .eq('size', size)

    if (error) throw error
    return getCart()
}

// Remove Item
export async function removeFromCart(productId: string, size: string) {
    const supabase = await createClient()
    const cartId = await getOrCreateCartId()

    const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .eq('size', size)

    if (error) throw error
    return getCart()
}

// Clear Cart
export async function clearCart() {
    const supabase = await createClient()
    const cartId = await getOrCreateCartId()

    const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId)

    if (error) throw error
    return getCart()
}

// Merge Guest Cart to User Cart (Call on Login)
export async function mergeAnonymousCart() {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value

    if (!sessionId) return

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Find guest cart
    const { data: guestCart } = await supabase
        .from('carts')
        .select('id, items:cart_items(*)')
        .eq('session_id', sessionId)
        .single()

    if (!guestCart) return

    // Find or Create User Cart
    let userCartId: string
    const { data: userCart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (userCart) {
        userCartId = userCart.id
    } else {
        const { data } = await supabase.from('carts').insert({ user_id: user.id }).select('id').single()
        if (!data) throw new Error('Failed to create user cart')
        userCartId = data.id
    }

    // Move items
    if (guestCart.items && guestCart.items.length > 0) {
        for (const item of guestCart.items) {
            // Check collision
            const { data: existingUserItem } = await supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('cart_id', userCartId)
                .eq('product_id', item.product_id)
                .eq('size', item.size)
                .single()

            if (existingUserItem) {
                // Update quantity
                await supabase
                    .from('cart_items')
                    .update({ quantity: existingUserItem.quantity + item.quantity })
                    .eq('id', existingUserItem.id)
            } else {
                // Insert
                await supabase
                    .from('cart_items')
                    .insert({
                        cart_id: userCartId,
                        product_id: item.product_id,
                        size: item.size,
                        quantity: item.quantity
                    })
            }
        }
    }

    // Delete guest cart
    await supabase.from('carts').delete().eq('id', guestCart.id)

    // Clear cookie
    cookieStore.delete(CART_SESSION_COOKIE)
}
