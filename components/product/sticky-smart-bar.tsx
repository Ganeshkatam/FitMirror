'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ShoppingBag } from 'lucide-react'
import Image from 'next/image'

interface StickySmartBarProps {
    product: any
    selectedSize: string | null
    isOutOfStock: boolean
    onAddToCart: () => void
}

export function StickySmartBar({ product, selectedSize, isOutOfStock, onAddToCart }: StickySmartBarProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            // Show when scrolled past 600px (roughly past main image/details)
            setIsVisible(window.scrollY > 600)
        }

        window.addEventListener('scroll', handleScroll)

        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    if (!isVisible) return null

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 z-40"
                >
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-4 flex flex-col gap-3">
                        {/* Product Info & Action */}
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                <Image
                                    src={product.images?.[0]?.src || product.image || '/placeholder.jpg'}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-gray-900 truncate">{product.name}</h4>
                                <p className="text-xs text-gray-500">
                                    Size: {selectedSize || 'Select'}
                                </p>
                            </div>

                            <Button
                                size="sm"
                                className="rounded-xl px-4 bg-black hover:bg-gray-800 text-white font-bold"
                                onClick={onAddToCart}
                                disabled={isOutOfStock}
                            >
                                <ShoppingBag className="w-4 h-4 mr-2" />
                                {isOutOfStock ? 'Sold Out' : 'Add'}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
