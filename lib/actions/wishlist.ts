'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'

// Generate a unique, short share code
function generateShareCode(): string {
    return nanoid(8)
}

export async function createWishlistShare(name?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Check if user already has a share
    const { data: existing } = await supabase
        .from('wishlist_shares')
        .select('id, share_code')
        .eq('user_id', user.id)
        .single()

    if (existing) {
        // Update name if provided
        if (name) {
            await supabase
                .from('wishlist_shares')
                .update({ name })
                .eq('id', existing.id)
        }
        return { shareCode: existing.share_code }
    }

    // Create new share
    const shareCode = generateShareCode()
    const { error } = await supabase.from('wishlist_shares').insert({
        user_id: user.id,
        share_code: shareCode,
        is_public: true,
        name: name || null
    })

    if (error) {
        console.error('Create Share Error:', error)
        return { error: 'Failed to create share link' }
    }

    return { shareCode }
}

export async function toggleWishlistVisibility() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { data: existing } = await supabase
        .from('wishlist_shares')
        .select('id, is_public')
        .eq('user_id', user.id)
        .single()

    if (!existing) {
        return { error: 'No share link exists' }
    }

    const { error } = await supabase
        .from('wishlist_shares')
        .update({ is_public: !existing.is_public })
        .eq('id', existing.id)

    if (error) {
        return { error: 'Failed to update visibility' }
    }

    revalidatePath('/account/wishlist')
    return { isPublic: !existing.is_public }
}

export async function getShareStatus() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { exists: false, isPublic: false, shareCode: null }
    }

    const { data } = await supabase
        .from('wishlist_shares')
        .select('share_code, is_public, name')
        .eq('user_id', user.id)
        .single()

    if (!data) {
        return { exists: false, isPublic: false, shareCode: null }
    }

    return {
        exists: true,
        isPublic: data.is_public,
        shareCode: data.share_code,
        name: data.name
    }
}

export async function subscribeToStockAlert(productId: string, size?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Please login to receive stock alerts' }
    }

    // Check if already subscribed
    let query = supabase
        .from('stock_alerts')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('notified', false)

    if (size) {
        query = query.eq('size', size)
    }

    const { data: existing } = await query.single()

    if (existing) {
        return { error: 'You are already subscribed to this alert' }
    }

    const { error } = await supabase.from('stock_alerts').insert({
        user_id: user.id,
        product_id: productId,
        size: size || null,
        notified: false
    })

    if (error) {
        console.error('Stock Alert Error:', error)
        return { error: 'Failed to create alert' }
    }


    return { success: true }
}

export async function subscribeToPriceAlert(productId: string, targetPrice?: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Please login to set price alerts' }
    }

    // Check if already subscribed
    const { data: existing } = await supabase
        .from('price_alerts')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('is_active', true)
        .single()

    if (existing) {
        return { error: 'You already have an active alert for this product' }
    }

    const { error } = await supabase.from('price_alerts').insert({
        user_id: user.id,
        product_id: productId,
        target_price: targetPrice || null,
        is_active: true
    })

    if (error) {
        console.error('Price Alert Error:', error)
        return { error: 'Failed to create price alert' }
    }

    return { success: true }
}
