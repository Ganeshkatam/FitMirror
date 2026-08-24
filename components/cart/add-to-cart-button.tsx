'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/store/cart'
import { toast } from 'sonner'
import { Loader2, ShoppingBag, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { triggerSuccessBurst } from '@/components/motion/micro-interactions'

interface AddToCartButtonProps {
    productId: string
    productName: string
    productImage: string
    price: number
    selectedSize: string | null
    disabled?: boolean
    storeId?: string
}

export function AddToCartButton({
    productId,
    productName,
    productImage,
    price,
    selectedSize,
    disabled = false,
    storeId = '',
}: AddToCartButtonProps) {
    const [loading, setLoading] = React.useState(false)
    const addItem = useCart((state) => state.addItem)
    const items = useCart((state) => state.items)
    const router = useRouter()

    // Check if this exact item (product + size) is already in cart
    const isInCart = React.useMemo(() => {
        if (!selectedSize) return false
        return items.some(item => item.productId === productId && item.size === selectedSize)
    }, [items, productId, selectedSize])

    async function handleAddToCart(e: React.MouseEvent) {
        if (!selectedSize) {
            toast.error('Please select a size')
            return
        }

        // If already in cart, navigate to cart instead
        if (isInCart) {
            router.push('/cart')
            return
        }

        setLoading(true)

        // Trigger confetti burst from button click position
        triggerSuccessBurst(e.clientX, e.clientY)

        // Add to cart (works for both guests and logged-in users)
        // Login will be required at checkout
        addItem({
            productId,
            productName,
            productImage,
            price,
            size: selectedSize,
            storeId,
        })

        toast.success('Added to cart!', {
            description: `${productName} (${selectedSize})`,
        })
        setLoading(false)
    }

    return (
        <Button
            className={`w-full h-12 text-lg rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all ${isInCart
                ? 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white'
                : 'bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-50 dark:to-gray-200 text-white dark:text-gray-900'
                }`}
            size="lg"
            onClick={handleAddToCart}
            disabled={loading || disabled}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Adding...
                </>
            ) : isInCart ? (
                <>
                    <Check className="mr-2 h-5 w-5" />
                    Added to Cart
                </>
            ) : (
                <>
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Add to Cart
                </>
            )}
        </Button>
    )
}
