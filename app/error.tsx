'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Global Error caught:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    We apologize for the inconvenience. Our team has been notified.
                </p>
            </div>

            <div className="flex gap-4">
                <Button onClick={reset} variant="default" className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Try Again
                </Button>
                <Button onClick={() => window.location.href = '/'} variant="outline">
                    Go Home
                </Button>
            </div>
        </div>
    )
}
