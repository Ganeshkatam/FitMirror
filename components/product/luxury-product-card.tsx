import { ProductImage } from '@/lib/service/media';
'use client'

import React, { useState } from 'react'
// import { useRouter } from 'next/navigation' // Removed unused
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, ShoppingBag, Check, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/store/cart'
import { useQuickView } from '@/lib/store/use-quick-view'
import { toast } from 'sonner'

interface Product {
    id: string
    name?: string
    title?: string
    price: number
    images?: ProductImage[]
    image?: string
    stock?: number
    is_in_stock?: boolean | null
    store_id?: string | null
    category?: string
    slug?: string
}

interface LuxuryProductCardProps {
    product: Product
    priority?: boolean
    className?: string
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL'] // Fallback if not provided in product

export function LuxuryProductCard({ product, priority = false, className }: LuxuryProductCardProps) {
    // const router = useRouter() // Removed unused router
    const { addItem } = useCart()
    const { open: openQuickView } = useQuickView()
    const [isHovered, setIsHovered] = useState(false)
    const [showSizeSelector, setShowSizeSelector] = useState(false)
    const [adding, setAdding] = useState(false)

    // Data Normalization
    const title = product.name || product.title || 'Untitled Product'
    const price = product.price || 0
    const imageUrl = product.images?.[0]?.src || product.image || '/placeholder.png'
    const hoverImageUrl = product.images?.[1]?.src || null
    const isOutOfStock = (typeof product.stock === 'number' && product.stock <= 0) || (product.is_in_stock === false)

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setShowSizeSelector(true)
    }

    const handleSizeSelect = async (size: string) => {
        setAdding(true)
        try {
            await addItem({
                productId: product.id,
                productName: title,
                productImage: imageUrl,
                price: price,
                size: size,
                storeId: product.store_id || 'platform' // Fallback
            })
            toast.success(`Added ${size} to cart`)
            setShowSizeSelector(false)
        } catch (error) {
            toast.error('Failed to add to cart')
        } finally {
            setAdding(false)
        }
    }

    const handleQuickView = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        openQuickView(product as any)
    }

    return (
        <div
            className={cn("group relative block", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false)
                setShowSizeSelector(false)
            }}
        >
            {/* Image Container */}
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-sm mb-3">
                <Link href={`/product/${product.slug || product.id}`}>
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className={cn(
                            "object-cover transition-transform duration-700 ease-in-out",
                            isHovered && !showSizeSelector ? "scale-105" : "scale-100"
                        )}
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        priority={priority}
                    />
                    {hoverImageUrl && (
                        <Image
                            src={hoverImageUrl}
                            alt={title}
                            fill
                            className={cn(
                                "object-cover transition-opacity duration-500",
                                isHovered && !showSizeSelector ? "opacity-100" : "opacity-0"
                            )}
                            priority={priority}
                        />
                    )}
                </Link>

                {/* Badges */}
                {isOutOfStock && (
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur text-[10px] font-bold uppercase tracking-wider px-2 py-1">
                        Sold Out
                    </div>
                )}

                {/* Quick Actions (Desktop Hover) */}
                <div className={cn(
                    "absolute bottom-0 left-0 right-0 p-4 transition-transform duration-300 transform",
                    isHovered ? "translate-y-0" : "translate-y-full"
                )}>
                    {!showSizeSelector ? (
                        <div className="flex gap-2">
                            <Button
                                onClick={handleQuickAdd}
                                className="flex-1 bg-white/90 text-black hover:bg-white backdrop-blur shadow-sm font-sans uppercase text-xs tracking-wider h-10 border border-transparent hover:border-black/10"
                                disabled={isOutOfStock}
                            >
                                {isOutOfStock ? 'Sold Out' : (
                                    <>
                                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Quick Add
                                    </>
                                )}
                            </Button>
                            <Button
                                size="icon"
                                onClick={handleQuickView}
                                className="h-10 w-10 bg-white/90 text-black hover:bg-white backdrop-blur shadow-sm border border-transparent hover:border-black/10"
                            >
                                <Eye className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        // Size Selector Overlay
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/95 backdrop-blur-md p-3 rounded-md shadow-lg"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase text-gray-500">Select Size</span>
                                <button onClick={(e) => { e.stopPropagation(); setShowSizeSelector(false) }}>
                                    <X className="w-3 h-3 text-gray-400 hover:text-black" />
                                </button>
                            </div>
                            <div className="grid grid-cols-5 gap-1">
                                {SIZES.map(size => (
                                    <button
                                        key={size}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handleSizeSelect(size)
                                        }}
                                        disabled={adding}
                                        className="h-8 w-full flex items-center justify-center text-xs font-medium border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-colors"
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Product Info */}
            <div className="space-y-1">
                <Link href={`/product/${product.slug || product.id}`} className="block">
                    <h3 className="font-serif text-base leading-tight text-gray-900 group-hover:underline decoration-1 underline-offset-4">
                        {title}
                    </h3>
                </Link>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600">
                        ₹{price.toLocaleString('en-IN')}
                    </p>
                    {/* Placeholder for Color Swatches if needed */}
                </div>
            </div>
        </div>
    )
}
