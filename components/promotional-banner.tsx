'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Banner {
    id: string
    title: string
    subtitle: string | null
    image_url: string
    link_url: string | null
    button_text: string | null
}

interface PromotionalBannerProps {
    banners: Banner[]
}

export function PromotionalBanner({ banners }: PromotionalBannerProps) {
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [isPaused, setIsPaused] = React.useState(false)

    // Auto-rotate banners
    React.useEffect(() => {
        if (banners.length <= 1 || isPaused) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length)
        }, 5000) // Change every 5 seconds

        return () => clearInterval(interval)
    }, [banners.length, isPaused])

    if (!banners || banners.length === 0) return null

    const goToPrev = () => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length)
    }

    const currentBanner = banners[currentIndex]

    return (
        <div
            className="relative w-full bg-gradient-to-r from-amber-50 to-rose-50 overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Banner Content */}
            <div className="relative h-[200px] sm:h-[280px] md:h-[350px] lg:h-[400px]">
                {banners.map((banner, index) => (
                    <div
                        key={banner.id}
                        className={cn(
                            "absolute inset-0 transition-all duration-700 ease-in-out",
                            index === currentIndex
                                ? "opacity-100 translate-x-0"
                                : index < currentIndex
                                    ? "opacity-0 -translate-x-full"
                                    : "opacity-0 translate-x-full"
                        )}
                    >
                        {/* Background Image */}
                        <Image
                            src={banner.image_url}
                            alt={banner.title}
                            fill
                            priority={index === 0}
                            className="object-cover"
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

                        {/* Content */}
                        <div className="absolute inset-0 flex items-center">
                            <div className="container mx-auto px-6 md:px-12">
                                <div className="max-w-xl space-y-4">
                                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                                        {banner.title}
                                    </h2>
                                    {banner.subtitle && (
                                        <p className="text-lg sm:text-xl text-white/90 drop-shadow">
                                            {banner.subtitle}
                                        </p>
                                    )}
                                    {banner.link_url && (
                                        <Link href={banner.link_url}>
                                            <Button
                                                size="lg"
                                                className="mt-4 bg-white text-black hover:bg-white/90 font-semibold shadow-lg"
                                            >
                                                {banner.button_text || 'Shop Now'}
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={goToPrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                        aria-label="Previous banner"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                        aria-label="Next banner"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all",
                                index === currentIndex
                                    ? "bg-white w-6"
                                    : "bg-white/50 hover:bg-white/75"
                            )}
                            aria-label={`Go to banner ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
