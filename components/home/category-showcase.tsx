'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryCardProps {
    title: string
    discount: string
    image: string
    href: string
    className?: string
}

function CategoryCard({ title, discount, image, href, className }: CategoryCardProps) {
    return (
        <Link
            href={href}
            className={cn(
                "group relative block overflow-hidden rounded-lg aspect-[3/4] transition-all hover:shadow-xl",
                className
            )}
        >
            {/* Image */}
            <div className="absolute inset-0">
                <img
                    src={image}
                    alt={title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
            </div>

            {/* Overlay Gradient - Myntra Style (Orange/Red Fade) */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-orange-900/90 via-orange-800/60 to-transparent flex flex-col justify-end p-4 text-center">
                <div className="transform transition-transform duration-300 translate-y-2 group-hover:translate-y-0">
                    <h3 className="text-xl font-bold text-white uppercase tracking-wide mb-1 drop-shadow-md">
                        {title}
                    </h3>

                    <div className="mb-3">
                        <span className="inline-block bg-yellow-400 text-orange-900 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider transform -skew-x-12">
                            {discount}
                        </span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs font-medium text-white/90 uppercase tracking-widest flex items-center justify-center gap-1">
                        Shop Now <ArrowRight className="h-3 w-3" />
                    </div>
                </div>
            </div>
        </Link>
    )
}

const CATEGORIES = [
    {
        title: "Ethnic Wear",
        discount: "50-80% OFF",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1000&auto=format&fit=crop",
        href: "/shop/women?category=ethnic"
    },
    {
        title: "Activewear",
        discount: "30-70% OFF",
        image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=1000&auto=format&fit=crop",
        href: "/shop/men?category=activewear"
    },
    {
        title: "Western Wear",
        discount: "40-80% OFF",
        image: "https://images.unsplash.com/photo-1550614000-4b9519e02d48?q=80&w=1000&auto=format&fit=crop",
        href: "/shop/women?category=western"
    },
    {
        title: "Sportswear",
        discount: "Min 40% OFF",
        image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=1000&auto=format&fit=crop",
        href: "/shop/women?category=sports"
    },
    {
        title: "Loungewear",
        discount: "Flat 60% OFF",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
        href: "/shop/women?category=lounge"
    },
    {
        title: "Watches",
        discount: "Up to 80% OFF",
        image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1000&auto=format&fit=crop",
        href: "/shop/accessories?category=watches"
    },
    {
        title: "Footwear",
        discount: "40-80% OFF",
        image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1000&auto=format&fit=crop",
        href: "/shop/women?category=footwear"
    },
    {
        title: "Bags & Wallets",
        discount: "40-70% OFF",
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&auto=format&fit=crop",
        href: "/shop/accessories?category=bags"
    },
    {
        title: "Office Wear",
        discount: "40-70% OFF",
        image: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=1000&auto=format&fit=crop",
        href: "/shop/women?category=office"
    },
    {
        title: "Kids Wear",
        discount: "Max 70% OFF",
        image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=1000&auto=format&fit=crop",
        href: "/shop/kids"
    }
]

export function CategoryShowcase() {
    return (
        <section className="py-12 bg-gray-50/50">
            <div className="container mx-auto px-4">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 uppercase">
                            Shop By Category
                        </h2>
                        <div className="h-1 w-20 bg-pink-500 mt-2 rounded-full"></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                    {CATEGORIES.map((category, index) => (
                        <CategoryCard key={index} {...category} />
                    ))}
                </div>
            </div>
        </section>
    )
}
