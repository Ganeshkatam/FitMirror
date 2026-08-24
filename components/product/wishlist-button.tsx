'use client'

import * as React from 'react'
import { Heart, BellRing } from 'lucide-react'
import { triggerHeartBlast } from '@/components/motion/micro-interactions'
import { useWishlist } from '@/lib/store/use-wishlist'
import { createClient } from '@/lib/supabase/client'
import { getUserPreferences } from '@/lib/utils/user-preferences'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface WishlistButtonProps {
    productId: string
    className?: string
    variant?: 'icon' | 'full'
    size?: 'sm' | 'md'
    isOutOfStock?: boolean
}

export function WishlistButton({ productId, className, variant = 'icon', size = 'md', isOutOfStock = false }: WishlistButtonProps) {
    const { isInWishlist, toggleWishlist, fetchWishlist } = useWishlist()
    const isAdded = isInWishlist(productId)
    const [autoWishlistOOS, setAutoWishlistOOS] = React.useState(false)

    React.useEffect(() => {
        fetchWishlist()

        // Fetch user preference for auto_wishlist_oos
        const fetchPref = async () => {
            const supabase = createClient()
            const prefs = await getUserPreferences(supabase)
            if (prefs?.auto_wishlist_oos) {
                setAutoWishlistOOS(true)
            }
        }
        fetchPref()
    }, [fetchWishlist])

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        // If OOS and auto_wishlist_oos is enabled, auto-add and show toast
        if (isOutOfStock && autoWishlistOOS && !isAdded) {
            triggerHeartBlast(e.clientX, e.clientY)
            toggleWishlist(productId)
            toast.success("Added to wishlist! We'll notify you when it's back in stock.", {
                icon: <BellRing className="h-4 w-4" />
            })
            return
        }

        if (!isAdded) {
            triggerHeartBlast(e.clientX, e.clientY)
        }
        toggleWishlist(productId)
    }

    // Special OOS appearance when auto_wishlist is on
    const isOOSMode = isOutOfStock && autoWishlistOOS && !isAdded

    if (variant === 'full') {
        return (
            <Button
                variant={isOOSMode ? "default" : "outline"}
                size="lg"
                className={cn("gap-2", isOOSMode && "bg-amber-500 hover:bg-amber-600", className)}
                onClick={handleClick}
            >
                {isOOSMode ? (
                    <>
                        <BellRing className="h-5 w-5" />
                        Notify Me
                    </>
                ) : (
                    <>
                        <Heart className={cn("h-5 w-5", isAdded && "fill-red-500 text-red-500")} />
                        {isAdded ? 'Saved' : 'Wishlist'}
                    </>
                )}
            </Button>
        )
    }

    const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    const padding = size === 'sm' ? 'p-1.5' : 'p-2'

    return (
        <button
            onClick={handleClick}
            className={cn(
                "rounded-full transition-all hover:bg-muted active:scale-95",
                padding,
                isAdded ? "bg-red-50 text-red-500" : "bg-white/80 text-muted-foreground hover:text-red-500",
                isOOSMode && "bg-amber-100 text-amber-600 hover:bg-amber-200 hover:text-amber-700",
                className
            )}
            title={isOOSMode ? "Notify me when back in stock" : undefined}
        >
            {isOOSMode ? (
                <BellRing className={iconSize} />
            ) : (
                <Heart className={cn(iconSize, isAdded && "fill-current")} />
            )}
        </button>
    )
}
