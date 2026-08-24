'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const displayName = formData.get('displayName') as string
    const phone = formData.get('phone') as string

    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            email: user.email,
            display_name: displayName,
            phone: phone,
            updated_at: new Date().toISOString()
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/account/settings/account')
    revalidatePath('/profile') // Update public profile viewing
    return { success: true }
}
