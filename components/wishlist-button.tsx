'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWishlist } from '@/lib/store/use-wishlist'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface WishlistButtonProps {
    initialCount?: number
    className?: string
}

export function WishlistButton({ initialCount = 0, className }: WishlistButtonProps) {
    const { items, fetchWishlist, initialized } = useWishlist()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (!initialized) {
            fetchWishlist()
        }
    }, [initialized, fetchWishlist])

    // Use store count if mounted, otherwise initialCount (SSR)
    const count = mounted ? items.length : initialCount

    return (
        <Link href="/wishlist">
            <Button variant="ghost" size="icon" className={cn("relative text-gray-700 hover:text-amber-600", className)}>
                <Heart className="h-5 w-5" />
                {count > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                        {count > 9 ? '9+' : count}
                    </span>
                )}
                <span className="sr-only">Wishlist</span>
            </Button>
        </Link>
    )
}
