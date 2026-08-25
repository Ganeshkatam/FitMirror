'use client'

import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Shirt,
    Sparkles,
    RotateCcw,
    Settings,
    ArrowLeft,
    ShoppingBag
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useTryOnStore } from '@/lib/store/use-try-on'
import { createClient } from '@/lib/supabase/client'
import { normalizeProductMedia } from '@/lib/service/media'

// Dynamic import for 3D Avatar Canvas
const AvatarCanvas = dynamic(
    () => import('@/components/try-on/avatar-canvas').then(mod => ({ default: mod.AvatarCanvas })),
    {
        ssr: false,
        loading: () => <DressingRoomSkeleton />
    }
)

interface ProductItem {
    id: string
    name: string
    price: number
    image: string
    category: 'top' | 'bottom' | 'dress' | 'shoes'
}

export default function TryOnRoomPage() {
    const [category, setCategory] = useState<'top' | 'bottom' | 'dress' | 'shoes'>('top')
    const [products, setProducts] = useState<ProductItem[]>([])
    const [loading, setLoading] = useState(true)

    const { selectedItems, setSelectedItem, initSession } = useTryOnStore()

    useEffect(() => {
        initSession()
    }, [initSession])

    // Load products by category
    useEffect(() => {
        async function loadProducts() {
            setLoading(true)
            try {
                const supabase = createClient()
                const { data } = await supabase
                    .from('products')
                    .select('id, name, price, product_media(*), image_url, category')
                    .eq('is_active', true)
                    .limit(20)

                if (data) {
                    const mapped: ProductItem[] = data.map(p => {
                        const catLower = (p.category || '').toLowerCase()
                        let catType: 'top' | 'bottom' | 'dress' | 'shoes' = 'top'
                        if (catLower.includes('bottom') || catLower.includes('pant') || catLower.includes('jean')) catType = 'bottom'
                        else if (catLower.includes('dress')) catType = 'dress'
                        else if (catLower.includes('shoe')) catType = 'shoes'

                        return {
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            image: (normalizeProductMedia(p.product_media)?.[0]?.src) || p.image_url || '',
                            category: catType
                        }
                    })
                    setProducts(mapped)
                }
            } catch (error) {
                console.error('Failed to load products:', error)
            }
            setLoading(false)
        }

        loadProducts()
    }, [])

    const filteredProducts = products.filter(p => p.category === category)

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b">
                <div className="container flex items-center justify-between h-14 px-4">
                    <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm font-medium">Exit</span>
                    </Link>

                    <h1 className="font-serif font-bold text-lg flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Virtual Fitting Room
                    </h1>

                    <Link href="/try-on/avatar" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
                        <Settings className="h-4 w-4" />
                        <span className="text-sm font-medium">Avatar</span>
                    </Link>
                </div>
            </header>

            <div className="container px-4 py-6">
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Left: Avatar Canvas */}
                    <div className="order-2 lg:order-1">
                        <Card className="overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 border-gray-200">
                            <div className="aspect-[3/4] relative">
                                <Suspense fallback={<DressingRoomSkeleton />}>
                                    <AvatarCanvas />
                                </Suspense>

                                {/* Controls Overlay */}
                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="bg-white/90 backdrop-blur-sm"
                                            onClick={() => {
                                                setSelectedItem('top', null)
                                                setSelectedItem('bottom', null)
                                                setSelectedItem('dress', null)
                                                setSelectedItem('shoes', null)
                                            }}
                                        >
                                            <RotateCcw className="h-4 w-4 mr-1" />
                                            Reset
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Worn Items Summary */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {selectedItems.top && (
                                <Badge variant="secondary" className="gap-1">
                                    <Shirt className="h-3 w-3" />
                                    Top Selected
                                    <button onClick={() => setSelectedItem('top', null)} className="ml-1 hover:text-red-500">×</button>
                                </Badge>
                            )}
                            {selectedItems.bottom && (
                                <Badge variant="secondary" className="gap-1">
                                    Bottom Selected
                                    <button onClick={() => setSelectedItem('bottom', null)} className="ml-1 hover:text-red-500">×</button>
                                </Badge>
                            )}
                            {selectedItems.dress && (
                                <Badge variant="secondary" className="gap-1">
                                    Dress Selected
                                    <button onClick={() => setSelectedItem('dress', null)} className="ml-1 hover:text-red-500">×</button>
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Right: Product Selection */}
                    <div className="order-1 lg:order-2">
                        <Tabs value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                            <TabsList className="w-full grid grid-cols-4 mb-4">
                                <TabsTrigger value="top" className="gap-1.5">
                                    <Shirt className="h-4 w-4" />
                                    <span className="hidden sm:inline">Tops</span>
                                </TabsTrigger>
                                <TabsTrigger value="bottom" className="gap-1.5">
                                    <span className="hidden sm:inline">Bottoms</span>
                                </TabsTrigger>
                                <TabsTrigger value="dress" className="gap-1.5">
                                    <span className="hidden sm:inline">Dresses</span>
                                </TabsTrigger>
                                <TabsTrigger value="shoes" className="gap-1.5">
                                    <span className="hidden sm:inline">Shoes</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value={category} className="mt-0">
                                {loading ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {[...Array(6)].map((_, i) => (
                                            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                                        ))}
                                    </div>
                                ) : filteredProducts.length === 0 ? (
                                    <Card className="p-8 text-center">
                                        <Sparkles className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                                        <h3 className="font-semibold">No items available</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Check back soon for new try-on items.
                                        </p>
                                    </Card>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {filteredProducts.map((product) => {
                                            const isSelected = selectedItems[product.category] === product.id
                                            return (
                                                <Card
                                                    key={product.id}
                                                    className={`group overflow-hidden cursor-pointer transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-black' : ''}`}
                                                    onClick={() => setSelectedItem(product.category, isSelected ? null : product.id)}
                                                >
                                                    <div className="aspect-[3/4] relative bg-gray-100">
                                                        {product.image ? (
                                                            <Image
                                                                src={product.image}
                                                                alt={product.name}
                                                                fill
                                                                className="object-cover transition-transform group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                                <Shirt className="h-8 w-8" />
                                                            </div>
                                                        )}

                                                        {isSelected && (
                                                            <div className="absolute top-2 right-2">
                                                                <Badge className="bg-black text-white">Selected</Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <CardContent className="p-3">
                                                        <h4 className="font-medium text-sm truncate">{product.name}</h4>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <span className="font-bold text-sm">₹{product.price.toLocaleString('en-IN')}</span>
                                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                                                <ShoppingBag className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}

function DressingRoomSkeleton() {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50">
            <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Loading 3D viewer...</p>
            </div>
        </div>
    )
}
