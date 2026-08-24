'use server'

import { Database } from '@/lib/database.types'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: { display_name: string; phone: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    console.log('[updateProfile] Updating profile for user:', user.id, formData)

    // Use maybeSingle to avoid 406 error when no row exists
    let { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

    let result
    if (existingProfile) {
        // Update existing profile
        result = await supabase
            .from('profiles')
            .update({
                display_name: formData.display_name,
                phone: formData.phone,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .select()
    } else {
        // Insert new profile
        result = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                email: user.email,
                display_name: formData.display_name,
                phone: formData.phone,
            })
            .select()
            .single()
    }

    console.log('[updateProfile] Result:', result)

    if (result.error) {
        console.error('[updateProfile] Error:', result.error)
        return { error: result.error.message }
    }

    revalidatePath('/account/settings')
    return { success: true, data: result.data }
}

export async function getProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated', profile: null }
    }

    // Use maybeSingle to avoid 406 error when no row exists
    let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

    console.log('[getProfile] Fetched profile:', { profile, error })

    // If profile doesn't exist, create it
    if (!profile && !error) {
        console.log('[getProfile] Creating new profile...')
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                email: user.email,
            })
            .select()
            .single()

        if (createError) {
            console.error('[getProfile] Failed to create profile:', createError)
            return { error: createError.message, profile: null }
        }
        profile = newProfile
        console.log('[getProfile] Created profile:', profile)
    }

    return { profile, error: error?.message || null }
}

export async function updateUserSettings(settings: {
    preferred_top_size?: string
    preferred_bottom_size?: string
    preferred_dress_size?: string
    measurement_unit?: string
    email_order_updates?: boolean
    email_promotions?: boolean
    email_weekly_digest?: boolean
    email_new_arrivals?: boolean
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
        .from('user_settings')
        .upsert({
            user_id: user.id,
            ...settings,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()

    console.log('[updateUserSettings] Result:', { data, error })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/account/settings')
    return { success: true, data }
}

export async function getUserSettings() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated', settings: null }
    }

    // Use maybeSingle to avoid 406 error when no row exists
    let { data: settings, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

    console.log('[getUserSettings] Fetched settings:', { settings, error })

    // If settings don't exist, create default
    if (!settings && !error) {
        console.log('[getUserSettings] Creating new settings...')
        const { data: newSettings, error: createError } = await supabase
            .from('user_settings')
            .insert({
                user_id: user.id,
            })
            .select()
            .single()

        if (createError) {
            console.error('[getUserSettings] Failed to create settings:', createError)
            return { error: createError.message, settings: null }
        }
        settings = newSettings
        console.log('[getUserSettings] Created settings:', settings)
    }

    return { settings, error: error?.message || null }
}

export async function requestPasswordUpdate(email: string) {
    const supabase = await createClient()

    // Send OTP to the user's email
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: false,
        }
    })

    console.log('[requestPasswordUpdate] Sent OTP to:', email, 'Error:', error)

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function verifyOtpAndUpdatePassword(email: string, otp: string, newPassword: string) {
    const supabase = await createClient()

    // 1. Verify the OTP
    const { data: { session }, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
    })

    if (verifyError || !session) {
        console.error('[verifyOtp] Verification failed:', verifyError)
        return { error: verifyError?.message || 'Invalid OTP' }
    }

    // 2. Update the password using the new session
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (updateError) {
        console.error('[verifyOtp] Password update failed:', updateError)
        return { error: updateError.message }
    }

    return { success: true }
}

// ============ ACCOUNT DELETION ============

export async function requestDeletionLink() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    // 1. Generate a secure random token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes

    // 2. Store token in database using Admin Client (bypasses RLS if needed, or ensures access)
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role')
    const supabaseAdmin = createServiceRoleClient()

    const payload: Database['public']['Tables']['account_deletion_tokens']['Insert'] = {
        user_id: user.id,
        token: token,
        expires_at: expiresAt
    }

    const { error: dbError } = await supabaseAdmin
        .from('account_deletion_tokens')
        .insert(payload as any)

    if (dbError) {
        console.error('[requestDeletionLink] DB Error:', dbError)
        return { error: 'Failed to generate deletion link. Please try again.' }
    }

    // 3. Send Email
    const { EmailService } = await import('@/lib/email/service')
    const { success, error: emailError } = await EmailService.sendDeleteAccountEmail(user.email!, token)

    if (!success) {
        return { error: 'Failed to send verification email. Please contact support.' }
    }

    return { success: true }
}

export async function verifyDeletionToken(token: string) {
    // 1. Validate token existence and expiry
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role')
    const supabaseAdmin = createServiceRoleClient()

    const { data: tokenRecord, error } = await supabaseAdmin
        .from('account_deletion_tokens')
        .select('user_id, expires_at')
        .eq('token', token)
        .single<any>()

    if (error || !tokenRecord) {
        return { error: 'Invalid or expired deletion link.' }
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
        return { error: 'This link has expired. Please request a new one.' }
    }

    return { success: true, userId: tokenRecord.user_id }
}

export async function confirmDeletion(token: string) {
    const verification = await verifyDeletionToken(token)

    if (verification.error || !verification.userId) {
        return { error: verification.error }
    }

    const { createServiceRoleClient } = await import('@/lib/supabase/service-role')
    const supabaseAdmin = createServiceRoleClient()

    // 1. Delete the user (Hard Delete)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(verification.userId)

    if (deleteError) {
        console.error('[confirmDeletion] Delete Error:', deleteError)
        return { error: deleteError.message }
    }

    // 2. Clean up used token
    await supabaseAdmin
        .from('account_deletion_tokens')
        .delete()
        .eq('token', token)

    return { success: true }
}
