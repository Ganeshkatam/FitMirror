'use client'

import React from 'react'
import { LuxuryProductCard } from '@/components/product/luxury-product-card'
import Masonry from 'react-masonry-css'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Grip } from 'lucide-react'

interface MasonryGridProps {
    products: any[]
    viewMode?: 'grid' | 'masonry'
}

export function MasonryGrid({ products, viewMode = 'masonry' }: MasonryGridProps) {
    const breakpointColumnsObj = {
        default: 4,
        1536: 4, // 2xl
        1280: 3, // xl
        1024: 3, // lg
        768: 2,  // md
        640: 2   // sm
    };

    if (viewMode === 'grid') {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {products.map((product, i) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                    >
                        <LuxuryProductCard product={product} />
                    </motion.div>
                ))}
            </div>
        )
    }

    return (
        <Masonry
            breakpointCols={breakpointColumnsObj}
            className="flex w-auto -ml-4 md:-ml-6"
            columnClassName="pl-4 md:pl-6 bg-clip-padding"
        >
            {products.map((product, i) => (
                <div key={`${product.id}-${i}`} className="mb-4 md:mb-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                    >
                        <LuxuryProductCard
                            product={product}
                            className="h-full"
                        />
                    </motion.div>
                </div>
            ))}
        </Masonry>
    )
}
