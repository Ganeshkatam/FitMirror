'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, Plus, ShoppingBag, Eye } from 'lucide-react'
import { useCart } from '@/lib/store/cart'

interface RelatedProduct {
    productId: string
    name: string
    price: number
    imageUrl: string
    category: string
    relationType: string
}

interface CompleteTheLookProps {
    productId: string
    className?: string
}

/**
 * Complete the Look Component
 * 
 * Shows outfit suggestions based on product relations.
 * Uses the get_complete_look RPC function.
 */
export function CompleteTheLook({ productId, className = '' }: CompleteTheLookProps) {
    const [related, setRelated] = useState<RelatedProduct[]>([])
    const [loading, setLoading] = useState(true)
    const { addItem } = useCart()

    useEffect(() => {
        async function loadRelated() {
            try {
                const res = await fetch(`/api/products/${productId}/related`)
                if (res.ok) {
                    const data = await res.json()
                    setRelated(data)
                }
            } catch (error) {
                console.error('Failed to load related products:', error)
            }
            setLoading(false)
        }

        loadRelated()
    }, [productId])

    if (loading) {
        return (
            <div className={`space-y-4 ${className}`}>
                <Skeleton className="h-6 w-48" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    if (related.length === 0) {
        return null // Don't show section if no related products
    }

    const handleAddToCart = async (product: RelatedProduct) => {
        addItem({
            productId: product.productId,
            productName: product.name,
            productImage: product.imageUrl || '',
            price: product.price,
            size: 'M', // Default size
            storeId: '' // Will be fetched on server
        })
    }

    return (
        <section className={`space-y-4 ${className}`}>
            <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-serif font-bold">Complete the Look</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {related.map((product) => (
                    <Card
                        key={product.productId}
                        className="group overflow-hidden hover:shadow-lg transition-all"
                    >
                        <Link href={`/product/${product.productId}`}>
                            <div className="aspect-[3/4] relative bg-gray-100 overflow-hidden">
                                {product.imageUrl ? (
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="object-cover transition-transform group-hover:scale-105"
                                        fill
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        <Eye className="h-8 w-8" />
                                    </div>
                                )}

                                {/* Relation Type Badge */}
                                <Badge
                                    variant="secondary"
                                    className="absolute top-2 left-2 text-[10px] bg-white/90 backdrop-blur-sm"
                                >
                                    {product.relationType === 'matches' ? 'Perfect Match' :
                                        product.relationType === 'complete_the_look' ? 'Completes Look' :
                                            'Similar Style'}
                                </Badge>
                            </div>
                        </Link>

                        <CardContent className="p-3">
                            <h4 className="font-medium text-sm truncate">{product.name}</h4>
                            <div className="flex items-center justify-between mt-1.5">
                                <span className="font-bold text-sm">
                                    ₹{product.price.toLocaleString('en-IN')}
                                </span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleAddToCart(product)
                                    }}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Add All to Cart */}
            {related.length > 1 && (
                <div className="flex justify-center pt-2">
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => related.forEach(handleAddToCart)}
                    >
                        <ShoppingBag className="h-4 w-4" />
                        Add All to Cart
                        <span className="text-muted-foreground">
                            (₹{related.reduce((sum, p) => sum + p.price, 0).toLocaleString('en-IN')})
                        </span>
                    </Button>
                </div>
            )}
        </section>
    )
}
