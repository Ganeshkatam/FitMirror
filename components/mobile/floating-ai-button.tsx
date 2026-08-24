'use client'

import React from 'react'
import { Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingAIButtonProps {
    onClick?: () => void
}

export function FloatingAIButton({ onClick }: FloatingAIButtonProps) {
    const [dismissed, setDismissed] = React.useState(false)
    const [showHint, setShowHint] = React.useState(false)

    // Check sessionStorage for dismissal
    React.useEffect(() => {
        if (sessionStorage.getItem('ai-fab-dismissed') === 'true') {
            setDismissed(true)
        }
        // Show hint after 3 seconds
        const timer = setTimeout(() => setShowHint(true), 3000)
        const hideTimer = setTimeout(() => setShowHint(false), 8000)
        return () => { clearTimeout(timer); clearTimeout(hideTimer) }
    }, [])

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation()
        setDismissed(true)
        sessionStorage.setItem('ai-fab-dismissed', 'true')
    }

    if (dismissed) return null

    return (
        <div className="md:hidden fixed bottom-20 right-4 z-40 flex items-center gap-2">
            {/* Hint bubble */}
            {showHint && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-xl shadow-xl max-w-[160px]">
                    <button
                        onClick={handleDismiss}
                        className="absolute -top-1.5 -right-1.5 bg-gray-700 rounded-full p-0.5"
                    >
                        <X className="h-2.5 w-2.5" />
                    </button>
                    <span>Need styling help? Ask AI ✨</span>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
            )}

            {/* FAB */}
            <button
                onClick={onClick}
                className={cn(
                    "relative h-14 w-14 rounded-full shadow-2xl",
                    "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600",
                    "flex items-center justify-center",
                    "active:scale-90 transition-transform duration-150",
                    "ring-4 ring-amber-200/30"
                )}
            >
                {/* Pulse rings */}
                <span className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
                <span className="absolute inset-[-4px] rounded-full border-2 border-amber-300/20 animate-pulse" />

                <Sparkles className="h-6 w-6 text-white relative z-10" />
            </button>
        </div>
    )
}
