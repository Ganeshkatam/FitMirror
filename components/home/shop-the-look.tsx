'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Hotspot {
    id: string
    x: number // Percentage 0-100
    y: number // Percentage 0-100
    product: {
        id: string
        name: string
        price: number
        image: string
    }
}

// Mock Data for "Street Luxe" Look
const LOOK_1: Hotspot[] = [
    {
        id: 'hs1',
        x: 45,
        y: 35,
        product: {
            id: 'prod_jacket_1',
            name: 'Oversized Leather Bomber',
            price: 12999,
            image: '/images/products/jacket-1.jpg' // Placeholder
        }
    },
    {
        id: 'hs2',
        x: 55,
        y: 65,
        product: {
            id: 'prod_pants_1',
            name: 'Wide Leg Cargo Trousers',
            price: 5499,
            image: '/images/products/pants-1.jpg' // Placeholder
        }
    }
]

export function ShopTheLook() {
    const [activeSpot, setActiveSpot] = useState<string | null>(null)

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row gap-12 items-center">
                    {/* Text Content */}
                    <div className="w-full md:w-1/3 space-y-6">
                        <span className="text-xs font-bold tracking-widest uppercase text-indigo-600">Editorial</span>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 leading-tight">
                            Street <br /> Luxe
                        </h2>
                        <p className="text-slate-600 leading-relaxed">
                            Combine comfort with high-fashion silhouettes. This season looks features oversized fits, premium textures, and utilitarian details.
                        </p>
                        <Button variant="link" className="p-0 h-auto text-indigo-600 font-medium group">
                            View Full Editorial <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>

                    {/* Interactive Image */}
                    <div className="w-full md:w-2/3 relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 group">
                        <Image
                            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2020&auto=format&fit=crop"
                            alt="Shop the Look"
                            fill
                            className="object-cover"
                        />

                        {/* Hotspots */}
                        {LOOK_1.map((spot) => (
                            <div
                                key={spot.id}
                                className="absolute z-10"
                                style={{ top: `${spot.y}%`, left: `${spot.x}%` }}
                            >
                                <button
                                    onClick={() => setActiveSpot(activeSpot === spot.id ? null : spot.id)}
                                    // onMouseEnter={() => setActiveSpot(spot.id)}
                                    className="relative grid place-items-center w-8 h-8 -translate-x-1/2 -translate-y-1/2 group/spot"
                                >
                                    <span className="absolute inset-0 bg-white rounded-full animate-ping opacity-50" />
                                    <span className="relative w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110">
                                        {activeSpot === spot.id ? <X className="w-4 h-4 text-black" /> : <Plus className="w-4 h-4 text-black" />}
                                    </span>
                                </button>

                                {/* Product Popover */}
                                <AnimatePresence>
                                    {activeSpot === spot.id && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-10 left-1/2 -translate-x-1/2 w-48 bg-white rounded-xl shadow-xl p-3 z-20 pointer-events-auto"
                                        >
                                            <div className="relative aspect-square rounded-lg bg-gray-100 mb-2 overflow-hidden">
                                                {/* Placeholder for actual product image logic - using generic for now if specific not found */}
                                                <div className="absolute inset-0 bg-indigo-50 flex items-center justify-center text-indigo-200">
                                                    Product Image
                                                </div>
                                            </div>
                                            <h4 className="font-serif font-medium text-sm text-slate-900 mb-1">{spot.product.name}</h4>
                                            <p className="text-xs text-slate-500 mb-3">₹{spot.product.price.toLocaleString()}</p>
                                            <Link href={`/product/${spot.product.id}`}>
                                                <Button size="sm" className="w-full text-xs h-8 bg-black text-white hover:bg-black/90 rounded-full">
                                                    View Item
                                                </Button>
                                            </Link>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
