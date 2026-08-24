'use client'

import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { useWishlist } from '@/lib/store/use-wishlist'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

export function WishlistButton({ productId, variant = 'default' }: { productId: string, variant?: 'default' | 'icon' | 'mobile' }) {
    const { isInWishlist, toggleWishlist, fetchWishlist } = useWishlist()
    const isWishlisted = isInWishlist(productId)

    useEffect(() => {
        fetchWishlist()
    }, [fetchWishlist])

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        toggleWishlist(productId)
    }

    if (variant === 'mobile') {
        return (
            <button
                onClick={handleToggle}
                className={cn(
                    "flex-shrink-0 h-11 w-11 md:h-12 md:w-12 border-2 rounded-xl flex items-center justify-center transition-all duration-300",
                    isWishlisted
                        ? "bg-rose-50 border-rose-200 text-rose-500"
                        : "border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600"
                )}
            >
                <Heart className={cn("h-6 w-6 transition-all", isWishlisted ? "fill-current scale-110" : "scale-100")} />
            </button>
        )
    }

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={handleToggle}
            className={cn(
                "rounded-full transition-all duration-300 border-2",
                isWishlisted
                    ? "bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100 hover:text-rose-600"
                    : "border-gray-200 hover:border-gray-300 text-gray-500 hover:bg-gray-50"
            )}
        >
            <Heart className={cn("h-5 w-5 transition-all", isWishlisted ? "fill-current scale-110" : "scale-100")} />
        </Button>
    )
}
