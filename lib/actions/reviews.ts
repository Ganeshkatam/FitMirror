'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ReviewData = {
    productId: string
    rating: number
    title: string
    content: string
    images?: string[]
    fitRating?: string
}

export async function submitReview(data: ReviewData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Must be logged in to review")

    // 1. Verify Purchase
    const { count: purchaseCount, data: purchaseData } = await supabase
        .from('order_items')
        .select('id, size, order:orders!inner(id)', { count: 'exact' })
        .eq('product_id', data.productId)
        .eq('order.user_id', user.id)
        .limit(1)

    const isVerified = (purchaseCount || 0) > 0
    const sizePurchased = purchaseData?.[0]?.size || null

    // 2. Insert Review
    const { error: insertError } = await supabase
        .from('reviews')
        .insert({
            user_id: user.id,
            product_id: data.productId,
            rating: data.rating,
            title: data.title,
            content: data.content,
            images: data.images || [],
            fit_rating: data.fitRating,
            size_purchased: sizePurchased,
            verified_purchase: isVerified
        })

    if (insertError) {
        if (insertError.code === '23505') throw new Error("You have already reviewed this product")
        throw insertError
    }

    revalidatePath(`/shop/product/${data.productId}`)
    return { success: true }
}

export async function getProductReviews(productId: string) {
    const supabase = await createClient()

    const { data: reviews } = await supabase
        .from('reviews')
        .select(`
            *,
            user:profiles(full_name, avatar_url)
        `)
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })

    return reviews || []
}
// Toggle Helpful Vote
export async function toggleHelpfulVote(reviewId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, error: "Must be logged in to vote" }

        // Check if vote exists
        const { data: existingVote } = await supabase
            .from('review_votes')
            .select('id')
            .eq('review_id', reviewId)
            .eq('user_id', user.id)
            .maybeSingle()

        if (existingVote) {
            // Remove vote
            const { error } = await supabase.from('review_votes').delete().eq('id', existingVote.id)
            if (error) throw error
            return { success: true, action: 'removed' }
        } else {
            // Add vote
            const { error } = await supabase.from('review_votes').insert({
                review_id: reviewId,
                user_id: user.id,
                vote_type: 'helpful'
            })
            if (error) throw error
            return { success: true, action: 'added' }
        }
    } catch (error: any) {
        console.error("Vote error:", error)
        return { success: false, error: error.message }
    }
}

// Check which reviews I voted for
export async function getMyReviewVotes(reviewIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data } = await supabase
        .from('review_votes')
        .select('review_id')
        .eq('user_id', user.id)
        .in('review_id', reviewIds)

    return data?.map(r => r.review_id) || []
}
