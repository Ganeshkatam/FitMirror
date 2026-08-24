'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, TrendingUp, Flame } from 'lucide-react'
import { motion } from 'framer-motion'

interface TrendingProduct {
    id: string
    name: string
    image: string
    price: number
    badge?: 'hot' | 'new' | 'sale'
}

interface TrendingStripProps {
    products: TrendingProduct[]
}

export function TrendingStrip({ products }: TrendingStripProps) {
    if (!products || products.length === 0) return null

    return (
        <section className="w-full py-6 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 overflow-hidden">
            <div className="max-w-[1800px] mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-white">
                        <Flame className="h-5 w-5 animate-pulse" />
                        <span className="font-bold uppercase tracking-wider text-sm">Trending Now</span>
                    </div>
                    <Link href="/shop?sort=popular" className="text-white/80 hover:text-white text-sm flex items-center gap-1 transition-colors">
                        View All <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Scrolling Strip */}
                <div className="relative -mx-4 md:-mx-6">
                    <motion.div
                        className="flex gap-4 px-4 md:px-6"
                        animate={{ x: [0, -1920] }}
                        transition={{
                            x: {
                                duration: 30,
                                repeat: Infinity,
                                ease: 'linear'
                            }
                        }}
                    >
                        {/* Double the products for seamless loop */}
                        {[...products, ...products].map((product, i) => (
                            <Link
                                key={`${product.id}-${i}`}
                                href={`/product/${product.id}`}
                                className="flex-shrink-0 group"
                            >
                                <div className="relative w-24 h-32 md:w-32 md:h-40 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20">
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-2 left-2 right-2">
                                        <p className="text-white text-[10px] md:text-xs font-medium truncate">{product.name}</p>
                                        <p className="text-white/80 text-[10px] font-bold">₹{product.price}</p>
                                    </div>
                                    {product.badge === 'hot' && (
                                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                            <Flame className="h-2 w-2" /> HOT
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
