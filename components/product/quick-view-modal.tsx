'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useQuickView } from '@/lib/store/use-quick-view'
import { ProductActions } from '@/components/product/product-actions'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import Link from 'next/link'
import NextImage from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import * as React from 'react'

interface InventoryItem {
    variant_id: string | null
    size: string
    stock: number
}

export function QuickViewModal() {
    const { isOpen, close, product } = useQuickView()
    const [inventory, setInventory] = React.useState<InventoryItem[]>([])

    // Fetch inventory when product changes
    React.useEffect(() => {
        if (product) {
            const fetchInventory = async () => {
                const supabase = createClient()
                const { data } = await supabase
                    .from('product_inventory')
                    .select('size, stock, variant_id')
                    .eq('product_id', product.id)

                if (data) setInventory(data as InventoryItem[])
            }
            fetchInventory()
        }
    }, [product])

    if (!product) return null

    // Helper to get sizes
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40']
    const sizes = Array.from(new Set(inventory?.map((i: InventoryItem) => i.size) || []))
        .sort((a, b) => {
            const idxA = sizeOrder.indexOf(a)
            const idxB = sizeOrder.indexOf(b)
            if (idxA === -1 && idxB === -1) return a.localeCompare(b)
            if (idxA === -1) return 1
            if (idxB === -1) return -1
            return idxA - idxB
        })

    return (
        <Dialog open={isOpen} onOpenChange={close}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0 max-h-[90vh] overflow-y-auto">
                <VisuallyHidden>
                    <DialogTitle>{product.name} - Quick View</DialogTitle>
                </VisuallyHidden>
                <div className="grid grid-cols-1 md:grid-cols-2 min-h-fit">
                    {/* Image Section */}
                    <div className="bg-muted relative h-[40vh] md:h-full">
                        <NextImage
                            src={product.image || '/placeholder.png'}
                            alt={product.name}
                            fill
                            unoptimized
                            className="object-cover"
                        />
                        {product.tryon_asset_ref && (
                            <Badge className="absolute top-4 left-4 bg-white/90 text-amber-700 backdrop-blur">
                                <Sparkles className="h-3 w-3 mr-1" /> Try-On Available
                            </Badge>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="p-6 md:p-8 flex flex-col h-full overflow-y-auto">
                        <div className="flex-1 space-y-6">
                            <div>
                                <h2 className="text-2xl font-serif font-bold mb-2">{product.name}</h2>
                                <p className="text-xl font-semibold">₹{product.price.toLocaleString('en-IN')}</p>
                            </div>

                            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                                {product.description || `Beautiful ${product.category} crafted for comfort and style.`}
                            </p>

                            <div className="pt-2">
                                <ProductActions
                                    productId={product.id}
                                    productName={product.name}
                                    productImage={product.image || ''}
                                    price={product.price}
                                    sizes={sizes}
                                    initialInventory={inventory}
                                    category={product.category}
                                    storeId={product.store_id || ''}
                                />
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t flex justify-center">
                            <Link
                                href={`/product/${product.id}`}
                                className="text-sm font-medium hover:underline flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                                onClick={close}
                            >
                                View Full Details <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
