'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Timer } from 'lucide-react'
import Link from 'next/link'

export function DealsHero() {
    const [timeLeft, setTimeLeft] = useState({ h: 12, m: 0, s: 0 })

    useEffect(() => {
        // Mock countdown to midnight
        const timer = setInterval(() => {
            const now = new Date()
            const midnight = new Date()
            midnight.setHours(24, 0, 0, 0)
            const diff = midnight.getTime() - now.getTime()

            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const s = Math.floor((diff % (1000 * 60)) / 1000)

            setTimeLeft({ h, m, s })
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white shadow-xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

            <div className="relative px-6 py-12 md:py-16 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-6 max-w-xl text-center md:text-left">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold border border-white/30">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
                        </span>
                        FLASH SALE LIVE
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                        UP TO <span className="text-yellow-300">70% OFF</span><br />
                        TODAY ONLY
                    </h1>
                    <p className="text-lg md:text-xl text-pink-100 font-medium">
                        Grab the hottest styles at unbeatable prices. Use code <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white border border-white/20">FLASH20</span> for extra 20% off.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <Button asChild size="lg" className="bg-white text-rose-600 hover:bg-gray-100 font-bold h-12 px-8 rounded-full shadow-lg">
                            <a href="#shop-deals">Shop Deals Now</a>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="border-2 border-white/40 text-white hover:bg-white/10 hover:text-white font-bold h-12 px-8 rounded-full bg-transparent">
                            <Link href="/shop">View All Products</Link>
                        </Button>
                    </div>
                </div>

                {/* Countdown Card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 md:p-8 flex flex-col items-center gap-4 min-w-[300px] shadow-2xl transform hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center gap-2 text-pink-100 font-semibold uppercase tracking-wider text-sm">
                        <Timer className="w-4 h-4" />
                        Offer Ends In
                    </div>
                    <div className="flex items-start gap-4 text-center">
                        <div>
                            <div className="text-4xl md:text-5xl font-black font-mono tabular-nums leading-none mb-1">
                                {timeLeft.h.toString().padStart(2, '0')}
                            </div>
                            <div className="text-[10px] md:text-xs uppercase tracking-widest text-pink-200">Hours</div>
                        </div>
                        <div className="text-4xl md:text-5xl font-black leading-none opacity-50">:</div>
                        <div>
                            <div className="text-4xl md:text-5xl font-black font-mono tabular-nums leading-none mb-1">
                                {timeLeft.m.toString().padStart(2, '0')}
                            </div>
                            <div className="text-[10px] md:text-xs uppercase tracking-widest text-pink-200">Mins</div>
                        </div>
                        <div className="text-4xl md:text-5xl font-black leading-none opacity-50">:</div>
                        <div>
                            <div className="text-4xl md:text-5xl font-black font-mono tabular-nums text-yellow-300 leading-none mb-1">
                                {timeLeft.s.toString().padStart(2, '0')}
                            </div>
                            <div className="text-[10px] md:text-xs uppercase tracking-widest text-pink-200">Secs</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
