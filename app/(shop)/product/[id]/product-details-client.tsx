'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/lib/store/cart'
import { useWishlist } from '@/lib/store/use-wishlist'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { SizeGuideModal } from '@/components/product/size-guide-modal'
import { UrgencyBanner } from '@/components/product/urgency-banner'
import { WaitlistButton } from '@/components/product/waitlist-button'
import { LocationManager } from '@/components/product/location-manager'
import { ProductOffers, Coupon } from '@/components/product/product-offers'
import { StickySmartBar } from '@/components/product/sticky-smart-bar'
import { SocialProof } from '@/components/product/social-proof'
import { MobileBuyBar } from '@/components/product/mobile-buy-bar'
import { trackEvent } from '@/lib/analytics/tracker'
import {
    Sparkles,
    ShoppingBag,
    Truck,
    RotateCcw,
    Shield,
    Star,
    Copy,
    Check,
    Facebook,
    Twitter,
    Heart,
    MessageCircle,
} from 'lucide-react'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

import { COLOR_MAP } from '@/lib/constants/colors'

interface InventoryItem {
    variant_id?: string | null
    size: string
    color: string
    stock: number
}

interface ProductDetailsClientProps {
    product: any
    colors: string[]
    variantMap?: Record<string, string>
    avgRating: number
    reviewCount: number
    coupons?: Coupon[]
}

