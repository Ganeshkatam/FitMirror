'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Sparkles, ShoppingBag, CheckCircle } from 'lucide-react'
import Image from 'next/image'

interface StickySmartBarProps {
    product: any
    selectedSize: string | null
    isOutOfStock: boolean
    onAddToCart: () => void
}

export function StickySmartBar({ product, selectedSize, isOutOfStock, onAddToCart }: StickySmartBarProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [aiConfidence, setAiConfidence] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            // Show when scrolled past 600px (roughly past main image/details)
            setIsVisible(window.scrollY > 600)
        }

        window.addEventListener('scroll', handleScroll)

        // Simulate AI Calculation
        const timer = setTimeout(() => {
            setAiConfidence(Math.floor(Math.random() * (98 - 85) + 85))
        }, 1500)

        return () => {
            window.removeEventListener('scroll', handleScroll)
            clearTimeout(timer)
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
                        {/* AI Confidence Strip */}
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-indigo-600 font-bold uppercase tracking-wider">
                                <Sparkles className="w-3 h-3" />
                                AI Match
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${aiConfidence}%` }}
                                        transition={{ duration: 1, delay: 0.2 }}
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                    />
                                </div>
                                <span className="font-bold text-gray-700">{aiConfidence}% Match</span>
                            </div>
                        </div>

                        {/* Product Info & Action */}
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                <Image
                                    src={(typeof product.images?.[0] === 'string' ? (typeof product.images?.[0] === 'string' ? product.images[0] : (product.images?.[0] as any)?.src) : (product.images?.[0] as any)?.src) || product.image || '/placeholder.jpg'}
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
