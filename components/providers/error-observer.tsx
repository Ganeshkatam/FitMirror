'use client'

import { useEffect } from 'react'
import { logError } from '@/lib/logger'

export function ErrorObserver() {
    useEffect(() => {
        const originalConsoleError = console.error

        // 1. Intercept console.error
        console.error = (...args) => {
            // Call original
            originalConsoleError.apply(console, args)

            // Filter out React development logs or trivial warnings if needed
            // For now, log everything as "micro level" requested
            const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')

            // Avoid infinite loops if logging itself causes error
            if (
                !message.includes('[System Error]') &&
                !message.includes('AbortError') &&
                !message.includes('The user aborted a request') &&
                !message.includes('signal is aborted without reason') &&
                !message.includes('Hydration failed') &&
                !message.includes('Cannot update a component') &&
                !message.includes('remove') // "removeChannel" noise
            ) {
                // Decouple logging from current stack to avoid "update during render" issues
                setTimeout(() => {
                    logError(message, { severity: 'warning', path: window.location.pathname })
                }, 0)
            }
        }

        // 2. Global Error Handler
        const handleWindowError = (event: ErrorEvent) => {
            logError(event.error || event.message, {
                severity: 'error',
                path: window.location.pathname,
                stack: event.error?.stack
            })
        }

        // 3. Unhandled Promise Rejections
        const handleRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason
            const message = typeof reason === 'string'
                ? reason
                : reason?.message || 'Unhandled Promise Rejection'

            const stack = reason?.stack

            logError(message, {
                severity: 'error',
                path: window.location.pathname,
                stack: stack
            })
        }

        window.addEventListener('error', handleWindowError)
        window.addEventListener('unhandledrejection', handleRejection)

        return () => {
            console.error = originalConsoleError
            window.removeEventListener('error', handleWindowError)
            window.removeEventListener('unhandledrejection', handleRejection)
        }
    }, [])

    return null
}
