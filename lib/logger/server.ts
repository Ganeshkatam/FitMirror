'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { headers } from 'next/headers'

export type ErrorSeverity = 'critical' | 'error' | 'warning'

interface ErrorContext {
    path?: string
    userId?: string
    severity?: ErrorSeverity
    stack?: string
}

function redactDiagnostic(value: string, maxLength: number): string {
    return value
        .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [REDACTED]')
        .replace(/(password|token|secret|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
        .slice(0, maxLength)
}

export async function logError(error: unknown, context: ErrorContext = {}) {
    try {
        const authClient = await createClient()
        const db = createServiceRoleClient()
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
                : 'Unexpected non-Error diagnostic payload'
        }

        let path = context.path
        if (!path) {
            try {
                const headerList = await headers()
                const referer = headerList.get('referer')
                const invokePath = headerList.get('x-invoke-path')
                path = (referer || invokePath || undefined)?.split('?')[0]?.slice(0, 512)
            } catch {
                // Request headers are unavailable outside a request context.
            }
        }

        let userId = context.userId
        if (!userId) {
            const { data: { user } } = await authClient.auth.getUser()
            userId = user?.id
        }

        const safeMessage = redactDiagnostic(message, 2000)
        const safeStack = stack ? redactDiagnostic(stack, 8000) : null

        console.error('[System Error]', safeMessage)
        const { error: insertError } = await db.from('system_errors').insert({
            error_message: safeMessage,
            stack_trace: safeStack,
            severity: context.severity || 'error',
            path,
            user_id: userId,
            status: 'open'
        })
        if (insertError) throw insertError
    } catch (loggingError) {
        console.error('Failed to log to the protected system error store:', loggingError)
    }
}
