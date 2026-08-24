'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, ShoppingBag, Heart, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCart } from '@/lib/store/cart'
import { useWishlist } from '@/lib/store/use-wishlist'

interface BottomNavProps {
    onAIClick?: () => void
}

export function BottomNav({ onAIClick }: BottomNavProps) {
    const pathname = usePathname()
    const cartItems = useCart(s => s.items)
    const wishlistItems = useWishlist(s => s.items)

    const cartCount = cartItems.length
    const wishlistCount = wishlistItems.length

    // Hide on auth pages and cart/checkout
    if (pathname?.startsWith('/login') || pathname?.startsWith('/register') || pathname?.startsWith('/checkout')) return null

    const isActive = (href: string) =>
        href === '/' ? pathname === '/' : pathname?.startsWith(href) ?? false

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800/60"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            <div className="flex items-end justify-around h-16 px-2 pt-1">
                {/* Home */}
                <NavItem href="/" icon={Home} label="Home" active={isActive('/')} />

                {/* Explore/Shop */}
                <NavItem href="/shop" icon={Compass} label="Explore" active={isActive('/shop')} badge={0} />

                {/* Center AI Button — elevated */}
                <div className="relative flex flex-col items-center -mt-4">
                    <button
                        onClick={onAIClick}
                        className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center",
                            "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600",
                            "shadow-lg shadow-amber-500/30",
                            "active:scale-90 transition-transform duration-150",
                            "ring-4 ring-white dark:ring-gray-950"
                        )}
                    >
                        <Sparkles className="h-5 w-5 text-white" />
                    </button>
                    <span className="text-[10px] font-medium text-amber-600 mt-0.5">Style AI</span>
                </div>

                {/* Wishlist */}
                <NavItem href="/account/wishlist" icon={Heart} label="Wishlist" active={isActive('/account/wishlist')} badge={wishlistCount} fillOnActive />

                {/* Bag */}
                <NavItem href="/cart" icon={ShoppingBag} label="Bag" active={isActive('/cart')} badge={cartCount} />
            </div>
        </nav>
    )
}

function NavItem({
    href, icon: Icon, label, active, badge = 0, fillOnActive = false
}: {
    href: string
    icon: any
    label: string
    active: boolean
    badge?: number
    fillOnActive?: boolean
}) {
    return (
        <Link
            href={href}
            className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all",
                active
                    ? "text-black dark:text-white"
                    : "text-gray-400 active:text-gray-600"
            )}
        >
            <span className="relative">
                <Icon
                    className={cn(
                        "h-[22px] w-[22px] transition-transform duration-200",
                        active && "scale-110"
                    )}
                    strokeWidth={active ? 2.5 : 1.5}
                    fill={active && fillOnActive ? 'currentColor' : 'none'}
                />
                {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#ff3f6c] text-white text-[9px] font-bold px-1 leading-none">
                        {badge > 99 ? '99+' : badge}
                    </span>
                )}
            </span>
            <span className={cn(
                "text-[10px] leading-tight transition-all",
                active ? "font-bold" : "font-medium"
            )}>
                {label}
            </span>
        </Link>
    )
}
