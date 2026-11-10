type ClientErrorContext = {
    path?: string
    severity?: 'info' | 'warning' | 'error' | 'critical'
    stack?: string
}

export async function logError(error: unknown, context: ClientErrorContext = {}): Promise<void> {
    const message = error instanceof Error ? error.message : String(error)

    try {
        await fetch('/api/telemetry/errors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error_type: 'frontend',
                severity: context.severity || 'error',
                message,
                stack_trace: context.stack || (error instanceof Error ? error.stack : undefined),
                url: context.path || (typeof window !== 'undefined' ? window.location.href : undefined),
            }),
        })
    } catch {
        console.error('[Logger] Failed to send error telemetry:', message)
    }
}
