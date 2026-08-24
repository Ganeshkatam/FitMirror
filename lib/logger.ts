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

export async function logError(error: any, context: ErrorContext = {}) {
    try {
        const supabase = await createClient()

        let message = 'Unknown Error'
        let stack = context.stack

        // Safely extract message and stack
        try {
            if (typeof error === 'string') {
                message = error
            } else if (error instanceof Error) {
                message = error.message
                if (!stack) stack = error.stack
            } else if (typeof error === 'object' && error !== null) {
                // Handle potential objects safely
                message = (error as any).message || (error as any).toString?.() || JSON.stringify(error)
            } else {
                message = String(error)
            }
        } catch (e) {
            message = 'Error object could not be serialized'
        }

        // Try to get path from headers if not provided (for server components)
        let path = context.path
        if (!path) {
            try {
                const headerList = await headers()
                path = headerList.get('referer') || headerList.get('x-invoke-path') || undefined
            } catch {
                // headers() might fail in some contexts
            }
        }

        // Try to get user if not provided
        let userId = context.userId
        if (!userId) {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                userId = user?.id
            } catch {
                // auth might fail
            }
        }

        console.error(`[System Error] ${message}`, stack)

        await supabase.from('system_errors').insert({
            error_message: message,
            stack_trace: stack,
            severity: context.severity || 'error',
            path: path,
            user_id: userId,
            status: 'open'
        })

    } catch (loggingError) {
        // Fallback to console if DB logging fails to avoid infinite loops
        console.error('Failed to log error to database:', loggingError)
        // Do NOT try to log the original 'error' object again if it caused the crash
        console.error('Original error message (safe):', typeof error === 'string' ? error : 'Check server logs')
    }
}
