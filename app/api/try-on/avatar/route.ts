import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/tryon/avatar
 * Get current user's active avatar
 */
export async function GET() {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('user_avatars')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // No avatar yet
                return NextResponse.json(null)
            }
            throw error
        }

        return NextResponse.json({
            id: data.id,
            userId: data.user_id,
            name: data.name,
            bodyData: data.body_data,
            isActive: data.is_active,
            createdAt: data.created_at
        })

    } catch (error) {
        console.error('Failed to fetch avatar:', error)
        return NextResponse.json({ error: 'Failed to fetch avatar' }, { status: 500 })
    }
}

/**
 * POST /api/tryon/avatar
 * Create or update user avatar
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name, bodyData } = await request.json()

        // Validate body data
        if (!bodyData || typeof bodyData.height !== 'number') {
            return NextResponse.json(
                { error: 'Invalid body data' },
                { status: 400 }
            )
        }

        // Upsert avatar (one active avatar per user)
        const { data: existing } = await supabase
            .from('user_avatars')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single()

        let result

        if (existing) {
            // Update existing
            const { data, error } = await supabase
                .from('user_avatars')
                .update({
                    name: name || 'My Avatar',
                    body_data: bodyData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
                .select()
                .single()

            if (error) throw error
            result = data
        } else {
            // Create new
            const { data, error } = await supabase
                .from('user_avatars')
                .insert({
                    user_id: user.id,
                    name: name || 'My Avatar',
                    body_data: bodyData,
                    is_active: true
                })
                .select()
                .single()

            if (error) throw error
            result = data
        }

        return NextResponse.json({
            id: result.id,
            userId: result.user_id,
            name: result.name,
            bodyData: result.body_data,
            isActive: result.is_active,
            createdAt: result.created_at
        })

    } catch (error) {
        console.error('Failed to save avatar:', error)
        return NextResponse.json({ error: 'Failed to save avatar' }, { status: 500 })
    }
}

/**
 * DELETE /api/tryon/avatar
 * Delete user's avatar (privacy compliance)
 */
export async function DELETE() {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { error } = await supabase
            .from('user_avatars')
            .delete()
            .eq('user_id', user.id)

        if (error) throw error

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Failed to delete avatar:', error)
        return NextResponse.json({ error: 'Failed to delete avatar' }, { status: 500 })
    }
}
