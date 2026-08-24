'use client'

import { useEffect } from 'react'

// Errors to suppress (transient development errors)
const SUPPRESSED_ERRORS = [
    'AbortError',
    'signal is aborted',
    'aborted without reason',
    'Failed to fetch', // Often caused by HMR or navigation
    'Load failed',
    'NetworkError',
    'The operation was aborted',
]

function shouldSuppress(error: Error | string): boolean {
    const message = typeof error === 'string' ? error : error.message
    const name = typeof error === 'string' ? '' : error.name

    return SUPPRESSED_ERRORS.some(pattern =>
        message?.toLowerCase().includes(pattern.toLowerCase()) ||
        name?.toLowerCase().includes(pattern.toLowerCase())
    )
}

export function ErrorSuppressor() {
    useEffect(() => {
        // Suppress unhandled errors
        const handleError = (event: ErrorEvent) => {
            if (shouldSuppress(event.error || event.message)) {
                event.preventDefault()
                event.stopPropagation()
                return false
            }
        }

        // Suppress unhandled promise rejections
        const handleRejection = (event: PromiseRejectionEvent) => {
            const error = event.reason
            if (error && shouldSuppress(error)) {
                event.preventDefault()
                event.stopPropagation()
                return false
            }
        }

        window.addEventListener('error', handleError)
        window.addEventListener('unhandledrejection', handleRejection)

        return () => {
            window.removeEventListener('error', handleError)
            window.removeEventListener('unhandledrejection', handleRejection)
        }
    }, [])

    return null
}
