'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function joinWaitlist(productId: string, size: string, email: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Validate inputs
    if (!email || !email.includes('@')) {
        throw new Error("Invalid email address")
    }

    try {
        const { error } = await supabase
            .from('product_waitlist')
            .upsert({
                product_id: productId,
                size: size,
                email: email,
                user_id: user?.id || null,
                status: 'pending'
            }, {
                onConflict: 'product_id, size, email'
            })

        if (error) throw error

        return { success: true }
    } catch (error: any) {
        console.error("Waitlist Error:", error)
        throw new Error("Failed to join waitlist")
    }
}
