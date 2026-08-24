'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Eye, Sparkles, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Product {
    id: string
    name: string
    price: number
    category: string
    image?: string
    description?: string
}

interface ChatProductCardProps {
    product: Product
    onAddToCart?: (product: Product) => void
    index?: number
}

export function ChatProductCard({ product, onAddToCart, index = 0 }: ChatProductCardProps) {
    const [showOptions, setShowOptions] = useState(false)

    const handleAddToCart = () => {
        onAddToCart?.(product)
        // Also save to localStorage cart
        try {
            const cartData = localStorage.getItem('cart')
            const cart = cartData ? JSON.parse(cartData) : { items: [] }
            const existingItem = cart.items.find((item: { id: string }) => item.id === product.id)

            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + 1
            } else {
                cart.items.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image_url: product.image,
                    quantity: 1,
                })
            }

            localStorage.setItem('cart', JSON.stringify(cart))

            // Show feedback
            setShowOptions(false)
            alert(`${product.name} added to cart! 🛒`)
        } catch {
            // Ignore cart errors
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="relative"
        >
            {/* Product Card */}
            <div
                onClick={() => setShowOptions(!showOptions)}
                className="group cursor-pointer flex gap-3 p-3 rounded-xl bg-gradient-to-br from-white/90 to-white/60 dark:from-gray-800/90 dark:to-gray-800/60 backdrop-blur-sm border border-amber-200/30 dark:border-amber-700/30 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-600 transition-all"
            >
                {/* Product Image */}
                <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-amber-50 to-rose-50 dark:from-gray-700 dark:to-gray-600 ring-2 ring-amber-200/50 dark:ring-amber-700/30">
                    {product.image ? (
                        <Image
                            src={product.image}
                            alt={product.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                            👗
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                        <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-amber-600 transition-colors">
                            {product.name}
                        </h4>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">
                            {product.category}
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                            ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Tap for options →
                        </span>
                    </div>
                </div>
            </div>

            {/* Options Overlay */}
            <AnimatePresence>
                {showOptions && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-xl flex items-center justify-center gap-2 p-4 z-10"
                    >
                        {/* Close button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowOptions(false) }}
                            className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        >
                            <X className="h-4 w-4 text-white" />
                        </button>

                        {/* View Product */}
                        <Link
                            href={`/product/${product.id}`}
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowOptions(false) // Just close options, chat stays open
                            }}
                        >
                            <Button
                                size="sm"
                                variant="secondary"
                                className="flex flex-col h-auto py-3 px-4 gap-1 bg-white/90 hover:bg-white text-gray-900"
                            >
                                <Eye className="h-5 w-5" />
                                <span className="text-xs">View</span>
                            </Button>
                        </Link>

                        {/* Add to Cart */}
                        <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleAddToCart() }}
                            className="flex flex-col h-auto py-3 px-4 gap-1 bg-amber-500 hover:bg-amber-600 text-white"
                        >
                            <ShoppingCart className="h-5 w-5" />
                            <span className="text-xs">Add to Cart</span>
                        </Button>

                        {/* Virtual Try-On */}
                        <Link
                            href={`/try-on/${product.id}`}
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowOptions(false)
                            }}
                        >
                            <Button
                                size="sm"
                                className="flex flex-col h-auto py-3 px-4 gap-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/20"
                            >
                                <Sparkles className="h-5 w-5" />
                                <span className="text-xs">Try On</span>
                            </Button>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
