'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUserPreferences } from '@/lib/utils/user-preferences'

interface ProductViewTrackerProps {
    product: {
        id: string
        name: string
        price: number
        image: string | null
        category: string
    }
}

export function ProductViewTracker({ product }: ProductViewTrackerProps) {
    React.useEffect(() => {
        const trackView = async () => {
            try {
                const STORAGE_KEY = 'fitmirror_recent_views'
                const MAX_ITEMS = 12

                // Check if recently_viewed is disabled (set to 0)
                const supabase = createClient()
                const prefs = await getUserPreferences(supabase)

                // If recently_viewed_days is 0, don't track
                if (prefs?.recently_viewed_days === 0) {
                    return
                }

                type ViewedItem = ProductViewTrackerProps['product'] & { viewed_at: number }
                const existing = localStorage.getItem(STORAGE_KEY)
                let items: ViewedItem[] = existing ? JSON.parse(existing) : []

                // Remove if duplicate exists (to move it to front)
                items = items.filter((item) => item.id !== product.id)

                // Add new item to front
                items.unshift({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    category: product.category,
                    viewed_at: new Date().getTime()
                })

                // Limit size
                if (items.length > MAX_ITEMS) {
                    items = items.slice(0, MAX_ITEMS)
                }

                localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
            } catch (error) {
                console.error('Error saving recent view:', error)
            }
        }

        trackView()
    }, [product])

    return null
}
