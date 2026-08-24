'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/store/cart'
import { toast } from 'sonner'
import { Loader2, ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BuyAgainButtonProps {
    orderItems: {
        product_id: string
        quantity: number
        size: string
        products: {
            name: string
            image: string | null
            price: number
            store_id?: string
        } | null
    }[]
    className?: string
}

export function BuyAgainButton({ orderItems, className }: BuyAgainButtonProps) {
    const [loading, setLoading] = React.useState(false)
    const router = useRouter()
    const addItem = useCart(state => state.addItem)

    const handleBuyAgain = async () => {
        setLoading(true)
        try {
            let addedCount = 0

            // Add each item to cart
            for (const item of orderItems) {
                if (item.products) {
                    addItem({
                        productId: item.product_id,
                        productName: item.products.name,
                        productImage: item.products.image || '',
                        price: item.products.price,
                        size: item.size,
                        storeId: item.products.store_id || ''
                    })
                    addedCount++
                }
            }

            // Fake delay for UX
            await new Promise(resolve => setTimeout(resolve, 800))

            if (addedCount > 0) {
                toast.success(`Added ${addedCount} items to cart`)
                router.push('/cart')
            } else {
                toast.error('No valid items found to reorder')
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to add items to cart')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            className={className}
            onClick={handleBuyAgain}
            disabled={loading}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding to Cart...
                </>
            ) : (
                <>
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Buy Again
                </>
            )}
        </Button>
    )
}
