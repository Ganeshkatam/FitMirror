'use client'

import { Loader2 } from 'lucide-react'
import { cn } from './lib/utils'

interface LoadingWidgetProps {
    className?: string
    text?: string
    size?: 'sm' | 'md' | 'lg'
}

export function LoadingWidget({ className, text, size = 'md' }: LoadingWidgetProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    }

    const containerClasses = {
        sm: 'p-2',
        md: 'p-4',
        lg: 'p-8'
    }

    return (
        <div className={cn("flex flex-col items-center justify-center gap-3", containerClasses[size], className)}>
            <div className="relative">
                {/* Outer Glow Ring */}
                <div className={cn(
                    "absolute inset-0 rounded-full blur-xl opacity-50 animate-pulse bg-amber-500",
                    sizeClasses[size]
                )} />

                {/* Glassmorphic Spinner Container */}
                <div className={cn(
                    "relative flex items-center justify-center rounded-full bg-white/30 backdrop-blur-md border border-white/20 shadow-xl",
                    size === 'lg' ? 'p-3' : 'p-2'
                )}>
                    <Loader2 className={cn("animate-spin text-amber-600", sizeClasses[size])} />
                </div>
            </div>

            {text && (
                <p className="text-sm font-medium text-muted-foreground animate-pulse mt-2">
                    {text}
                </p>
            )}
        </div>
    )
}
