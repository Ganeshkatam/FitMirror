'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface SystemError {
    id: string
    error_message: string
    stack_trace: string | null
    severity: string
    path: string | null
    user_id: string | null
    status: string
    resolved_at: string | null
    created_at: string
}

export async function getSystemErrors() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('system_errors')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) throw error
    return data as SystemError[]
}

export async function resolveError(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('system_errors')
        .update({
            status: 'resolved',
            resolved_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) throw error
    revalidatePath('/platform-admin/errors')
}

export async function deleteError(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('system_errors')
        .delete()
        .eq('id', id)

    if (error) throw error
    revalidatePath('/platform-admin/errors')
}

export async function clearResolvedErrors() {
    const supabase = await createClient()
    const { error } = await supabase
        .from('system_errors')
        .delete()
        .eq('status', 'resolved')

    if (error) throw error
    revalidatePath('/platform-admin/errors')
}
