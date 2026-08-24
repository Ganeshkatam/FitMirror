"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/store/cart'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function CartButton() {
    const items = useCart((state) => state.items)
    const [mounted, setMounted] = useState(false)

    // Prevent hydration mismatch
    useEffect(() => {
        // eslint-disable-next-line
        setMounted(true)
    }, [])

    const count = items.reduce((acc, item) => acc + item.quantity, 0)

    return (
        <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative hover:bg-muted group">
                <ShoppingBag className="h-5 w-5" />
                <span className="sr-only">Cart</span>

                {mounted && count > 0 && (
                    <span className={cn(
                        "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[10px] font-medium text-white ring-2 ring-background transition-all group-hover:scale-110",
                        count > 9 && "w-auto px-1 min-w-[16px]"
                    )}>
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </Button>
        </Link>
    )
}
