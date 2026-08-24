'use client'

import React from 'react'
import Link from 'next/link'
import { TrendingUp, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/product/product-card'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/scroll-reveal'
import { cn } from '@/lib/utils'

interface Product {
    id: string
    name: string
    price: number
    images: string[]
    velocity?: number
    brand?: string
    category?: string
}

interface RecommendedProductsProps {
    products: Product[]
    title?: string
    subtitle?: string
    className?: string
}

export function RecommendedProducts({
    products,
    title = "Most Loved",
    subtitle = "Top-rated styles our community can't get enough of",
    className
}: RecommendedProductsProps) {
    if (!products || products.length === 0) return null

    return (
        <section className={cn("w-full py-12 md:py-24 bg-white", className)}>
            <div className="w-full max-w-[1800px] mx-auto px-4 md:px-6">
                <FadeIn className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 md:mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-100 to-pink-100 px-3 py-1 rounded-full mb-3">
                            <TrendingUp className="h-4 w-4 text-rose-600" />
                            <span className="text-rose-700 text-sm font-medium">Bestsellers</span>
                        </div>
                        <h2 className="text-2xl md:text-5xl font-serif font-bold tracking-tight text-gray-900">
                            {title}
                        </h2>
                        <p className="text-muted-foreground mt-2 max-w-lg text-sm md:text-lg">
                            {subtitle}
                        </p>
                    </div>
                    <Link href="/shop?sort=velocity">
                        <Button variant="ghost" className="hidden md:flex group text-base">
                            View Top Charts
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </FadeIn>

                <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
                    {products.slice(0, 8).map((product, idx) => (
                        <StaggerItem key={product.id}>
                            <div className="relative">
                                {/* Top 3 Badges */}
                                {idx < 3 && (
                                    <div className="absolute -top-3 -left-3 z-10 h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg flex items-center justify-center text-white font-bold text-sm md:text-lg border-2 border-white">
                                        #{idx + 1}
                                    </div>
                                )}
                                <ProductCard product={product} />
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>

                <div className="mt-8 text-center md:hidden">
                    <Link href="/shop?sort=velocity">
                        <Button variant="outline" className="w-full">
                            View All Bestsellers
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    )
}
