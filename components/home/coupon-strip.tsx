'use client'

import { useState } from 'react'
import { X, Copy, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function CouponStrip() {
    const [isVisible, setIsVisible] = useState(true)

    const copyCode = () => {
        navigator.clipboard.writeText('FITMIRROR25')
        toast.success('Coupon code copied!')
    }

    if (!isVisible) return null

    return (
        <div className="relative bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

            <div className="container mx-auto px-4 h-12 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2 text-sm font-medium md:text-base">
                    <span className="hidden md:inline bg-white/20 px-2 py-0.5 rounded text-xs uppercase tracking-wider">New User Offer</span>
                    <span>Get <span className="font-bold text-yellow-200">25% OFF</span> on your first order!</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/20 cursor-pointer hover:bg-white/20 transition-colors" onClick={copyCode}>
                        <Tag className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="font-mono font-bold tracking-wider text-sm">FITMIRROR25</span>
                        <Copy className="h-3 w-3 md:h-4 md:w-4 opacity-70" />
                    </div>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
