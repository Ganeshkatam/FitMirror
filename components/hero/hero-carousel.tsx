'use client'

import * as React from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { CinematicHero } from './cinematic-hero'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play, Clock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import Image from 'next/image'

export function HeroCarousel() {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 6000, stopOnInteraction: true })])
    const [selectedIndex, setSelectedIndex] = React.useState(0)

    const onSelect = React.useCallback(() => {
        if (!emblaApi) return
        setSelectedIndex(emblaApi.selectedScrollSnap())
    }, [emblaApi])

    React.useEffect(() => {
        if (!emblaApi) return
        onSelect()
        emblaApi.on('select', onSelect)
        emblaApi.on('reInit', onSelect)
    }, [emblaApi, onSelect])

    const scrollTo = (index: number) => emblaApi && emblaApi.scrollTo(index)

    return (
        <section className="relative w-full h-[85vh] md:h-[90vh] overflow-hidden bg-black">
            <div className="h-full" ref={emblaRef}>
                <div className="flex h-full touch-pan-y">
                    {/* Slide 1: Cinematic 3D Hero */}
                    <div className="flex-[0_0_100%] min-w-0 relative h-full">
                        <CinematicHero className="h-full" />
                    </div>

                    {/* Slide 2: Urban Video Style */}
                    <div className="flex-[0_0_100%] min-w-0 relative h-full bg-neutral-900 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 opacity-60">
                            {/* Placeholder for video - effectively using a gradient/image pattern for now until actual video asset is available */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900 via-black to-black animate-pulse-slow" />
                            {/* Grid Pattern */}
                            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                        </div>

                        <div className="container relative z-10 px-4 text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8 animate-fade-in-up">
                                <Play className="h-4 w-4 text-purple-400" fill="currentColor" />
                                <span className="text-sm font-bold text-white uppercase tracking-widest">New Collection</span>
                            </div>
                            <h2 className="text-5xl md:text-8xl font-serif font-bold text-white mb-6 leading-tight animate-fade-in-up delay-100">
                                Urban <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Mirage</span>
                            </h2>
                            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 animate-fade-in-up delay-200">
                                Discover the latest streetwear trends designed for the digital age.
                                Bold cuts, futuristic fabrics, and AI-optimized fits.
                            </p>
                            <Link href="/shop?category=streetwear" className="animate-fade-in-up delay-300 inline-block">
                                <Button size="lg" className="rounded-full h-14 px-10 text-lg bg-white text-black hover:bg-gray-200 hover:scale-105 transition-all">
                                    Shop The Look <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Slide 3: Flash Sale */}
                    <div className="flex-[0_0_100%] min-w-0 relative h-full bg-amber-900 flex items-center justify-center overflow-hidden">
                        {/* Abstract Background */}
                        <div className="absolute inset-0">
                            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-orange-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-red-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
                        </div>

                        <div className="container relative z-10 px-4 flex flex-col items-center text-center">
                            <div className="mb-6 animate-bounce">
                                <span className="text-6xl md:text-8xl">⚡</span>
                            </div>
                            <h2 className="text-6xl md:text-9xl font-black text-white italic tracking-tighter mb-4 drop-shadow-2xl skew-x-[-10deg]">
                                FLASH SALE
                            </h2>
                            <div className="inline-block bg-black/30 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl mb-8 transform -rotate-2">
                                <p className="text-2xl md:text-4xl font-bold text-yellow-400 font-mono tracking-widest">
                                    UP TO 70% OFF
                                </p>
                            </div>
                            <p className="text-white/80 text-xl md:text-2xl mb-10 max-w-xl">
                                Limited time offer on select premium items. Prices reset at midnight.
                            </p>
                            <Link href="/shop?discount=50">
                                <Button size="lg" className="h-16 px-12 rounded-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-xl font-bold shadow-xl hover:shadow-2xl hover:scale-110 transition-all border-2 border-white/20">
                                    Shop Sale Now
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {[0, 1, 2].map((index) => (
                    <button
                        key={index}
                        onClick={() => scrollTo(index)}
                        className={cn(
                            "w-2.5 h-2.5 rounded-full transition-all duration-300",
                            selectedIndex === index
                                ? "w-8 bg-white"
                                : "bg-white/40 hover:bg-white/60"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Previous/Next Buttons (Desktop) */}
            {/* Can be added if needed, but keeping it clean for now */}
        </section>
    )
}
