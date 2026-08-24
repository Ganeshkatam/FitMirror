'use client'

import { useEffect, useRef } from 'react'
import { trackViewClient } from '@/lib/service/personalization-client'

interface TrackViewProps {
    productId: string
    category: string
    color?: string
    price: number
    minViewTime?: number // Minimum seconds before tracking (default 3)
}

/**
 * Invisible component that tracks product views
 * 
 * Only tracks after user has viewed for minViewTime seconds
 * to filter out accidental clicks.
 */
export function TrackProductView({
    productId,
    category,
    color,
    price,
    minViewTime = 3
}: TrackViewProps) {
    const startTime = useRef(Date.now())
    const tracked = useRef(false)

    useEffect(() => {
        // Set start time when component mounts
        startTime.current = Date.now()
        tracked.current = false

        // Track when user has viewed for minViewTime
        const trackAfterDelay = setTimeout(() => {
            if (!tracked.current) {
                const timeSpent = Math.floor((Date.now() - startTime.current) / 1000)
                trackViewClient({
                    productId,
                    category,
                    color,
                    price,
                    timeSpent
                })
                tracked.current = true
            }
        }, minViewTime * 1000)

        // Also track on unmount if viewed for at least 1 second
        return () => {
            clearTimeout(trackAfterDelay)
            const timeSpent = Math.floor((Date.now() - startTime.current) / 1000)
            if (!tracked.current && timeSpent >= 1) {
                trackViewClient({
                    productId,
                    category,
                    color,
                    price,
                    timeSpent
                })
            }
        }
    }, [productId, category, color, price, minViewTime])

    // Invisible component
    return null
}
