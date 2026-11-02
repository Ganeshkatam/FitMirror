import { createClient } from '@supabase/supabase-js'

/**
 * SECURITY WARNING: 
 * Infrastructure credential used by trusted server execution paths to bypass RLS when the operation requires it.
 * 
 * DO NOT EXPOSE TO CLIENT-SIDE CODE.
 */
export function createServiceRoleClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Reject missing credentials explicitly to prevent silent configuration failures
    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
            'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined for service-role operations.'
        )
    }

    // In production / non-test runtime, reject placeholder values explicitly
    if (process.env.NODE_ENV === 'production' && (supabaseUrl.includes('placeholder') || serviceRoleKey.includes('placeholder'))) {
        throw new Error('Placeholder credentials cannot be used in production for service-role client.')
    }

    return createClient(
        supabaseUrl,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
