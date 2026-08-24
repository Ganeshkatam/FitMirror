'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAddresses() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) return { error: error.message }
    return { data }
}

export async function addAddress(address: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Map form data to schema columns
    const dbAddress = {
        user_id: user.id,
        full_name: address.name,
        phone: address.phone,
        line1: address.address_line1,
        line2: address.address_line2 || null,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country || 'IN',
    }

    const { error } = await supabase
        .from('addresses')
        .insert(dbAddress)

    if (error) return { error: error.message }
    revalidatePath('/account/addresses')
    return { success: true }
}

export async function updateAddress(id: string, updates: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const dbUpdates = {
        full_name: updates.name,
        phone: updates.phone,
        line1: updates.address_line1,
        line2: updates.address_line2 || null,
        city: updates.city,
        state: updates.state,
        postal_code: updates.postal_code,
        country: updates.country,
    }

    const { error } = await supabase
        .from('addresses')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/account/addresses')
    return { success: true }
}

export async function deleteAddress(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/account/addresses')
    return { success: true }
}
