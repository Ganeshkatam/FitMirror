'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUnreadNotifications() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10)

    return notifications || []
}

export async function getAllNotifications() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

    return notifications || []
}

export async function markAsRead(notificationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/account/notifications')
    return { success: true }
}

export async function markAllAsRead(_formData?: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

    if (error) throw error

    revalidatePath('/account/notifications')
}

export async function getUnreadCount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return 0

    const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

    return count || 0
}

/**
 * Create a new notification (Server-side)
 */
export async function createNotification(params: {
    userId: string
    title: string
    message: string
    type: 'order' | 'product' | 'system' | 'promotion'
    link?: string
}) {
    const supabase = await createClient()

    // We typically use service role or similar if sending TO another user,
    // but standard client works if we have insert policy. 
    // If RLS blocks inserting for others, we might need a trusted client or RPC.
    // For now assuming existing RLS or admin privileges allow it.

    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: params.userId,
            title: params.title,
            message: params.message,
            type: params.type,
            link: params.link,
            is_read: false
        })

    if (error) {
        console.error('Failed to create notification', error)
        // Don't throw to avoid breaking the main flow (e.g. order creation)
    }
}
