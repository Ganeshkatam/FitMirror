'use server'

import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { cookies } from 'next/headers'
import { analytics } from '@/lib/analytics/server'

const CART_SESSION_COOKIE = 'fitmirror_cart_session'
const CART_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30
const MAX_CART_QUANTITY = 99
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type CartOwner = { userId: string; sessionId: null } | { userId: null; sessionId: string }

async function getCartSessionId(): Promise<string> {
    const cookieStore = await cookies()
    const existing = cookieStore.get(CART_SESSION_COOKIE)?.value
    if (existing && UUID_PATTERN.test(existing)) return existing

    const sessionId = crypto.randomUUID()
    cookieStore.set(CART_SESSION_COOKIE, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: CART_SESSION_TTL_SECONDS
    })
    return sessionId
}

async function getCartOwner(): Promise<CartOwner> {
    const authClient = await createClient()
    const { data: { user }, error } = await authClient.auth.getUser()
    if (error) throw error

    if (user) return { userId: user.id, sessionId: null }
    return { userId: null, sessionId: await getCartSessionId() }
}

function assertUuid(value: string, label: string): void {
    if (!UUID_PATTERN.test(value)) throw new Error(`Invalid ${label}`)
}

function assertQuantity(quantity: number): void {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_CART_QUANTITY) {
        throw new Error(`Quantity must be an integer between 1 and ${MAX_CART_QUANTITY}`)
    }
}

async function findCartId(db: ReturnType<typeof createServiceRoleClient>, owner: CartOwner): Promise<string | null> {
    let query = db.from('carts').select('id').limit(1)
    query = owner.userId ? query.eq('user_id', owner.userId) : query.eq('session_id', owner.sessionId)
    const { data, error } = await query.maybeSingle()
    if (error) throw error
    return data?.id ?? null
}

async function getOrCreateCartId(): Promise<string> {
    const db = createServiceRoleClient()
    const owner = await getCartOwner()
    const existing = await findCartId(db, owner)
    if (existing) return existing

    const insert = owner.userId ? { user_id: owner.userId } : { session_id: owner.sessionId }
    const { data, error } = await db.from('carts').insert(insert).select('id').single()
    if (!error && data) return data.id

    // A concurrent request may have created the same owner cart first.
    if (error?.code === '23505') {
        const raced = await findCartId(db, owner)
        if (raced) return raced
    }
    throw error ?? new Error('Failed to create cart')
}

export async function getCart() {
    const db = createServiceRoleClient()
    const owner = await getCartOwner()
    let query = db
        .from('carts')
        .select('*, items:cart_items(*, product:products(*), variant:product_variants(*))')
        .limit(1)

    query = owner.userId ? query.eq('user_id', owner.userId) : query.eq('session_id', owner.sessionId)
    const { data, error } = await query.maybeSingle()
    if (error) throw error
    return data
}

export async function addToCart(
    productId: string,
    offerId: string,
    size: string,
    quantity = 1,
    variantId?: string
) {
    assertUuid(productId, 'product ID')
    assertUuid(offerId, 'offer ID')
    if (variantId) assertUuid(variantId, 'variant ID')
    if (typeof size !== 'string' || size.trim().length === 0 || size.length > 32) {
        throw new Error('Invalid size')
    }
    assertQuantity(quantity)

    const db = createServiceRoleClient()
    const cartId = await getOrCreateCartId()
    let query = db
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .eq('offer_id', offerId)
        .eq('size', size.trim())

    query = variantId ? query.eq('variant_id', variantId) : query.is('variant_id', null)
    const { data: existingItem, error: lookupError } = await query.maybeSingle()
    if (lookupError) throw lookupError

    if (existingItem) {
        const nextQuantity = existingItem.quantity + quantity
        assertQuantity(nextQuantity)
        const { error } = await db.from('cart_items').update({ quantity: nextQuantity }).eq('id', existingItem.id)
        if (error) throw error
    } else {
        const { error } = await db.from('cart_items').insert({
            cart_id: cartId,
            product_id: productId,
            offer_id: offerId,
            size: size.trim(),
            quantity,
            variant_id: variantId ?? null
        })
        if (error) throw error
    }

    const owner = await getCartOwner()
    const { data: product, error: productError } = await db
        .from('products')
        .select('name, price, category')
        .eq('id', productId)
        .maybeSingle()

    if (productError) throw productError
    if (product) {
        await analytics.track(
            'Item Added to Cart',
            { productId, name: product.name, price: product.price, category: product.category, size, quantity, variantId },
            owner.userId ?? owner.sessionId
        )
    }

    return getCart()
}

export async function updateCartItemQuantity(productId: string, size: string, quantity: number) {
    assertUuid(productId, 'product ID')
    if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > MAX_CART_QUANTITY) {
        throw new Error(`Quantity must be an integer between 0 and ${MAX_CART_QUANTITY}`)
    }
    if (quantity === 0) return removeFromCart(productId, size)

    const db = createServiceRoleClient()
    const cartId = await getOrCreateCartId()
    const { error } = await db
        .from('cart_items')
        .update({ quantity })
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .eq('size', size)
    if (error) throw error
    return getCart()
}

export async function removeFromCart(productId: string, size: string) {
    assertUuid(productId, 'product ID')
    const db = createServiceRoleClient()
    const cartId = await getOrCreateCartId()
    const { error } = await db
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .eq('size', size)
    if (error) throw error
    return getCart()
}

export async function clearCart() {
    const db = createServiceRoleClient()
    const cartId = await getOrCreateCartId()
    const { error } = await db.from('cart_items').delete().eq('cart_id', cartId)
    if (error) throw error
    return getCart()
}

export async function mergeAnonymousCart() {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value
    if (!sessionId || !UUID_PATTERN.test(sessionId)) return

    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError) throw authError
    if (!user) return

    const db = createServiceRoleClient()
    const { data: guestCart, error: guestError } = await db
        .from('carts')
        .select('id, items:cart_items(*)')
        .eq('session_id', sessionId)
        .maybeSingle()

    if (guestError) throw guestError
    if (!guestCart) {
        cookieStore.delete(CART_SESSION_COOKIE)
        return
    }

    const userCartId = await getOrCreateCartId()
    for (const item of guestCart.items ?? []) {
        let query = db
            .from('cart_items')
            .select('id, quantity')
            .eq('cart_id', userCartId)
            .eq('product_id', item.product_id)
            .eq('offer_id', item.offer_id)
            .eq('size', item.size)
        query = item.variant_id ? query.eq('variant_id', item.variant_id) : query.is('variant_id', null)

        const { data: existing, error: existingError } = await query.maybeSingle()
        if (existingError) throw existingError

        if (existing) {
            const mergedQuantity = Math.min(MAX_CART_QUANTITY, existing.quantity + item.quantity)
            const { error } = await db.from('cart_items').update({ quantity: mergedQuantity }).eq('id', existing.id)
            if (error) throw error
        } else {
            const { error } = await db.from('cart_items').insert({
                cart_id: userCartId,
                product_id: item.product_id,
                offer_id: item.offer_id,
                size: item.size,
                quantity: Math.min(MAX_CART_QUANTITY, item.quantity),
                variant_id: item.variant_id
            })
            if (error) throw error
        }
    }

    const { error: deleteError } = await db.from('carts').delete().eq('id', guestCart.id).eq('session_id', sessionId)
    if (deleteError) throw deleteError
    cookieStore.delete(CART_SESSION_COOKIE)
}
