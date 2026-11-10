'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export type ErrorSeverity = 'critical' | 'error' | 'warning'

interface ErrorContext {
    path?: string
    userId?: string
    severity?: ErrorSeverity
    stack?: string
}

export async function logError(error: unknown, context: ErrorContext = {}) {
    try {
        const supabase = await createClient()
        let message = 'Unknown Error'
        let stack = context.stack

        if (typeof error === 'string') {
            message = error
        } else if (error instanceof Error) {
            message = error.message
            stack ||= error.stack
        } else if (error && typeof error === 'object') {
            message = 'message' in error && typeof error.message === 'string'
                ? error.message
                : JSON.stringify(error)
        } else {
            message = String(error)
        }

        let path = context.path
        if (!path) {
            try {
                const headerList = await headers()
                path = headerList.get('referer') || headerList.get('x-invoke-path') || undefined
            } catch {
                // Request headers are unavailable outside a request context.
            }
        }

        let userId = context.userId
        if (!userId) {
            const { data: { user } } = await supabase.auth.getUser()
            userId = user?.id
        }

        console.error(`[System Error] ${message}`, stack)
        await supabase.from('system_errors').insert({
            error_message: message,
            stack_trace: stack,
            severity: context.severity || 'error',
            path,
            user_id: userId,
            status: 'open'
        })
    } catch (loggingError) {
        console.error('Failed to log error to database:', loggingError)
    }
}
