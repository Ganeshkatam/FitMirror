/**
 * Error Logging Utility
 * Use this to log errors from anywhere in the app to the admin dashboard
 */

type ErrorType = 'api' | 'frontend' | 'payment' | 'auth' | 'system'
type Severity = 'info' | 'warning' | 'error' | 'critical'

interface ErrorLogOptions {
    error_type?: ErrorType
    severity?: Severity
    message: string
    stack_trace?: string
    url?: string
    user_id?: string
    metadata?: Record<string, unknown>
}

export async function logError(options: ErrorLogOptions): Promise<void> {
    try {
        await fetch('/api/telemetry/errors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error_type: options.error_type || 'frontend',
                severity: options.severity || 'error',
                message: options.message,
                stack_trace: options.stack_trace,
                url: options.url || (typeof window !== 'undefined' ? window.location.href : undefined),
                user_id: options.user_id,
                metadata: options.metadata,
            }),
        })
    } catch {
        // Silent fail - don't cause more errors while logging errors
        console.error('[ErrorLogger] Failed to log error:', options.message)
    }
}

// Convenience functions
export const logApiError = (message: string, stack?: string, metadata?: Record<string, unknown>) =>
    logError({ error_type: 'api', severity: 'error', message, stack_trace: stack, metadata })

export const logPaymentError = (message: string, metadata?: Record<string, unknown>) =>
    logError({ error_type: 'payment', severity: 'critical', message, metadata })

export const logAuthError = (message: string, metadata?: Record<string, unknown>) =>
    logError({ error_type: 'auth', severity: 'warning', message, metadata })

export const logCritical = (message: string, stack?: string, metadata?: Record<string, unknown>) =>
    logError({ error_type: 'system', severity: 'critical', message, stack_trace: stack, metadata })
