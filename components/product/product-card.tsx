import { ProductImage } from '@/lib/service/media';
'use client'

import { useQuickView } from '@/lib/store/use-quick-view'
import { Eye, Heart, Star, ShoppingBag } from 'lucide-react'
import { useCompareStore } from '@/lib/store/compare'
import { useWishlist } from '@/lib/store/use-wishlist'
import { useCart } from '@/lib/store/cart'
import React from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Check, Plus, Sparkles } from 'lucide-react'
import { trackEvent } from '@/lib/analytics/tracker'
import { toast } from 'sonner'

export interface Product {
    id: string
    name?: string
    title?: string
    price: number
    original_price?: number | null
    mrp?: number | null
    images?: ProductImage[]
    image?: string
    stock?: number
    is_in_stock?: boolean | null
    trending_score?: number | null
    store_id?: string | null
    category?: string | null
    brand?: string | null
    avg_rating?: number | null
    review_count?: number | null
    ai_match_score?: number | null
}

interface ProductCardProps {
    product: Product
    priority?: boolean
    className?: string
    showTryOn?: boolean
    showQuickAdd?: boolean
}

export function ProductCard({ product, priority = false, className, showTryOn = false, showQuickAdd = false }: ProductCardProps) {
    const { items, addItem, removeItem, isMobileSelectionMode } = useCompareStore()
    const { open: openQuickView } = useQuickView()
    const { isInWishlist, toggleWishlist } = useWishlist()
    const isSelected = items.some(i => i.id === product.id)
    const isWishlisted = isInWishlist(product.id)

    // Data Normalization
    const title = product.name || product.title || 'Untitled Product'
    const price = product.price || 0
    const category = product.category || 'Uncategorized'
    const brand = product.brand || null

    // Pricing
    const originalPrice = product.original_price || product.mrp || null
    const discount = originalPrice && originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0

    // Image Logic
    let imageUrl = '/placeholder.png'
    let hoverImageUrl = null

    if (product.images && product.images.length > 0) {
        imageUrl = product.images?.[0]?.src
        if (product.images.length > 1) hoverImageUrl = product.images?.[1]?.src
    } else if (product.image) {
        imageUrl = product.image
    }

    const isOutOfStock = (typeof product.stock === 'number' && product.stock <= 0) || (product.is_in_stock === false)

    const handleSelection = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (isSelected) {
            removeItem(product.id)
        } else {
            addItem({ id: product.id, name: title, image: imageUrl, price, category })
        }
    }

    const handleClick = (e: React.MouseEvent) => {
        if (isMobileSelectionMode) {
            e.preventDefault()
            handleSelection(e)
        }
    }

    const handleQuickView = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        openQuickView(product as any)
        trackEvent({
            eventType: 'quick_view',
            storeId: product.store_id || 'platform',
            productId: product.id
        })
    }

    const handleWishlist = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        toggleWishlist(product.id)
    }

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        useCart.getState().addItem({
            productId: product.id,
            productName: title,
            productImage: imageUrl,
            price,
            size: 'M', // Default — user can change in cart
            storeId: product.store_id || '',
        })
        toast.success('Added to bag!')
        trackEvent({
            eventType: 'add_to_cart',
            storeId: product.store_id || 'platform',
            productId: product.id,
            metadata: { source: 'quick_add' }
        })
    }

    return (
        <div
            data-testid="product-card"
            className={cn("group block relative select-none", className)}
        >
            <Link
                href={`/product/${product.id}`}
                onClick={handleClick}
                className={cn("block", isMobileSelectionMode && "pointer-events-none")}
            >
                <div className={cn(
                    "relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100 transition-all",
                    isSelected && "ring-2 ring-black ring-offset-2"
                )}>
                    {/* Primary Image */}
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className={cn(
                            "object-cover transition-all duration-700 ease-in-out",
                            hoverImageUrl ? "group-hover:opacity-0" : "group-hover:scale-105",
                            isOutOfStock && "opacity-60 grayscale-[0.5]"
                        )}
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        priority={priority}
                    />

                    {/* Secondary Image (Hover) */}
                    {hoverImageUrl && (
                        <Image
                            src={hoverImageUrl}
                            alt={title}
                            fill
                            className={cn(
                                "object-cover absolute inset-0 transition-all duration-700 ease-in-out opacity-0 scale-105 group-hover:opacity-100 group-hover:scale-100",
                                isOutOfStock && "grayscale-[0.5]"
                            )}
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                    )}

                    {/* Quick View Overlay (Desktop) */}
                    <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block z-10">
                        <Button
                            variant="secondary"
                            className="w-full h-10 bg-white/90 backdrop-blur-sm shadow-sm hover:bg-black hover:text-white transition-all gap-2 font-bold uppercase text-xs tracking-wider"
                            onClick={handleQuickView}
                        >
                            <Eye className="h-3.5 w-3.5" /> Quick View
                        </Button>
                    </div>

                    {/* Out of Stock Overlay */}
                    {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
                            <div className="bg-black/70 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-sm">
                                Out of Stock
                            </div>
                        </div>
                    )}

                    {/* --- TOP LEFT BADGES --- */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
                        {/* Try-On Badge */}
                        {showTryOn && !isOutOfStock && (
                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-lg">
                                <Sparkles className="h-3 w-3" />
                                Try-On
                            </div>
                        )}

                        {/* Discount Badge */}
                        {discount > 0 && !isOutOfStock && (
                            <div className="bg-green-600 text-white px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm">
                                {discount}% OFF
                            </div>
                        )}

                        {/* Trending Badge */}
                        {!isOutOfStock && product.trending_score && product.trending_score > 50 && (
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg flex items-center gap-1">
                                🔥 Hot
                            </div>
                        )}
                    </div>

                    {/* --- TOP RIGHT: Wishlist Heart --- */}
                    <button
                        onClick={handleWishlist}
                        className={cn(
                            "absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center transition-all z-20 shadow-sm",
                            isWishlisted
                                ? "bg-white text-[#ff3f6c]"
                                : "bg-white/80 text-gray-400 md:opacity-0 md:group-hover:opacity-100"
                        )}
                    >
                        <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
                    </button>

                    {/* --- BOTTOM LEFT: Rating Badge --- */}
                    {product.avg_rating && product.avg_rating > 0 && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs font-bold shadow-sm z-10">
                            <span className="text-gray-900">{product.avg_rating.toFixed(1)}</span>
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            {product.review_count && (
                                <span className="text-gray-400 font-normal text-[10px]">| {product.review_count > 999 ? `${(product.review_count / 1000).toFixed(1)}k` : product.review_count}</span>
                            )}
                        </div>
                    )}

                    {/* --- BOTTOM RIGHT: AI Match Score (FitMirror exclusive) --- */}
                    {product.ai_match_score && product.ai_match_score > 0 && !isOutOfStock && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg z-10">
                            <Sparkles className="h-3 w-3" />
                            {product.ai_match_score}% Match
                        </div>
                    )}

                    {/* Ghost Try-On Overlay (Desktop Hover) */}
                    {!isOutOfStock && showTryOn && (
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-4 pointer-events-none hidden md:flex">
                            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-[10px] font-bold uppercase tracking-widest shadow-xl">
                                    <Sparkles className="w-3 h-3 text-indigo-300" />
                                    <span>Tap to Visualize</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- PRODUCT INFO --- */}
                <div className="mt-2 space-y-0.5 md:mt-3 md:space-y-1">
                    {/* Brand */}
                    {brand && (
                        <p className="text-[11px] md:text-xs font-bold uppercase tracking-wide text-gray-500 truncate">
                            {brand}
                        </p>
                    )}
                    {/* Title */}
                    <h3 className="font-medium text-gray-900 leading-tight group-hover:text-black/70 transition-colors line-clamp-1 text-sm md:text-base">
                        {title}
                    </h3>
                    {/* Price Row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm md:text-base">
                            ₹{price.toLocaleString('en-IN')}
                        </span>
                        {originalPrice && originalPrice > price && (
                            <span className="text-xs text-gray-400 line-through">
                                ₹{originalPrice.toLocaleString('en-IN')}
                            </span>
                        )}
                        {discount > 0 && (
                            <span className="text-xs font-semibold text-green-600">
                                ({discount}% off)
                            </span>
                        )}
                    </div>
                </div>
            </Link>

            {/* Quick Add to Bag Button (Mobile) */}
            {showQuickAdd && !isOutOfStock && (
                <button
                    onClick={handleQuickAdd}
                    className="mt-1.5 w-full flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:border-black hover:text-black transition-colors md:hidden"
                >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Add to Bag
                </button>
            )}

            {/* Selection Checkbox (Compare Mode — Floating Top Left) */}
            {isMobileSelectionMode && (
                <button
                    onClick={handleSelection}
                    className={cn(
                        "absolute top-2 left-2 h-7 w-7 rounded-full shadow-md flex items-center justify-center transition-all z-30",
                        isSelected
                            ? "bg-black text-white scale-100"
                            : "bg-white text-gray-400 border border-gray-200"
                    )}
                    title="Compare"
                >
                    {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </button>
            )}
        </div>
    )
}
