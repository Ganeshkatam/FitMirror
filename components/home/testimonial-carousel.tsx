'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Testimonial {
    id: number
    name: string
    avatar: string
    role: string
    rating: number
    text: string
    product?: string
}

// Removed hardcoded TESTIMONIALS

interface TestimonialCarouselProps {
    reviews?: Testimonial[]
}

export function TestimonialCarousel({ reviews = [] }: TestimonialCarouselProps) {
    const [current, setCurrent] = useState(0)
    const [autoPlay, setAutoPlay] = useState(true)

    const items = reviews.length > 0 ? reviews : [] // Empty state handled in parent or here

    useEffect(() => {
        if (!autoPlay || items.length === 0) return
        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % items.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [autoPlay, items.length])

    const next = () => {
        if (items.length === 0) return
        setAutoPlay(false)
        setCurrent(prev => (prev + 1) % items.length)
    }

    const prev = () => {
        if (items.length === 0) return
        setAutoPlay(false)
        setCurrent(prev => (prev - 1 + items.length) % items.length)
    }

    if (items.length === 0) return null

    return (
        <section className="w-full py-16 md:py-24 bg-gradient-to-b from-stone-50 to-amber-50/30 overflow-hidden">
            <div className="max-w-[1800px] mx-auto px-4 md:px-6">
                <div className="text-center mb-12">
                    <p className="text-amber-600 font-medium mb-2">💬 Customer Love</p>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">
                        What Our Community Says
                    </h2>
                </div>

                <div className="relative max-w-4xl mx-auto">
                    {/* Quote Icon */}
                    <Quote className="absolute -top-4 left-4 md:left-0 h-16 w-16 text-amber-200/50 -z-10" />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="bg-white rounded-3xl p-8 md:p-12 shadow-xl"
                        >
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                {/* Avatar & Info */}
                                <div className="flex flex-col items-center text-center md:w-1/4">
                                    <div className="relative h-20 w-20 rounded-full overflow-hidden ring-4 ring-indigo-50 mb-4 shadow-inner">
                                        <Image
                                            src={items[current].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(items[current].name)}&background=random`}
                                            alt={items[current].name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <h4 className="font-bold text-indigo-950">{items[current].name}</h4>
                                    <p className="text-sm text-indigo-600/80">{items[current].role}</p>
                                    <div className="flex gap-0.5 mt-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-4 w-4 ${i < items[current].rating ? 'fill-amber-400 text-amber-400' : 'text-indigo-100'}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Testimonial Text */}
                                <div className="flex-1 text-center md:text-left">
                                    <p className="text-xl md:text-2xl font-serif text-indigo-900 leading-relaxed mb-4 italic">
                                        &quot;{items[current].text}&quot;
                                    </p>
                                    {items[current].product && (
                                        <p className="text-sm text-muted-foreground">
                                            Purchased: <span className="font-medium text-indigo-600">{items[current].product}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <button
                            onClick={prev}
                            className="h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-indigo-50 text-indigo-900 transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>

                        <div className="flex gap-2">
                            {items.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setAutoPlay(false)
                                        setCurrent(i)
                                    }}
                                    className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-amber-500' : 'w-2 bg-gray-300 hover:bg-gray-400'
                                        }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={next}
                            className="h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}
