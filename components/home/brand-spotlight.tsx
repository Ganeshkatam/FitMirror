'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Collection {
    id: string
    title: string
    subtitle: string | null
    image_url: string
    offer_text: string | null
    brand_logo?: string
    link_url: string | null
    sort_order?: number | null
}

interface BrandSpotlightProps {
    collections: Collection[]
}

export function BrandSpotlight({ collections }: BrandSpotlightProps) {
    // Deduplicate collections by title
    const uniqueCollections = Array.from(new Map(collections.map(item => [item.title, item])).values())
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

    return (
        <section className="py-8 md:py-16 bg-gradient-to-b from-gray-50 to-white">
            <div className="container px-4">
                <div className="text-center mb-6 md:mb-10">
                    <h2 className="text-xs md:text-sm font-bold tracking-[0.2em] text-amber-600 uppercase mb-2">
                        Powered by FitMirror Engine
                    </h2>
                    <h3 className="text-2xl md:text-5xl font-serif font-bold text-gray-900">
                        AI-Curated Collections
                    </h3>
                </div>

                {/* Mobile: Horizontal scroll carousel */}
                <div className="md:hidden">
                    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
                        {uniqueCollections.map((col, idx) => (
                            <Link
                                key={col.id || idx}
                                href={col.link_url || '/shop'}
                                className="group relative flex-shrink-0 w-[140px] snap-start bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm"
                            >
                                {/* Compact mobile card */}
                                <div className="relative aspect-[3/4] overflow-hidden">
                                    <Image
                                        src={col.image_url}
                                        alt={col.title}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-transparent to-transparent" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-2 text-center">
                                    <p className="text-[9px] text-white/80 font-bold tracking-wider uppercase mb-0.5">{col.subtitle}</p>
                                    <h4 className="font-serif text-xs font-bold text-white mb-1 truncate">{col.title}</h4>
                                    {col.offer_text && (
                                        <div className="inline-block bg-indigo-950 text-white text-[8px] font-bold px-2 py-0.5 rounded-sm uppercase">
                                            {col.offer_text}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Desktop: Grid layout */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {uniqueCollections.map((col, idx) => (
                        <div key={col.id || idx} className="group relative bg-white border border-indigo-50 hover:shadow-2xl transition-all duration-500 overflow-hidden rounded-xl">
                            {/* Image Container */}
                            <div className="relative aspect-[4/5] overflow-hidden">
                                <Image
                                    src={col.image_url}
                                    alt={col.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-indigo-950/10 group-hover:bg-indigo-950/20 transition-colors" />

                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/90 to-transparent pt-12">
                                    <div className="text-center transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                        <p className="text-xs text-indigo-500 font-bold tracking-widest uppercase mb-1">{col.subtitle}</p>
                                        <h4 className="font-serif text-xl font-bold mb-2 text-indigo-950">{col.title}</h4>
                                        {col.offer_text && (
                                            <div className="inline-block bg-indigo-950 text-white text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wide">
                                                {col.offer_text}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-indigo-100 px-4 py-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover-lift rounded-full">
                                <span className="font-serif font-bold text-xs tracking-widest text-indigo-900">FitMirror AI</span>
                            </div>

                            <Link href={col.link_url || '/shop'} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Button variant="outline" className="bg-white/95 text-indigo-950 border-none hover:bg-indigo-950 hover:text-white transition-colors uppercase text-xs tracking-widest font-bold shadow-xl pointer-events-none rounded-full px-6">
                                    Explore Deal
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
