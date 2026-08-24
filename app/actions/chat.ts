'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function startConversation(storeId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    // Check availability
    const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('customer_id', user.id)
        .eq('store_id', storeId)
        .single()

    if (existing) return existing.id

    // Create new
    const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
            customer_id: user.id,
            store_id: storeId
        })
        .select('id')
        .single()

    if (error) throw new Error(error.message)
    return newConv.id
}

export async function sendMessage(conversationId: string, content: string, isFromStore: boolean = false) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    const { error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            is_from_store: isFromStore,
            content
        })

    if (error) throw new Error(error.message)

    // We don't verify revalidatePath here as we expect Realtime to handle UI updates
    return { success: true }
}

