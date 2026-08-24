'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'

interface Activity {
    id: string
    message: string
    timestamp: number
    type: 'purchase' | 'try-on'
}

export function LivePulse() {
    const [activity, setActivity] = useState<Activity | null>(null)

    useEffect(() => {
        const supabase = createClient()

        // 1. Realtime Subscription
        const channel = supabase
            .channel('live-pulse')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders' },
                (payload) => {
                    const city = payload.new.shipping_address?.city || 'India'
                    showActivity({
                        id: payload.new.id,
                        message: `Someone in ${city} just placed an order!`,
                        timestamp: Date.now(),
                        type: 'purchase'
                    })
                }
            )
            .subscribe()

        // 2. Simulated "Alive" Feel (Mock Data for Demo)
        const mockActivities = [
            "Someone in Mumbai just bought a Red Velvet Dress",
            "3 people are looking at Denim Jackets",
            "Someone in Delhi is trying on Sunglasses",
            "A customer in Bangalore just rated a product 5 stars",
            "Limited stock alert: specific sizes running low"
        ]

        const interval = setInterval(() => {
            if (document.hidden) return // Don't spam if tab hidden

            const randomMsg = mockActivities[Math.floor(Math.random() * mockActivities.length)]
            showActivity({
                id: Date.now().toString(),
                message: randomMsg,
                timestamp: Date.now(),
                type: 'try-on'
            })
        }, 15000 + Math.random() * 20000) // Random interval 15-35s

        return () => {
            supabase.removeChannel(channel)
            clearInterval(interval)
        }
    }, [])

    const showActivity = (act: Activity) => {
        setActivity(act)
        // Hide after 5 seconds
        setTimeout(() => setActivity(null), 5000)
    }

    return (
        <AnimatePresence>
            {activity && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 20, x: '-50%' }}
                    className="fixed bottom-20 md:bottom-6 left-1/2 md:left-24 transform -translate-x-1/2 md:translate-x-0 z-40"
                >
                    <div className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 text-sm font-medium pr-6 border border-white/10">
                        <div className="bg-green-500 rounded-full p-1.5 animate-pulse">
                            <ShoppingBag className="h-3 w-3 text-white" />
                        </div>
                        {activity.message}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
