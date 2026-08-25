'use server'

import { createClient } from '@/lib/supabase/server'

export type TryOnActionType =
    | 'session_started'
    | 'photo_uploaded'
    | 'item_added'
    | 'item_removed'
    | 'generation_requested'
    | 'generation_completed'
    | 'generation_failed'
    | 'result_shared'
    | 'result_saved'
    | 'product_clicked'
    | 'add_to_cart'

interface LogTryOnEventParams {
    sessionId: string
    actionType: TryOnActionType
    payload?: Record<string, any>
}

/**
 * Log a try-on event for analytics
 */
export async function logTryOnEvent({ sessionId, actionType, payload }: LogTryOnEventParams) {
    const supabase = await createClient()

    const { error } = await supabase.from('tryon_audit_logs').insert({
        session_id: sessionId,
        action_type: actionType,
        payload: payload || {},
        recorded_at: new Date().toISOString()
    })

    if (error) {
        console.error('Failed to log try-on event:', error)
        // Don't throw - analytics logging shouldn't break the app
    }
}

/**
 * Get try-on analytics summary
 */
export async function getTryOnAnalytics(startDate?: Date, endDate?: Date) {
    const supabase = await createClient()

    let query = supabase.from('tryon_audit_logs').select('action_type, recorded_at')

    if (startDate) {
        query = query.gte('recorded_at', startDate.toISOString())
    }
    if (endDate) {
        query = query.lte('recorded_at', endDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
        console.error('Failed to fetch try-on analytics:', error)
        return null
    }

    // Aggregate by action type
    const actionCounts: Record<string, number> = {}
    data?.forEach(log => {
        actionCounts[log.action_type] = (actionCounts[log.action_type] || 0) + 1
    })

    // Calculate conversion funnel
    const sessionStarts = actionCounts['session_started'] || 0
    const photoUploads = actionCounts['photo_uploaded'] || 0
    const generations = actionCounts['generation_requested'] || 0
    const completions = actionCounts['generation_completed'] || 0
    const addToCarts = actionCounts['add_to_cart'] || 0

    return {
        totalEvents: data?.length || 0,
        actionCounts,
        funnel: {
            sessions: sessionStarts,
            photoUploads,
            generations,
            completions,
            conversions: addToCarts,
            photoUploadRate: sessionStarts ? (photoUploads / sessionStarts * 100).toFixed(1) : '0',
            generationRate: photoUploads ? (generations / photoUploads * 100).toFixed(1) : '0',
            completionRate: generations ? (completions / generations * 100).toFixed(1) : '0',
            conversionRate: completions ? (addToCarts / completions * 100).toFixed(1) : '0'
        }
    }
}

/**
 * Get session activity timeline
 */
export async function getTryOnSessionTimeline(sessionId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('tryon_audit_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('recorded_at', { ascending: true })

    if (error) {
        console.error('Failed to fetch session timeline:', error)
        return []
    }

    return data
}


/**
 * Get daily try-on usage stats
 */
export async function getDailyTryOnStats(days = 30) {
    const supabase = await createClient()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
        .from('tryon_audit_logs')
        .select('action_type, recorded_at')
        .gte('recorded_at', startDate.toISOString())

    if (error) {
        console.error('Failed to fetch daily stats:', error)
        return []
    }

    // Group by date
    const dailyStats: Record<string, { date: string; generations: number; sessions: number }> = {}

    data?.forEach(log => {
        const date = new Date(log.recorded_at).toISOString().split('T')[0]
        if (!dailyStats[date]) {
            dailyStats[date] = { date, generations: 0, sessions: 0 }
        }
        if (log.action_type === 'generation_requested') {
            dailyStats[date].generations++
        }
        if (log.action_type === 'session_started') {
            dailyStats[date].sessions++
        }
    })

    return Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date))
}
