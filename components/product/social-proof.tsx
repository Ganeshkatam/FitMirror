'use client'

import { useEffect, useState } from 'react'
import { Eye, TrendingUp, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function SocialProof() {
    const [viewers, setViewers] = useState(0)
    const [purchases, setPurchases] = useState(0)
    const [location, setLocation] = useState('your area')

    useEffect(() => {
        // Hydration safe randoms
        setViewers(Math.floor(Math.random() * (45 - 12) + 12))
        setPurchases(Math.floor(Math.random() * (12 - 2) + 2))

        // Simple location simulation
        const cities = ['London', 'New York', 'Mumbai', 'Paris', 'Tokyo', 'Berlin', 'Dubai', 'Toronto']
        // setLocation(cities[Math.floor(Math.random() * cities.length)]) 
        // Or just generic "your area" to avoid looking fake if it mismatches user IP
    }, [])

    useEffect(() => {
        const interval = setInterval(() => {
            // Fluctuate viewers
            setViewers(prev => {
                const change = Math.floor(Math.random() * 5) - 2
                return Math.max(5, prev + change)
            })
        }, 5000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="space-y-2 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="relative">
                    <Eye className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping" />
                </div>
                <span className="font-medium animate-pulse">{viewers} people</span> are viewing this right now
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span>Purchased <strong>{purchases} times</strong> in the last 24 hours</span>
            </div>

            {/* <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span>Trending in <strong>{location}</strong></span>
            </div> */}
        </div>
    )
}