export function ProductDetailsClient({
    product,
    colors,
    variantMap = {},
    avgRating,
    reviewCount,
    coupons = []
}: ProductDetailsClientProps) {
    const router = useRouter()
    const supabase = createClient()

    // State
    const [selectedSize, setSelectedSize] = React.useState<string | null>(null)
    const [selectedColor, setSelectedColor] = React.useState<string | null>(colors[0] || null)
    const [inventory, setInventory] = React.useState<InventoryItem[]>(product.product_inventory || [])
    const [shake, setShake] = React.useState(false)
    const [copied, setCopied] = React.useState(false)
    const [showMobileBuyBar, setShowMobileBuyBar] = React.useState(false)
    const ctaRef = React.useRef<HTMLDivElement>(null)

    // Wishlist hook
    const { isInWishlist, toggleWishlist, fetchWishlist } = useWishlist()
    const isWishlisted = isInWishlist(product.id)

    React.useEffect(() => {
        fetchWishlist()
    }, [fetchWishlist])

    // Track Product View
    React.useEffect(() => {
        trackEvent({
            eventType: 'view_item',
            storeId: product.store?.id || product.store_id || 'fitmirror-main',
            productId: product.id,
            metadata: {
                category: product.category,
                price: product.price,
                color: selectedColor,
                brand: product.brand,
                name: product.name
            }
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product.id])

    // Intersection observer for mobile sticky buy bar
    React.useEffect(() => {
        if (!ctaRef.current) return
        const observer = new IntersectionObserver(
            ([entry]) => setShowMobileBuyBar(!entry.isIntersecting),
            { threshold: 0.1 }
        )
        observer.observe(ctaRef.current)
        return () => observer.disconnect()
    }, [])

    // Realtime inventory subscription
    React.useEffect(() => {
        const channel = supabase
            .channel(`inventory-${product.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'product_inventory',
                    filter: `product_id=eq.${product.id}`
                },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        const updated = payload.new as InventoryItem & { product_id: string }
                        setInventory(prev =>
                            prev.map(item =>
                                item.size === updated.size && item.color === updated.color
                                    ? { ...item, stock: updated.stock }
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
    }, [product.id, supabase])



    // Get stock for size/color combination
    const getStock = (size: string, color?: string) => {
        const item = inventory.find(i =>
            i.size === size &&
            (
                !i.color || // Matches if inventory has no color
                !color ||   // Matches if no color requested
                i.color?.toLowerCase() === color.toLowerCase()
            )
        )
        return item?.stock || 0
    }

    const selectedStock = selectedSize ? getStock(selectedSize, selectedColor || undefined) : null

    // Unique sizes from product
    const allSizes = product.sizes || [...new Set(inventory.map((i: InventoryItem) => i.size))].filter(Boolean)

    // Pricing
    const originalPrice = product.original_price || product.mrp || null
    const currentPrice = product.price
    const discount = originalPrice ? Math.round((1 - currentPrice / originalPrice) * 100) : 0

    // Handle Add to Cart
    const handleAddToCart = async () => {
        // STRICT AUTH CHECK
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast.error("Please login to shop", {
                action: {
                    label: "Login",
                    onClick: () => router.push('/login?next=' + encodeURIComponent(window.location.pathname))
                }
            })
            // Redirect after short delay or let user click toast
            setTimeout(() => router.push('/login?next=' + encodeURIComponent(window.location.pathname)), 1500)
            return
        }

        if (!selectedSize) {
            toast.error("Please select a size first")
            setShake(true)
            setTimeout(() => setShake(false), 500)
            return
        }

        const itemInventory = inventory.find(i =>
            i.size === selectedSize &&
            (
                !i.color ||
                !selectedColor ||
                i.color.toLowerCase() === selectedColor.toLowerCase()
            )
        )

        useCart.getState().addItem({
            productId: product.id,
            productName: product.name,
            productImage: (typeof product.images?.[0] === 'string' ? (typeof product.images?.[0] === 'string' ? product.images[0] : (product.images?.[0] as any)?.src) : (product.images?.[0] as any)?.src) || product.image,
            price: currentPrice,
            size: selectedSize,
            storeId: product.store?.id || product.store_id || '',
            variantId: itemInventory?.variant_id || undefined,
            color: selectedColor || undefined
        })
        toast.success("Added to bag!")
    }

    // Handle Buy Now
    const handleBuyNow = async () => {
        // STRICT AUTH CHECK
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast.error("Please login to shop", {
                action: {
                    label: "Login",
                    onClick: () => router.push('/login?next=' + encodeURIComponent(window.location.pathname))
                }
            })
            setTimeout(() => router.push('/login?next=' + encodeURIComponent(window.location.pathname)), 1500)
            return
        }

        if (!selectedSize) {
            toast.error("Please select a size first")
            setShake(true)
            setTimeout(() => setShake(false), 500)
            return
        }

        const itemInventory = inventory.find(i =>
            i.size === selectedSize &&
            (
                !i.color ||
                !selectedColor ||
                i.color.toLowerCase() === selectedColor.toLowerCase()
            )
        )

        useCart.getState().addItem({
            productId: product.id,
            productName: product.name,
            productImage: (typeof product.images?.[0] === 'string' ? (typeof product.images?.[0] === 'string' ? product.images[0] : (product.images?.[0] as any)?.src) : (product.images?.[0] as any)?.src) || product.image,
            price: currentPrice,
            size: selectedSize,
            storeId: product.store?.id || product.store_id || '',
            variantId: itemInventory?.variant_id || undefined,
            color: selectedColor || undefined
        })
        router.push('/checkout')
    }

    // Handle Share
    const handleShare = async (platform?: string) => {
        const url = typeof window !== 'undefined' ? window.location.href : ''
        const text = `Check out ${product.name} on FitMirror!`

        if (platform === 'copy') {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            toast.success("Link copied!")
            setTimeout(() => setCopied(false), 2000)
        } else if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
        } else if (platform === 'facebook') {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        } else if (platform === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
        } else if (navigator.share) {
            await navigator.share({ title: product.name, text, url })
        }
    }



    return (
        <div className="flex flex-col space-y-6 lg:sticky lg:top-24 lg:h-fit">
            {/* Store & Badges */}
            <div className="flex items-center justify-between">
                <a href={`/store/${product.store?.id}`} className="text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors">
                    {product.store?.name || 'FitMirror Official'}
                </a>
                <div className="flex items-center gap-2">
                    {product.is_new && (
                        <Badge className="bg-black text-white text-[10px] uppercase font-bold px-2 py-0.5">New</Badge>
                    )}
                    {discount > 0 && (
                        <Badge className="bg-green-600 text-white text-[10px] uppercase font-bold px-2 py-0.5">{discount}% OFF</Badge>
                    )}
                </div>
            </div>

            {/* Product Title Section */}
            <div>
                {product.brand && (
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">
                        {product.brand}
                    </h2>
                )}
                <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                    {product.gender} {product.category && `• ${product.category}`}
                </div>
                <h1 className="text-2xl md:text-4xl font-serif font-medium text-gray-900 leading-tight">
                    {product.name}
                </h1>
            </div>

            {/* Rating */}
            {reviewCount > 0 && (
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-sm font-bold">
                        <span>{avgRating.toFixed(1)}</span>
                        <Star className="h-3.5 w-3.5 fill-current" />
                    </div>
                    <span className="text-sm text-gray-500">
                        {reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'}
                    </span>
                </div>
            )}

            {/* Price */}
            <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-3">
                    <span className="text-3xl md:text-4xl font-bold text-gray-900">
                        ₹{currentPrice.toLocaleString('en-IN')}
                    </span>
                    {originalPrice && originalPrice > currentPrice && (
                        <>
                            <span className="text-xl text-gray-400 line-through">
                                ₹{originalPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-green-600 font-semibold">
                                ({discount}% OFF)
                            </span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">inclusive of all taxes</span>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                        <Sparkles className="h-3 w-3" />
                        Earn {Math.floor(currentPrice / 100)} Points
                    </Badge>
                </div>
            </div>

            {/* Social Proof */}
            <SocialProof />

            {/* Offers */}
            <ProductOffers coupons={coupons} />

            <Separator />

            {/* Color Selection */}
            {colors.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-600">
                            Color: <span className="capitalize text-black">{selectedColor}</span>
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {colors.filter(color => {
                            // Check if this color exists in inventory (and has stock?)
                            // User said "if a product does not exist for a colour", implying variant existence.
                            // We should check if ANY item in inventory matches this color.
                            return inventory.some(i => i.color?.toLowerCase() === color.toLowerCase())
                        }).map((color) => {
                            const hex = COLOR_MAP[color.toLowerCase()] || '#9CA3AF'
                            return (
                                <button
                                    key={color}
                                    onClick={() => {
                                        const targetId = variantMap[color.toLowerCase()]
                                        if (targetId && targetId !== product.id) {
                                            // Navigate to sibling product
                                            router.push(`/product/${targetId}`)
                                        } else {
                                            // Local variant
                                            setSelectedColor(color)
                                            setSelectedSize(null) // Reset size when color changes
                                        }
                                    }}
                                    className={cn(
                                        "w-10 h-10 rounded-full border-2 transition-all relative group",
                                        selectedColor === color
                                            ? "ring-2 ring-black ring-offset-2"
                                            : "hover:scale-110"
                                    )}
                                    style={{ backgroundColor: hex }}
                                    title={color}
                                >
                                    {color.toLowerCase() === 'white' && (
                                        <span className="absolute inset-0.5 border border-gray-200 rounded-full" />
                                    )}
                                    <span className="sr-only">{color}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Size Selection */}
            <div className={cn("space-y-3 transition-transform", shake && "animate-shake")}>
                <div className="flex items-center justify-between">
                    <h3 className={cn(
                        "font-semibold text-sm uppercase tracking-wide",
                        shake ? "text-red-500" : "text-gray-600"
                    )}>
                        Select Size
                    </h3>
                    <SizeGuideModal category={product.category} gender={product.gender} />
                </div>

                <div className="flex flex-wrap gap-3">
                    {allSizes.map((size: string) => {
                        const stock = getStock(size, selectedColor || undefined)
                        const isSelected = selectedSize === size
                        const isOutOfStock = stock === 0
                        const isLowStock = stock > 0 && stock <= 50

                        return (
                            <button
                                key={size}
                                onClick={() => !isOutOfStock && setSelectedSize(size)}
                                disabled={isOutOfStock}
                                className={cn(
                                    "relative min-w-[50px] h-12 px-5 rounded-full border font-medium text-sm transition-all hover:scale-105 active:scale-95",
                                    isSelected
                                        ? "border-black bg-black text-white shadow-xl shadow-black/10"
                                        : isOutOfStock
                                            ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed decoration-slice"
                                            : "border-gray-200 bg-white text-gray-700 hover:border-black hover:text-black hover:shadow-md"
                                )}
                            >
                                {size}
                                {isLowStock && !isSelected && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Stock Status & Urgency Banner */}
                {selectedSize && (
                    <>
                        <div className="text-sm flex items-center gap-2">
                            {selectedStock === 0 ? (
                                <span className="text-red-600 font-medium">Out of Stock</span>
                            ) : selectedStock && selectedStock <= 50 ? (
                                <span className="text-orange-600 font-medium">🔥 Low Stock: Only {selectedStock} left!</span>
                            ) : (
                                <span className="text-green-600 font-medium">✓ In Stock</span>
                            )}
                        </div>
                        <UrgencyBanner
                            productId={product.id}
                            size={selectedSize}
                            variantId={null} // Can extend to pass variantId if available
                        />
                        {(product as any).velocity > 5 && (
                            <div className="text-xs text-rose-600 font-medium animate-pulse flex items-center gap-1 mt-1">
                                <Sparkles className="h-3 w-3" />
                                Selling fast! {(product as any).velocity} sold in last 24h
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2" ref={ctaRef}>
                {/* Primary Row */}
                <div className="flex gap-3">
                    <WaitlistButton
                        productId={product.id}
                        size={selectedSize || ''}
                        isOutOfStock={selectedSize ? getStock(selectedSize, selectedColor || undefined) === 0 : false}
                    >
                        <Button
                            size="lg"
                            className="w-full bg-black hover:bg-gray-800 text-white font-bold tracking-wide h-14 md:h-16 text-sm md:text-base rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                            onClick={handleAddToCart}
                            disabled={!selectedSize || !getStock(selectedSize, selectedColor || undefined)}
                        >
                            <ShoppingBag className="mr-3 h-5 w-5" />
                            {(!selectedSize)
                                ? 'SELECT A SIZE'
                                : (getStock(selectedSize, selectedColor || undefined) === 0 ? 'OUT OF STOCK' : 'ADD TO BAG')}
                        </Button>
                    </WaitlistButton>

                    <Button
                        variant="outline"
                        className={cn(
                            "h-14 px-6 text-base font-bold rounded-xl gap-2 border-2",
                            isWishlisted
                                ? "border-[#ff3f6c] text-[#ff3f6c] bg-pink-50"
                                : "border-gray-300 hover:border-gray-400 text-gray-700"
                        )}
                        onClick={() => toggleWishlist(product.id)}
                    >
                        <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
                    </Button>
                </div>

                {/* Buy Now */}
                <Button
                    variant="outline"
                    className="w-full h-12 text-base font-semibold rounded-xl border-2 border-black text-black hover:bg-black hover:text-white transition-all"
                    onClick={handleBuyNow}
                >
                    BUY NOW
                </Button>

                {/* Virtual Try-On */}
                {product.tryon_asset_ref ? (
                    <Button
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2 font-bold shadow-lg shadow-amber-500/20"
                        onClick={async () => {
                            const { data: { user } } = await supabase.auth.getUser()
                            if (!user) {
                                toast.error("Please login to use Virtual Try-On", {
                                    action: {
                                        label: "Login",
                                        onClick: () => router.push('/login?next=' + encodeURIComponent(window.location.pathname))
                                    }
                                })
                                setTimeout(() => router.push('/login?next=' + encodeURIComponent(window.location.pathname)), 1500)
                                return
                            }
                            router.push(`/try-on/${product.id}`)
                        }}
                    >
                        <Sparkles className="h-4 w-4" />
                        TRY VIRTUAL FITTING ROOM
                    </Button>
                ) : (
                    <Button
                        variant="secondary"
                        className="w-full h-12 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400 gap-2 font-bold"
                        onClick={() => toast.success("Request sent! We'll notify you when Virtual Try-On is ready.")}
                    >
                        <Sparkles className="h-4 w-4" />
                        REQUEST VIRTUAL TRY-ON
                    </Button>
                )}
            </div>

            {/* Mobile Sticky Buy Bar */}
            <MobileBuyBar
                price={currentPrice}
                originalPrice={originalPrice}
                discount={discount}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                isOutOfStock={selectedSize ? getStock(selectedSize, selectedColor || undefined) === 0 : false}
                hasTryOn={!!product.tryon_asset_ref}
                visible={showMobileBuyBar}
            />

            {/* Delivery Check */}
            <LocationManager
                onLocationChange={() => {
                    // Logic is handled inside component for now
                }}
            />

            {/* Share */}
            <div className="flex items-center gap-4 pt-2">
                <span className="text-sm text-gray-500">Share:</span>
                <div className="flex gap-2">
                    <button onClick={() => handleShare('copy')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button onClick={() => handleShare('whatsapp')} className="p-2 rounded-full hover:bg-green-100 transition-colors">
                        <MessageCircle className="h-4 w-4 text-green-600" />
                    </button>
                    <button onClick={() => handleShare('facebook')} className="p-2 rounded-full hover:bg-blue-100 transition-colors">
                        <Facebook className="h-4 w-4 text-blue-600" />
                    </button>
                    <button onClick={() => handleShare('twitter')} className="p-2 rounded-full hover:bg-sky-100 transition-colors">
                        <Twitter className="h-4 w-4 text-sky-500" />
                    </button>
                </div>
            </div>

            {/* Seller Info */}
            {product.store && (
                <div className="pt-6 border-t">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Sold By</h3>
                    <div className="group relative flex items-start justify-between bg-white p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all shadow-sm hover:shadow-md">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-900 text-base">
                                    {product.store?.name || "FitMirror Official"}
                                </span>
                                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                                    <Check className="h-3 w-3" />
                                    <span className="text-[10px] font-bold tracking-wide">VERIFIED</span>
                                </div>
                            </div>

                            <div className="text-sm text-gray-500 space-y-1 mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-green-50 px-1.5 py-0.5 rounded text-green-700 gap-1">
                                        <span className="font-bold text-xs">4.8</span>
                                        <Star className="h-3 w-3 fill-current" />
                                    </div>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-xs font-medium text-gray-600">50K+ Happy Customers</span>
                                </div>
                            </div>
                        </div>
                        {product.store?.logo_url ? (
                            <img
                                src={product.store.logo_url}
                                alt={product.store.name}
                                className="w-12 h-12 rounded-full border bg-gray-50 object-contain p-1"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full border bg-gray-50 flex items-center justify-center text-gray-300">
                                <ShoppingBag className="h-6 w-6" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <div className="p-1.5 bg-white rounded-full shadow-sm text-green-600">
                                <Shield className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-medium text-gray-700">100% Original</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <div className="p-1.5 bg-white rounded-full shadow-sm text-blue-600">
                                <RotateCcw className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-medium text-gray-700">14-Day Returns</span>
                        </div>
                    </div>
                </div>
            )}

            <Separator />

            {/* Trust Badges — Horizontal scroll on mobile, grid on desktop */}
            <div className="py-6 border-t mt-4">
                <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 md:pb-0">
                    <div className="flex flex-col items-center gap-2 min-w-[100px] snap-center">
                        <Truck className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
                        <span className="text-[10px] md:text-xs font-bold text-gray-900 whitespace-nowrap">Free Shipping</span>
                        <span className="text-[9px] md:text-[10px] text-gray-500 whitespace-nowrap">On orders ₹1000+</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 min-w-[100px] snap-center">
                        <RotateCcw className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
                        <span className="text-[10px] md:text-xs font-bold text-gray-900 whitespace-nowrap">Easy Returns</span>
                        <span className="text-[9px] md:text-[10px] text-gray-500 whitespace-nowrap">14 day policy</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 min-w-[100px] snap-center">
                        <Shield className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
                        <span className="text-[10px] md:text-xs font-bold text-gray-900 whitespace-nowrap">Secure Pay</span>
                        <span className="text-[9px] md:text-[10px] text-gray-500 whitespace-nowrap">100% protected</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 min-w-[100px] snap-center">
                        <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
                        <span className="text-[10px] md:text-xs font-bold text-gray-900 whitespace-nowrap">Try Before Buy</span>
                        <span className="text-[9px] md:text-[10px] text-gray-500 whitespace-nowrap">Virtual fitting</span>
                    </div>
                </div>
            </div>
            {/* AI Smart Bar */}
            <StickySmartBar
                product={product}
                selectedSize={selectedSize}
                isOutOfStock={selectedSize ? getStock(selectedSize, selectedColor || undefined) === 0 : false}
                onAddToCart={handleAddToCart}
            />
        </div >
    )
}
