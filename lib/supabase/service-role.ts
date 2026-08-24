import { createClient } from '@supabase/supabase-js'

/**
 * SECURITY WARNING: 
 * Infrastructure credential used by trusted server execution paths to bypass RLS when the operation requires it.
 * 
 * DO NOT EXPOSE TO CLIENT-SIDE CODE.
 */
export function createServiceRoleClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
