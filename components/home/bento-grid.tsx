'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BentoGridProps {
    categories: any[]
}

export function BentoGrid({ categories }: BentoGridProps) {
    if (!categories || categories.length === 0) return null

    // We'll take top 5 categories for the bento layout
    const featured = categories.slice(0, 5)

    return (
        <section className="container py-20">
            <div className="flex flex-col items-center mb-12 text-center">
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="text-sm font-semibold text-indigo-500 tracking-wider uppercase"
                >
                    Curated Collections
                </motion.span>
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl md:text-5xl font-serif font-bold mt-2"
                >
                    Shop by Visuals
                </motion.h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-[800px] md:h-[600px]">
                {featured.map((cat, i) => (
                    <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                            "relative group overflow-hidden rounded-3xl cursor-pointer shadow-lg",
                            i === 0 ? "md:col-span-2 md:row-span-2" : "",
                            i === 1 ? "md:col-span-1 md:row-span-1" : "",
                            i === 2 ? "md:col-span-1 md:row-span-2" : "", // Tall one on the right
                            i === 3 ? "md:col-span-1 md:row-span-1" : "",
                            "bg-indigo-50 dark:bg-slate-800"
                        )}
                    >
                        <Link href={`/shop?category=${cat.id}`} className="block h-full w-full">
                            {/* Image */}
                            <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                                <Image
                                    src={cat.image_url || cat.image || '/placeholder.jpg'}
                                    alt={cat.name}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/90 via-[#0f172a]/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                            </div>

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-medium text-indigo-100 mb-1 uppercase tracking-wider">{cat.product_count || '24'} Items</p>
                                        <h3 className="text-2xl font-bold text-white font-serif">{cat.name}</h3>
                                    </div>
                                    <div className="bg-white text-[#0f172a] h-10 w-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                        <ArrowUpRight className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}
