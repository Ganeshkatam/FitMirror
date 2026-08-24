'use client'

import * as React from 'react'
import { ProductCard } from '@/components/product/product-card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Timer } from 'lucide-react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { cn } from '@/lib/utils'

interface FlashSaleSectionProps {
    products: any[]
}

export function FlashSaleSection({ products = [] }: FlashSaleSectionProps) {
    const [timeLeft, setTimeLeft] = React.useState({ hours: 0, minutes: 0, seconds: 0 })
    const [emblaRef] = useEmblaCarousel({ align: 'start', skipSnaps: false, dragFree: true })

    // Timer Logic: Ends at next midnight
    React.useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date()
            const tomorrow = new Date(now)
            tomorrow.setDate(tomorrow.getDate() + 1)
            tomorrow.setHours(0, 0, 0, 0)

            const diff = tomorrow.getTime() - now.getTime()

            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
            const minutes = Math.floor((diff / 1000 / 60) % 60)
            const seconds = Math.floor((diff / 1000) % 60)

            setTimeLeft({ hours, minutes, seconds })
        }

        calculateTimeLeft()
        const timer = setInterval(calculateTimeLeft, 1000)
        return () => clearInterval(timer)
    }, [])

    if (!products || products.length === 0) return null

    return (
        <section className="py-12 md:py-16 bg-gradient-to-r from-indigo-50 to-purple-50 border-y border-indigo-100">
            <div className="container px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                            <Zap className="h-4 w-4 fill-current" /> Live Now
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-indigo-950">
                            Flash Sale
                        </h2>

                        {/* Timer Display */}
                        <div className="flex items-center gap-3">
                            <Timer className="h-5 w-5 text-indigo-400" />
                            <div className="flex items-center gap-2 font-mono text-xl md:text-2xl font-bold text-indigo-900">
                                <span className="bg-white px-2 py-1 rounded shadow-sm min-w-[2.5ch] text-center">{String(timeLeft.hours).padStart(2, '0')}</span>
                                <span className="text-indigo-200">:</span>
                                <span className="bg-white px-2 py-1 rounded shadow-sm min-w-[2.5ch] text-center">{String(timeLeft.minutes).padStart(2, '0')}</span>
                                <span className="text-indigo-200">:</span>
                                <span className="bg-white px-2 py-1 rounded shadow-sm text-red-500 min-w-[2.5ch] text-center">{String(timeLeft.seconds).padStart(2, '0')}</span>
                            </div>
                            <span className="text-sm text-indigo-500 font-medium">Left to buy</span>
                        </div>
                    </div>

                    <Link href="/shop?discount=50">
                        <Button className="rounded-full bg-indigo-950 text-white hover:bg-indigo-900 gap-2 shadow-lg hover:shadow-xl transition-all border border-indigo-800">
                            View All Deals <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {/* Carousel */}
                <div className="overflow-hidden -mx-4 px-4 py-4" ref={emblaRef}>
                    <div className="flex gap-4 md:gap-6">
                        {products.map((product) => (
                            <div key={product.id} className="flex-[0_0_280px] md:flex-[0_0_320px] min-w-0">
                                <ProductCard product={product} />
                                {/* Deal Badge Overlay if ProductCard doesn't support generic badges easily (it usually does via product prop) */}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
