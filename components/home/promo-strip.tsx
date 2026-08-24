'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { X, Tag, Sparkles } from 'lucide-react'

interface PromoItem {
    id: string
    text: string
    code?: string
    gradient?: string
}

interface PromoStripProps {
    promos?: PromoItem[]
}

const DEFAULT_PROMOS: PromoItem[] = [
    { id: '1', text: 'Free Shipping on orders above ₹999', gradient: 'from-emerald-500 to-teal-500' },
    { id: '2', text: 'New User? Get 15% OFF — Use code WELCOME15', code: 'WELCOME15', gradient: 'from-purple-500 to-pink-500' },
    { id: '3', text: 'Try Before You Buy — Virtual Try-On Available', gradient: 'from-amber-500 to-orange-500' },
]

export function PromoStrip({ promos }: PromoStripProps) {
    const items = promos && promos.length > 0 ? promos : DEFAULT_PROMOS
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [dismissed, setDismissed] = React.useState(false)

    // Check sessionStorage for dismissed state
    React.useEffect(() => {
        try {
            const d = sessionStorage.getItem('promo-strip-dismissed')
            if (d === 'true') setDismissed(true)
        } catch { /* SSR-safe */ }
    }, [])

    // Auto-rotate every 4 seconds
    React.useEffect(() => {
        if (dismissed || items.length <= 1) return
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % items.length)
        }, 4000)
        return () => clearInterval(interval)
    }, [dismissed, items.length])

    const handleDismiss = () => {
        setDismissed(true)
        try { sessionStorage.setItem('promo-strip-dismissed', 'true') } catch { /* SSR-safe */ }
    }

    if (dismissed) return null

    const current = items[currentIndex]

    return (
        <div className={cn(
            "relative w-full py-2 px-4 text-white text-center overflow-hidden",
            "bg-gradient-to-r",
            current.gradient || "from-indigo-500 to-purple-500"
        )}>
            {/* Animated background shimmer */}
            <div className="absolute inset-0 opacity-20">
                <div
                    className="absolute inset-0 animate-pulse"
                    style={{
                        backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 3s ease-in-out infinite',
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative flex items-center justify-center gap-2">
                <Sparkles className="h-3.5 w-3.5 flex-shrink-0 hidden md:block" />
                <p className="text-xs md:text-sm font-semibold tracking-wide truncate">
                    {current.text}
                </p>
                {current.code && (
                    <span className="hidden md:inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-bold border border-white/30">
                        <Tag className="h-3 w-3" />
                        {current.code}
                    </span>
                )}
            </div>

            {/* Dots indicator */}
            {items.length > 1 && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-1">
                    {items.map((_, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "w-1 h-1 rounded-full transition-all",
                                idx === currentIndex ? "bg-white w-3" : "bg-white/40"
                            )}
                        />
                    ))}
                </div>
            )}

            {/* Dismiss button */}
            <button
                onClick={handleDismiss}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Dismiss promotions"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    )
}
