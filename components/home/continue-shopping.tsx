import { ProductImage } from '@/lib/service/media';
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { title } from 'framer-motion/client'

interface Product {
    id: string
    name: string
    price: number
    images?: ProductImage[]
    brand?: string
    category?: string
}

interface ContinueShoppingProps {
    items: Product[]
}

export function ContinueShopping({ items }: ContinueShoppingProps) {
    if (!items || items.length === 0) return null

    return (
        <section className="w-full py-12 bg-zinc-50 dark:bg-zinc-900/50 border-y border-zinc-200 dark:border-zinc-800">
            <div className="w-full max-w-[1800px] mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
                            <ShoppingBag className="h-6 w-6 text-amber-600" />
                            Pick Up Where You Left Off
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            Items waiting in your cart & recently viewed
                        </p>
                    </div>
                    <Link href="/cart">
                        <Button variant="ghost" className="text-amber-600 hover:text-amber-700">
                            View Cart <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                    {items.slice(0, 6).map((product) => (
                        <Link key={product.id} href={`/product/${product.id}`} className="group">
                            <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-zinc-900">
                                <div className="aspect-[3/4] relative bg-gray-100 dark:bg-zinc-800">
                                    <Image
                                        src={product.images?.[0]?.src || '/placeholder.jpg'}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform group-hover:scale-105"
                                    />
                                    <Badge className="absolute bottom-2 left-2 bg-white/90 text-black hover:bg-white backdrop-blur-md">
                                        Continue
                                    </Badge>
                                </div>
                                <CardContent className="p-3">
                                    <p className="text-xs text-muted-foreground truncate">{product.brand}</p>
                                    <h3 className="font-medium text-sm truncate group-hover:text-amber-600 transition-colors">
                                        {product.name}
                                    </h3>
                                    <p className="font-bold text-sm mt-1">
                                        ₹{product.price.toLocaleString('en-IN')}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
