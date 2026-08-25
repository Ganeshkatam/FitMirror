import { ProductImage } from '@/lib/service/media';
'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Heart, ChevronUp, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWishlist } from '@/lib/store/use-wishlist'

interface StoryProduct {
    id: string
    name: string
    brand?: string | null
    price: number
    original_price?: number | null
    images?: ProductImage[]
    image?: string | null
    category?: string | null
}

interface StorySwiperProps {
    products: StoryProduct[]
    title?: string
}

const STORY_DURATION = 5000 // 5 seconds per story

export function StorySwiper({ products, title = "Today's Picks" }: StorySwiperProps) {
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [progress, setProgress] = React.useState(0)
    const [paused, setPaused] = React.useState(false)
    const [expanded] = React.useState(false)
    const timerRef = React.useRef<NodeJS.Timeout | null>(null)
    const startTimeRef = React.useRef(Date.now())
    const { isInWishlist, toggleWishlist } = useWishlist()
    const containerRef = React.useRef<HTMLDivElement>(null)

    const storyProducts = products.slice(0, 10)
    const current = storyProducts[currentIndex]

    // Auto-advance timer
    React.useEffect(() => {
        if (paused || !current || expanded) return

        startTimeRef.current = Date.now() - (progress / 100) * STORY_DURATION

        const animate = () => {
            const elapsed = Date.now() - startTimeRef.current
            const pct = Math.min((elapsed / STORY_DURATION) * 100, 100)
            setProgress(pct)

            if (pct >= 100) {
                goNext()
            } else {
                timerRef.current = setTimeout(animate, 30)
            }
        }

        timerRef.current = setTimeout(animate, 30)

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, paused, expanded])

    const goNext = () => {
        setProgress(0)
        startTimeRef.current = Date.now()
        setCurrentIndex(prev => (prev + 1) % storyProducts.length)
    }

    const goPrev = () => {
        setProgress(0)
        startTimeRef.current = Date.now()
        setCurrentIndex(prev => (prev - 1 + storyProducts.length) % storyProducts.length)
    }

    // Touch handling for left/right tap
    const handleTap = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = e.clientX - rect.left
        if (x < rect.width * 0.3) goPrev()
        else if (x > rect.width * 0.7) goNext()
        else setPaused(p => !p)
    }

    const getImage = (p: StoryProduct) =>
        p.images?.[0]?.src || p.image || '/placeholder.svg'

    const discount = current?.original_price && current.original_price > current.price
        ? Math.round((1 - current.price / current.original_price) * 100)
        : 0

    if (storyProducts.length === 0) return null

    return (
        <section className="md:hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-4 py-3">
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
                <span className="text-xs text-gray-400">{currentIndex + 1}/{storyProducts.length}</span>
            </div>

            {/* Story container */}
            <div
                ref={containerRef}
                className="relative w-full aspect-[3/4] bg-gray-900 rounded-2xl mx-auto overflow-hidden cursor-pointer select-none"
                style={{ maxWidth: 'calc(100vw - 32px)' }}
                onClick={handleTap}
                onMouseDown={() => setPaused(true)}
                onMouseUp={() => setPaused(false)}
                onTouchStart={() => setPaused(true)}
                onTouchEnd={() => setPaused(false)}
            >
                {/* Progress bars */}
                <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 px-3 pt-3">
                    {storyProducts.map((_, i) => (
                        <div key={i} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-none"
                                style={{
                                    width: i < currentIndex ? '100%' :
                                        i === currentIndex ? `${progress}%` : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Product image */}
                <Image
                    src={getImage(current)}
                    alt={current?.name || ''}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw"
                    priority={currentIndex === 0}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10" />

                {/* Pause indicator */}
                {paused && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="bg-black/40 rounded-full p-3">
                            <Pause className="h-6 w-6 text-white" />
                        </div>
                    </div>
                )}

                {/* Right side actions */}
                <div className="absolute right-3 bottom-32 z-20 flex flex-col gap-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            if (current) toggleWishlist(current.id)
                        }}
                        className="h-11 w-11 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
                    >
                        <Heart
                            className={cn("h-5 w-5", isInWishlist(current?.id || '') ? "text-[#ff3f6c] fill-[#ff3f6c]" : "text-white")}
                        />
                    </button>
                    <Link
                        href={`/product/${current?.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="h-11 w-11 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
                    >
                        <ShoppingBag className="h-5 w-5 text-white" />
                    </Link>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
                    {current?.brand && (
                        <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">{current.brand}</p>
                    )}
                    <h3 className="text-white text-lg font-semibold leading-tight line-clamp-2 mb-2">
                        {current?.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-white text-xl font-bold">₹{current?.price?.toLocaleString('en-IN')}</span>
                        {current?.original_price && current.original_price > current.price && (
                            <>
                                <span className="text-white/40 text-sm line-through">₹{current.original_price.toLocaleString('en-IN')}</span>
                                <span className="text-green-400 text-sm font-bold">{discount}% OFF</span>
                            </>
                        )}
                    </div>

                    {/* Swipe up hint */}
                    <Link
                        href={`/product/${current?.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-1 text-white/70 text-xs animate-bounce"
                    >
                        <ChevronUp className="h-4 w-4" />
                        <span>View Details</span>
                    </Link>
                </div>
            </div>
        </section>
    )
}
