'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Category {
    id: string
    name: string
    slug: string
    image_url: string
    discount_text?: string | null
    link_url?: string
}

interface CategoryOrbitProps {
    categories: Category[]
}

export function CategoryOrbit({ categories }: CategoryOrbitProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null)

    // Deduplicate by slug, take top 10
    const uniqueCategories = Array.from(
        new Map(categories.map(item => [item.slug, item])).values()
    ).slice(0, 10)

    if (uniqueCategories.length === 0) return null

    return (
        <section className="py-4 md:py-6 bg-white border-b border-gray-100">
            <div className="max-w-[1800px] mx-auto">
                {/* Section Header */}
                <div className="px-4 mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">
                        Shop by Category
                    </h2>
                    <Link
                        href="/shop"
                        className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                    >
                        View All →
                    </Link>
                </div>

                {/* Horizontal Scroll */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 md:gap-6 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory scroll-smooth"
                >
                    {uniqueCategories.map((cat, idx) => (
                        <Link
                            key={cat.id || idx}
                            href={cat.link_url || `/shop?category=${cat.slug}`}
                            className="flex-shrink-0 snap-center group"
                        >
                            {/* Circular Image */}
                            <div className={cn(
                                "relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-gray-100",
                                "ring-2 ring-transparent group-hover:ring-amber-400 transition-all duration-300",
                                "shadow-sm group-hover:shadow-md"
                            )}>
                                <Image
                                    src={cat.image_url}
                                    alt={cat.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    sizes="80px"
                                />
                                {/* Subtle gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            {/* Label */}
                            <p className="mt-1.5 text-center text-[10px] md:text-xs font-medium text-gray-700 group-hover:text-gray-900 transition-colors max-w-[64px] md:max-w-[80px] truncate">
                                {cat.name}
                            </p>

                            {/* Discount text */}
                            {cat.discount_text && (
                                <p className="text-center text-[8px] md:text-[10px] font-bold text-green-600 truncate max-w-[64px] md:max-w-[80px]">
                                    {cat.discount_text}
                                </p>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
