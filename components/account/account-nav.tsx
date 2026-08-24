'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Package,
    Heart,
    MapPin,
    Settings,
    LogOut,
    Shirt,
    Clock,
    Bell,
    Gift,
    Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/app/(shop)/profile/sign-out-button'

const navItems = [
    { href: '/account', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/account/orders', label: 'Orders', icon: Package },
    { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
    { href: '/account/closet', label: 'My Closet', icon: Shirt },
    { href: '/account/tryon-history', label: 'Try-On History', icon: Clock },
    { href: '/account/addresses', label: 'Addresses', icon: MapPin },
    { href: '/account/notifications', label: 'Notifications', icon: Bell },
    { href: '/account/referrals', label: 'Referrals', icon: Gift },
    { href: '/loyalty', label: 'Loyalty Program', icon: Zap },
    { href: '/account/settings', label: 'Settings', icon: Settings },
]

// ... existing imports ...

// removed UnlockProCard import

export function AccountNav() {
    const pathname = usePathname()

    return (
        <nav className="space-y-1">
            {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                            isActive
                                ? "bg-black text-white"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                    >
                        <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-gray-500")} />
                        {item.label}
                    </Link>
                )
            })}

            <div className="pt-4 mt-4 border-t border-gray-100">
                <SignOutButton className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" />
            </div>
        </nav>
    )
}
