'use client'

import * as React from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getUserPreferences } from '@/lib/utils/user-preferences'

interface RecentItem {
    id: string
    name: string
    price: number
    image: string | null
    image_url?: string | null // Legacy support
    category: string
    viewed_at: number
}

export function RecentlyViewed() {
    const [items, setItems] = React.useState<RecentItem[]>([])
    const [enabled, setEnabled] = React.useState(true)
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
        loadItems()
    }, [])

    const loadItems = async () => {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            // STRICT PRIVACY: Do not show history if not logged in
            if (!user) {
                setEnabled(false)
                // Optional: Clear history if we want to be aggressive, but for now just hide it.
                // localStorage.removeItem('fitmirror_recent_views') 
                return
            }

            // Check user preference for recently_viewed_days
            let retentionDays = 30 // Default 30 days
            const prefs = await getUserPreferences(supabase)

            if (prefs?.recently_viewed_days !== undefined) {
                retentionDays = prefs.recently_viewed_days
            }

            // If set to 0, disable recently viewed
            if (retentionDays === 0) {
                setEnabled(false)
                localStorage.removeItem('fitmirror_recent_views')
                return
            }

            const existing = localStorage.getItem('fitmirror_recent_views')
            if (existing) {
                const allItems: RecentItem[] = JSON.parse(existing)
                // Filter by retention period
                const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000)
                const filteredItems = allItems.filter(item => item.viewed_at > cutoffTime)
                setItems(filteredItems)

                // Update localStorage with filtered items
                if (filteredItems.length !== allItems.length) {
                    localStorage.setItem('fitmirror_recent_views', JSON.stringify(filteredItems))
                }
            }
        } catch (e) {
            console.error(e)
        }
    }

    const clearHistory = () => {
        localStorage.removeItem('fitmirror_recent_views')
        setItems([])
    }

    if (!mounted || !enabled || items.length === 0) return null

    return (
        <section className="space-y-6 py-12 animate-fade-in relative group/section">
            <div className="flex items-end justify-between px-1">
                <div>
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-indigo-950 flex items-center gap-3">
                        <Clock className="h-6 w-6 text-indigo-400" />
                        Recently Viewed
                    </h2>
                    <p className="text-sm text-indigo-900/60 mt-1">Pick up where you left off</p>
                </div>
                <button
                    onClick={clearHistory}
                    className="text-xs font-bold uppercase tracking-wider text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-1 pb-1.5 rounded-full transition-colors opacity-0 group-hover/section:opacity-100"
                    title="Clear your browsing history on this device"
                >
                    Clear History
                </button>
            </div>

            <ScrollArea className="w-full whitespace-nowrap pb-6">
                <div className="flex w-max space-x-6 px-1">
                    {items.map((product) => (
                        <Link key={product.id} href={`/product/${product.id}`} className="block group relative">
                            <div className="w-[200px] md:w-[240px] relative">
                                <AspectRatio ratio={3 / 4} className="bg-indigo-50 rounded-2xl overflow-hidden relative shadow-sm group-hover:shadow-xl transition-all duration-500">
                                    {(product.image) ? (
                                        <NextImage
                                            src={product.image || ''}
                                            alt={product.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-200">
                                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-indigo-950/0 group-hover:bg-indigo-950/10 transition-colors duration-300" />
                                </AspectRatio>

                                <div className="mt-4 space-y-1">
                                    <h3 className="font-serif font-bold text-indigo-950 truncate group-hover:text-indigo-600 transition-colors">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-indigo-900/80">
                                            ₹{product.price.toLocaleString('en-IN')}
                                        </p>
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 group-hover:text-indigo-500 transition-colors">
                                            View Again
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="bg-indigo-50" />
            </ScrollArea>
        </section>
    )
}
