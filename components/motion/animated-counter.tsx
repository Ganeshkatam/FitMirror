'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface AnimatedCounterProps {
    end: number
    duration?: number
    suffix?: string
    prefix?: string
    className?: string
    decimals?: number
}

export function AnimatedCounter({ end, duration = 2, suffix = '', prefix = '', className = '', decimals = 0 }: AnimatedCounterProps) {
    const [count, setCount] = useState(0)
    const ref = useRef<HTMLSpanElement>(null)
    const isInView = useInView(ref, { once: true })

    useEffect(() => {
        if (!isInView) return

        let startTime: number | null = null
        const startValue = 0

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime
            const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)

            // Easing function for smooth deceleration
            const easeOut = 1 - Math.pow(1 - progress, 3)
            // Keep as float for smoothing
            const current = easeOut * (end - startValue) + startValue

            setCount(current)

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)
    }, [isInView, end, duration])

    return (
        <span ref={ref} className={className}>
            {prefix}{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
        </span>
    )
}
