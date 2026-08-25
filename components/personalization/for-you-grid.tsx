import { ProductImage } from '@/lib/service/media';
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Heart, RefreshCw, ChevronRight } from 'lucide-react'
import { useWishlist } from '@/lib/store/use-wishlist'

interface Product {
    id: string
    name: string
    price: number
    images?: ProductImage[]
    category: string
    color?: string
    brand?: string
    score?: number
}

interface ForYouGridProps {
    title?: string
    limit?: number
    category?: string
    excludeProductIds?: string[]
    showRefresh?: boolean
    className?: string
}

/**
 * For You Grid Component
 * 
 * Displays personalized product recommendations based on user style profile.
 * Falls back to trending products for anonymous users.
 */
export function ForYouGrid({
    title = 'Picked For You',
    limit = 8,
    category,
    excludeProductIds = [],
    showRefresh = true,
    className = ''
}: ForYouGridProps) {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [isPersonalized, setIsPersonalized] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const { isInWishlist, toggleWishlist } = useWishlist()

    useEffect(() => {
        async function loadRecommendations() {
            setLoading(true)
            try {
                const params = new URLSearchParams({
                    limit: limit.toString(),
                    ...(category && { category }),
                    ...(excludeProductIds.length > 0 && { exclude: excludeProductIds.join(',') })
                })

                const res = await fetch(`/api/personalization/recommendations?${params}`)
                if (res.ok) {
                    const data = await res.json()
                    setProducts(data.products || [])
                    setIsPersonalized(data.personalized || false)
                    // If not personalized (guest), change title to be accurate
                    if (!data.personalized && title === 'Picked For You') {
                        // We don't change the prop, but we can render differently
                    }
                }
            } catch (error) {
                console.error('Failed to load recommendations:', error)
            }
            setLoading(false)
        }

        loadRecommendations()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit, category, excludeProductIds.join(','), refreshKey])

    const handleRefresh = () => setRefreshKey(k => k + 1)

    if (loading) {
        return (
            <section className={`space-y-6 ${className}`}>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-40" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(limit)].map((_, i) => (
                        <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                    ))}
                </div>
            </section>
        )
    }

    if (products.length === 0) {
        return null
    }

    return (
        <section className={`space-y-6 ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isPersonalized && (
                        <Sparkles className="h-5 w-5 text-amber-500" />
                    )}
                    <h2 className="text-2xl md:text-3xl font-serif">
                        {isPersonalized ? title : (title === 'Picked For You' ? 'Trending Now' : title)}
                    </h2>
                    {isPersonalized && (
                        <Badge variant="secondary" className="text-xs ml-2">
                            Personalized
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {showRefresh && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRefresh}
                            className="text-muted-foreground"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    )}
                    <Link
                        href={category ? `/shop?category=${category}` : '/shop'}
                        className="text-sm font-medium text-primary hover:underline flex items-center"
                    >
                        View All <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        isWishlisted={isInWishlist(product.id)}
                        onToggleWishlist={() => toggleWishlist(product.id)}
                    />
                ))}
            </div>
        </section>
    )
}

function ProductCard({
    product,
    isWishlisted,
    onToggleWishlist
}: {
    product: Product
    isWishlisted: boolean
    onToggleWishlist: () => void
}) {
    const image = product.images?.[0]?.src || '/placeholder.jpg'

    return (
        <Card className="group overflow-hidden hover:shadow-lg transition-all">
            <Link href={`/product/${product.id}`}>
                <div className="aspect-[3/4] relative bg-gray-100 overflow-hidden">
                    <Image
                        src={image}
                        alt={product.name}
                        className="object-cover transition-transform group-hover:scale-105"
                        fill
                    />

                    {/* Wishlist button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            onToggleWishlist()
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                    >
                        <Heart
                            className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                        />
                    </button>

                    {/* Category badge */}
                    {product.category && (
                        <Badge
                            variant="secondary"
                            className="absolute bottom-2 left-2 text-[10px] bg-white/90 backdrop-blur-sm capitalize"
                        >
                            {product.category}
                        </Badge>
                    )}
                </div>
            </Link>

            <CardContent className="p-3">
                {product.brand && (
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                        {product.brand}
                    </p>
                )}
                <h4 className="font-medium text-sm truncate">{product.name}</h4>
                <p className="font-bold text-sm mt-1">
                    ₹{product.price.toLocaleString('en-IN')}
                </p>
            </CardContent>
        </Card>
    )
}

/**
 * "Because You Viewed" Component
 */
export function BecauseYouViewed({
    productId,
    className = ''
}: {
    productId: string
    className?: string
}) {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/personalization/because-you-viewed?productId=${productId}`)
                if (res.ok) {
                    const data = await res.json()
                    setProducts(data.products || [])
                }
            } catch (error) {
                console.error('Failed to load:', error)
            }
            setLoading(false)
        }
        load()
    }, [productId])

    if (loading || products.length === 0) {
        return null
    }

    return (
        <ForYouGrid
            title="Because You Viewed"
            className={className}
            showRefresh={false}
        />
    )
}
