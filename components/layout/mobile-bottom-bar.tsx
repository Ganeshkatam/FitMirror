'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, User, Zap, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWishlist } from '@/lib/store/use-wishlist'
import { useEffect, useState } from 'react'

export function MobileBottomBar() {
    const pathname = usePathname()
    const { items, fetchWishlist, initialized } = useWishlist()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (!initialized) fetchWishlist()
    }, [initialized, fetchWishlist])

    const wishlistCount = mounted ? items.length : 0

    // Hide on checkout or specific product pages if needed?
    if (pathname.startsWith('/checkout')) return null

    const navItems = [
        { href: '/', icon: Home, label: 'Home' },
        { href: '/shop', icon: Search, label: 'Shop' },
        { href: '/deals', icon: Zap, label: 'Deals', highlight: true },
        { href: '/account/wishlist', icon: Heart, label: 'Wishlist', count: wishlistCount },
        { href: '/account', icon: User, label: 'Account' },
    ]

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive
                                    ? "text-rose-600"
                                    : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            <div className="relative">
                                <Icon className={cn("w-6 h-6", isActive && "fill-current")} />
                                {item.highlight && (
                                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-400 rounded-full animate-pulse" />
                                )}
                                {item.count !== undefined && item.count > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                                        {item.count > 9 ? '9+' : item.count}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
