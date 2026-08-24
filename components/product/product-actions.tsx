'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { WaitlistButton } from '@/components/product/waitlist-button'
import { SizeGuide } from '@/components/size-guide'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/store/cart'
import { useWishlist } from '@/lib/store/use-wishlist'
import { useRouter } from 'next/navigation'
import { Sparkles, ShoppingBag, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface InventoryItem {
    variant_id: string | null
    size: string
    stock: number
}

interface ProductActionsProps {
    productId: string
    productName: string
    productImage: string
    price: number
    sizes: string[]
    category: string
    storeId: string
    initialInventory: InventoryItem[]
}

export function ProductActions({
    productId,
    productName,
    productImage,
    price,
    sizes,
    category,
    storeId,
    initialInventory,
}: ProductActionsProps) {
    const router = useRouter()
    const supabase = createClient()
    const [selectedSize, setSelectedSize] = React.useState<string | null>(null)
    const [inventory, setInventory] = React.useState<InventoryItem[]>(initialInventory)
    const [shake, setShake] = React.useState(false)

    // Wishlist hook
    const { isInWishlist, toggleWishlist, fetchWishlist } = useWishlist()
    const isWishlisted = isInWishlist(productId)

    React.useEffect(() => {
        fetchWishlist()
    }, [fetchWishlist])

    // Initialize inventory state from props
    React.useEffect(() => {
        setInventory(initialInventory)
    }, [initialInventory])

    // Realtime subscription for stock updates
    React.useEffect(() => {
        const channel = supabase
            .channel(`inventory-${productId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'product_inventory',
                    filter: `product_id=eq.${productId}`
                },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        const updated = payload.new as InventoryItem & { product_id: string }
                        setInventory(prev =>
                            prev.map(item =>
                                // Match by variant_id if available, else fallback to size
                                (item.variant_id && item.variant_id === updated.variant_id) || item.size === updated.size
                                    ? { ...item, stock: updated.stock, variant_id: updated.variant_id || item.variant_id }
                                    : item
                            )
                        )
                    }
                }
            )
            .subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [productId, supabase])

    const getInventoryForSize = (size: string) => {
        return inventory.find(i => i.size === size)
    }

    const getStockForSize = (size: string) => {
        return getInventoryForSize(size)?.stock || 0
    }

    const selectedStock = selectedSize ? getStockForSize(selectedSize) : null

    const [isPending, startTransition] = React.useTransition()

    const handleAddToCart = () => {
        if (!selectedSize) {
            toast.error("Please select a size first")
            setShake(true)
            setTimeout(() => setShake(false), 500)
            return
        }

        const itemInventory = getInventoryForSize(selectedSize)

        startTransition(() => {
            useCart.getState().addItem({
                productId,
                productName,
                productImage,
                price,
                size: selectedSize,
                storeId,
                variantId: itemInventory?.variant_id || undefined
            })
            // Simulate network delay for better UX feeling
            setTimeout(() => toast.success("Added to bag"), 500)
        })
    }

    const handleBuyNow = () => {
        if (!selectedSize) {
            toast.error("Please select a size first")
            setShake(true)
            setTimeout(() => setShake(false), 500)
            return
        }

        const itemInventory = getInventoryForSize(selectedSize)

        startTransition(() => {
            useCart.getState().addItem({
                productId,
                productName,
                productImage,
                price,
                size: selectedSize,
                storeId,
                variantId: itemInventory?.variant_id || undefined
            })
            router.push('/checkout')
        })
    }

    return (
        <div className="space-y-6">
            {/* Size Selection - Myntra Style */}
            <div className={cn("space-y-3 transition-transform", shake && "animate-shake")}>
                <div className="flex items-center justify-between">
                    <h3 className={cn("font-semibold text-sm uppercase tracking-wide", shake ? "text-red-500" : "text-gray-600")}>
                        Select Size
                    </h3>
                    <SizeGuide category={category} />
                </div>

                <div className="flex flex-wrap gap-3">
                    {sizes.map((size) => {
                        const stock = getStockForSize(size)
                        const isSelected = selectedSize === size
                        const isOutOfStock = stock === 0
                        const isLowStock = stock > 0 && stock <= 3

                        return (
                            <button
                                key={size}
                                onClick={() => !isOutOfStock && setSelectedSize(size)}
                                disabled={isOutOfStock}
                                className={cn(
                                    "relative min-w-[50px] h-12 px-4 rounded-full border-2 font-semibold text-sm transition-all",
                                    isSelected
                                        ? "border-primary bg-primary text-white shadow-md"
                                        : isOutOfStock
                                            ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                                            : "border-gray-300 bg-white text-gray-700 hover:border-primary hover:text-primary"
                                )}
                            >
                                {size}
                                {isLowStock && !isSelected && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Stock Status */}
                {selectedSize && (
                    <div className="text-sm">
                        {selectedStock === 0 ? (
                            <span className="text-red-600 font-medium">Out of Stock</span>
                        ) : selectedStock && selectedStock <= 3 ? (
                            <span className="text-orange-600 font-medium">
                                Only {selectedStock} left! Hurry up
                            </span>
                        ) : (
                            <span className="text-green-600 font-medium">In Stock</span>
                        )}
                    </div>
                )}
            </div>

            {/* Action Buttons - Myntra Style */}
            <div className="space-y-3">
                {/* Primary Actions Row */}
                <div className="flex gap-3">
                    {/* Add to Bag or Waitlist */}
                    <div className="flex-1">
                        <WaitlistButton
                            productId={productId}
                            size={selectedSize || ''}
                            isOutOfStock={selectedSize ? getStockForSize(selectedSize) === 0 : false}
                        >
                            <Button
                                className="w-full h-14 text-base font-bold rounded-lg gap-2 bg-[#ff3f6c] hover:bg-[#e6355f] text-white"
                                onClick={handleAddToCart}
                                loading={isPending}
                                data-testid="add-to-cart-btn"
                            >
                                <ShoppingBag className="h-5 w-5" />
                                ADD TO BAG
                            </Button>
                        </WaitlistButton>
                    </div>

                    {/* Wishlist Button - Myntra Style */}
                    <Button
                        variant="outline"
                        className={cn(
                            "flex-1 h-14 text-base font-bold rounded-lg gap-2 border-2",
                            isWishlisted
                                ? "border-[#ff3f6c] text-[#ff3f6c]"
                                : "border-gray-300 hover:border-gray-400 text-gray-700"
                        )}
                        onClick={() => toggleWishlist(productId)}
                        disabled={isPending}
                    >
                        <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
                        {isWishlisted ? 'WISHLISTED' : 'WISHLIST'}
                    </Button>
                </div>

                {/* Buy Now */}
                <Button
                    variant="outline"
                    className="w-full h-12 text-base font-semibold rounded-lg border-2 border-primary text-primary hover:bg-primary/5"
                    onClick={handleBuyNow}
                    loading={isPending}
                >
                    BUY NOW
                </Button>

                {/* Virtual Try-On */}
                <Button
                    className="w-full h-12 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2 font-bold shadow-lg shadow-amber-500/20"
                    onClick={() => router.push(`/try-on/${productId}`)}
                >
                    <Sparkles className="h-4 w-4" />
                    TRY VIRTUAL FITTING ROOM
                </Button>
            </div>
        </div>
    )
}
