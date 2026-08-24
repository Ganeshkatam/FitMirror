'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUserStats(userId: string) {
    const supabase = await createClient()

    // Get Order Stats
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) throw new Error(error.message)

    const totalSpend = orders?.reduce((acc, order) => acc + (order.status !== 'cancelled' ? order.total_amount : 0), 0) || 0
    const totalOrders = orders?.length || 0

    // Check if user is super admin
    const { data: admin } = await supabase
        .from('admins')
        .select('is_super_admin')
        .eq('profile_id', userId)
        .single()

    return {
        orders,
        stats: {
            totalSpend,
            totalOrders,
            isSuperAdmin: !!admin?.is_super_admin
        }
    }
}

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
    const supabase = await createClient()

    // Check permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: admin } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (admin?.role !== 'admin') throw new Error('Unauthorized')

    // Using role = 'banned' to simulate ban since profiles lacks is_active
    const newRole = currentStatus ? 'banned' : 'customer'

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole } as any)
        .eq('id', userId)

    if (error) throw new Error(error.message)

    revalidatePath('/platform-admin/users')
    return { success: true }
}

/**
 * Update user role (customer, seller, admin)
 * Only admins can promote/demote users
 * Super admins can promote to admin
 */
export async function updateUserRole(userId: string, newRole: 'customer' | 'seller' | 'admin') {
    const supabase = await createClient()

    // Check permissions - must be admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: currentAdmin } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (currentAdmin?.role !== 'admin') {
        throw new Error('Unauthorized: Only admins can change user roles')
    }

    // Check if current admin is super admin when promoting to admin
    if (newRole === 'admin') {
        const { data: adminData } = await supabase
            .from('admins')
            .select('is_super_admin')
            .eq('profile_id', user.id)
            .single()

        if (!adminData?.is_super_admin) {
            throw new Error('Unauthorized: Only super admins can promote users to admin')
        }
    }

    // Prevent demoting yourself
    if (userId === user.id) {
        throw new Error('You cannot change your own role')
    }

    // Get current role
    const { data: targetUser } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

    const previousRole = targetUser?.role

    // Update role in profiles
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole } as any)
        .eq('id', userId)

    if (updateError) throw new Error(updateError.message)

    // If promoting to admin, create admin entry (trigger handles this but we ensure)
    if (newRole === 'admin' && previousRole !== 'admin') {
        await supabase
            .from('admins')
            .insert({ profile_id: userId })
            .select()
            .single()
    }

    // If demoting from admin, optionally remove admin entry
    // (keeping history - admin entry stays but user can't access)

    // Log the action using the new admin activity logging system
    await supabase.rpc('log_admin_activity', {
        p_profile_id: user.id,
        p_action: 'role_change',
        p_resource_type: 'user',
        p_resource_id: userId,
        p_resource_name: targetUser?.role ? `User (${previousRole})` : 'Unknown User',
        p_previous_value: { role: previousRole },
        p_new_value: { role: newRole },
        p_changes_summary: `Changed user role from ${previousRole} to ${newRole}`,
        p_reason: null,
        p_severity: newRole === 'admin' ? 'critical' : 'high',
        p_category: 'user_management'
    })


    revalidatePath('/platform-admin/users')
    return { success: true, previousRole, newRole }
}

/**
 * Get all available roles for role management
 */
export async function getAvailableRoles() {
    return [
        { value: 'customer', label: 'Customer', description: 'Regular user with shopping access' },
        { value: 'seller', label: 'Seller', description: 'Can manage products and fulfill orders' },
        { value: 'admin', label: 'Admin', description: 'Full platform access (requires super admin)' },
    ]
}

/**
 * Permanently delete a user (Admin only)
 */
export async function deleteUser(userId: string) {
    const supabase = await createClient()

    // 1. Auth Check - Must be authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 2. Role Check - Must be admin
    const { data: admin } = await supabase.from('profiles').select('email, role').eq('id', user.id).single()
    if (admin?.role !== 'admin') throw new Error('Unauthorized: Admin access required')

    // 3. Prevent self-deletion via this route
    if (userId === user.id) {
        throw new Error('You cannot delete your own account from the admin panel. Please use Settings.')
    }

    // 4. Perform Deletion using Service Role
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role')
    const supabaseAdmin = createServiceRoleClient()

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
        console.error('Failed to delete user:', error)
        throw new Error(error.message)
    }

    // 5. Log Action
    await supabase.rpc('log_admin_activity', {
        p_profile_id: user.id,
        p_action: 'delete_user',
        p_resource_type: 'user',
        p_resource_id: userId,
        p_changes_summary: `Permanently deleted user ${userId}`,
        p_severity: 'critical',
        p_category: 'user_management'
    })

    revalidatePath('/platform-admin/users')
    return { success: true }
}

