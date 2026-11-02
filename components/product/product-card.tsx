'use client'
import { ProductImage } from '@/lib/service/media'

import { useQuickView } from '@/lib/store/use-quick-view'
import { Eye, Heart, Star, ShoppingBag, Check, Plus, Sparkles } from 'lucide-react'
import { useCompareStore } from '@/lib/store/compare'
import { useWishlist } from '@/lib/store/use-wishlist'
import { useCart } from '@/lib/store/cart'
import React from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/analytics/tracker'
import { toast } from 'sonner'

export interface Product {
    id: string
    name?: string
    title?: string
    price: number
    original_price?: number | null
    mrp?: number | null
    product_offers?: any[]
    images?: ProductImage[]
    image?: string
    stock?: number
    is_in_stock?: boolean | null
    trending_score?: number | null
    category?: string | null
    brand?: string | null
    avg_rating?: number | null
    review_count?: number | null
}

interface ProductCardProps {
    product: Product
    priority?: boolean
    className?: string
    showQuickAdd?: boolean
}

export function ProductCard({ product, priority = false, className, showQuickAdd = false }: ProductCardProps) {
    const { items, addItem, removeItem, isMobileSelectionMode } = useCompareStore()
    const { open: openQuickView } = useQuickView()
    const { isInWishlist, toggleWishlist } = useWishlist()
    const isSelected = items.some(i => i.id === product.id)
    const isWishlisted = isInWishlist(product.id)

    // Data Normalization
    const title = product.name || product.title || 'Untitled Product'
    const category = product.category || 'Uncategorized'
    const brand = product.brand || ''

    // Images
    const rawImages = (product.images as any[]) || []
    const firstImg = rawImages[0]
    const primaryImage = typeof firstImg === 'string'
        ? firstImg
        : firstImg?.src || product.image || '/placeholder.png'

    const secondImg = rawImages[1]
    const secondaryImage = typeof secondImg === 'string'
        ? secondImg
        : secondImg?.src || null

    // Pricing
    const price = product.price || 0
    const originalPrice = product.original_price || product.mrp || null
    const discount = originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0

    // Stock
    const isOutOfStock = product.is_in_stock === false || (product.stock !== undefined && product.stock <= 0)

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
            productImage: primaryImage,
            price: price,
            size: 'Free Size',
            offerId: 'direct',
            variantId: undefined
        })
        toast.success("Added to bag")
    }

    const handleSelection = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (isSelected) {
            removeItem(product.id)
        } else {
            if (items.length >= 4) {
                toast.error("You can compare up to 4 products")
                return
            }
            addItem({
                id: product.id,
                name: title,
                price: price,
                image: primaryImage,
                category: category,
                brand: brand,
                rating: product.avg_rating || 0
            })
        }
    }

    return (
        <div className={cn("group relative flex flex-col", className)}>
            <Link
                href={`/product/${product.id}`}
                className="flex flex-col flex-1"
                onClick={() => {
                    trackEvent({
                        eventType: 'view_item',
                        productId: product.id,
                        metadata: {
                            item_id: product.id,
                            item_name: title,
                            price: price,
                            item_category: category,
                        }
                    })
                }}
            >
                {/* --- IMAGE CONTAINER --- */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-gray-100">
                    {/* Primary Image */}
                    <Image
                        src={primaryImage}
                        alt={title}
                        fill
                        priority={priority}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className={cn(
                            "object-cover object-top transition-transform duration-500 will-change-transform",
                            secondaryImage
                                ? "group-hover:scale-105 group-hover:opacity-0"
                                : "group-hover:scale-105",
                            isOutOfStock && "opacity-50 grayscale"
                        )}
                    />

                    {/* Secondary Image (Hover Flip) */}
                    {secondaryImage && !isOutOfStock && (
                        <Image
                            src={secondaryImage}
                            alt={`${title} alternate view`}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover object-top transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-105 absolute inset-0"
                        />
                    )}

                    {/* Quick View Button (Desktop Hover) */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="w-full bg-white/90 hover:bg-white text-gray-900 font-medium text-xs h-9 shadow-md backdrop-blur-sm"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                openQuickView(product as any)
                            }}
                        >
                            <Eye className="w-3.5 h-3.5 mr-1.5" /> Quick View
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
                        {/* Discount Badge */}
                        {discount > 0 && !isOutOfStock && (
                            <div className="bg-green-600 text-white px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm">
                                {discount}% OFF
                            </div>
                        )}

                        {/* Trending Badge */}
                        {!isOutOfStock && product.trending_score && product.trending_score > 50 && (
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg flex items-center gap-1">
                                HOT
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
