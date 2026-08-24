'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { getLiveActivityStream } from '@/lib/service/activity-stream'

const MOCK_ACTIVITIES = [
    "Sophia just bought 'Silk Midi Dress' in Mumbai",
    "124 people are viewing 'Oversized Bomber' right now",
    "New Drop: 'Winter Collection' is selling fast 🔥",
    "Arjun in Delhi just tried on 'Cargo Pants'",
    "Free Shipping on all orders above ₹2999 ends soon"
]

export function LiveTicker() {
    // In a real app, this would fetch from an API or WebSocket
    // For now, we cycle through mock events for that "live" feel

    return (
        <div className="w-full bg-black text-white overflow-hidden py-3 border-b border-white/10 relative z-30">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent z-10" />

            <motion.div
                animate={{ x: [0, -1000] }}
                transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                className="flex items-center gap-12 w-max px-4"
            >
                {[...MOCK_ACTIVITIES, ...MOCK_ACTIVITIES, ...MOCK_ACTIVITIES].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm font-medium tracking-wide text-white/90">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span>{item}</span>
                    </div>
                ))}
            </motion.div>
        </div>
    )
}
