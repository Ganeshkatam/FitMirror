'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Home } from 'lucide-react'
// import * as Sentry from '@sentry/nextjs'
import { logError } from '@/lib/logger'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Suppress AbortError and other transient errors
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
            return
        }
        // Send error to Sentry
        // Sentry.captureException(error)
        console.error('Global Error:', error)

        // Log to database
        logError(error.message, {
            stack: error.stack,
            severity: 'critical'
        } as any)
    }, [error])

    // Don't render error UI for AbortError
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        return null
    }

    return (
        <html>
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
                    <div className="space-y-6 max-w-md">
                        <div className="text-8xl">⚠️</div>
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold">Something went wrong</h1>
                            <p className="text-gray-600 text-lg">
                                We encountered an unexpected issue.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                            <Button size="lg" onClick={() => reset && reset()} className="gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Try Again
                            </Button>
                            <Button variant="outline" size="lg" onClick={() => window.location.href = '/'} className="gap-2">
                                <Home className="h-4 w-4" />
                                Go Home
                            </Button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    )
}
