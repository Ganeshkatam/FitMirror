'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    Menu, ChevronRight, User, ShoppingBag, Heart, Sparkles,
    Package, MapPin, Shirt, Clock, Bell, Settings, Gift,
    Camera, Home, Tag, LogOut, Crown, Star, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

import { Category, CategoryWithSubs } from '@/lib/categories/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Type guard
function isCategoryWithSubs(cat: any): cat is CategoryWithSubs {
    return 'sub_categories' in cat
}

type AnyCategory = Category | CategoryWithSubs

interface MobileNavProps {
    categories?: AnyCategory[]
    user?: {
        id: string
        email: string
        display_name?: string
        avatar_url?: string | null
    } | null
    orderCount?: number
    wishlistCount?: number
}

export function MobileNav({ categories = [], user, orderCount = 0, wishlistCount = 0 }: MobileNavProps) {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        setOpen(false)
        router.refresh()
    }

    const closeAndNavigate = () => {
        setOpen(false)
    }

    const timeOfDay = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button
                    className="mr-2 md:hidden p-2 hover:bg-muted rounded-lg transition-colors active:scale-95"
                    suppressHydrationWarning
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] sm:w-[360px] p-0 flex flex-col border-r-0 shadow-2xl overflow-hidden h-full">

                {/* ── HEADER: User Profile or Brand ── */}
                {user ? (
                    <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-indigo-900 to-purple-900" />
                        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
                        <div className="relative z-10 px-5 pt-10 pb-6">
                            <div className="flex items-center gap-4">
                                <Link href="/profile" onClick={closeAndNavigate} className="shrink-0">
                                    <div className="w-14 h-14 rounded-full bg-white/10 ring-2 ring-white/20 overflow-hidden flex items-center justify-center">
                                        {user.avatar_url ? (
                                            <Image
                                                src={user.avatar_url}
                                                alt="Profile"
                                                width={56}
                                                height={56}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <User className="h-6 w-6 text-white/70" />
                                        )}
                                    </div>
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-indigo-200 flex items-center gap-1">
                                        <Sparkles className="h-3 w-3" /> {timeOfDay}
                                    </p>
                                    <p className="text-white font-bold text-lg truncate mt-0.5">
                                        {user.display_name || 'Fashionista'}
                                    </p>
                                    <p className="text-indigo-200/70 text-xs truncate">{user.email}</p>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex items-center gap-4 mt-5">
                                <Link href="/account/orders" onClick={closeAndNavigate} className="flex items-center gap-1.5 text-xs text-indigo-200 hover:text-white transition-colors">
                                    <Package className="h-3.5 w-3.5" />
                                    <span className="font-semibold">{orderCount}</span> Orders
                                </Link>
                                <div className="w-px h-4 bg-white/20" />
                                <Link href="/account/wishlist" onClick={closeAndNavigate} className="flex items-center gap-1.5 text-xs text-indigo-200 hover:text-white transition-colors">
                                    <Heart className="h-3.5 w-3.5" />
                                    <span className="font-semibold">{wishlistCount}</span> Wishlist
                                </Link>
                                <div className="w-px h-4 bg-white/20" />
                                <div className="flex items-center gap-1.5 text-xs text-amber-300">
                                    <Zap className="h-3.5 w-3.5" />
                                    <span className="font-semibold">0</span> Points
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="px-5 pt-8 pb-6 border-b bg-gradient-to-br from-slate-50 to-white">
                        <Link href="/" onClick={closeAndNavigate} className="flex items-center gap-2.5 mb-5">
                            <div className="h-9 w-9 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-sm">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xl font-serif font-bold tracking-tight">FitMirror</span>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-4">Sign in for personalized shopping, try-ons, and exclusive deals.</p>
                        <div className="flex gap-2">
                            <Button className="flex-1 rounded-full bg-gray-900 hover:bg-gray-800 text-sm h-10" asChild>
                                <Link href="/login" onClick={closeAndNavigate}>Log In</Link>
                            </Button>
                            <Button variant="outline" className="flex-1 rounded-full text-sm h-10" asChild>
                                <Link href="/signup" onClick={closeAndNavigate}>Sign Up</Link>
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── MAIN CONTENT ── */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    {/* Shop Section */}
                    <div className="p-4 space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-3 mb-2">Shop</p>

                        <NavLink href="/" icon={Home} label="Home" onClick={closeAndNavigate} />
                        <NavLink href="/shop" icon={ShoppingBag} label="Shop All" onClick={closeAndNavigate} badge="New" badgeColor="bg-[#ff3f6c]" />

                        {/* Category Accordion */}
                        {categories.filter(c => c.name && c.name.trim()).length > 0 && (
                            <Accordion type="single" collapsible className="w-full">
                                {categories.filter(c => c.name && c.name.trim()).map((category) => {
                                    const hasSubs = isCategoryWithSubs(category) && category.sub_categories?.length > 0
                                    const hasChildren = !isCategoryWithSubs(category) && category.children && category.children.length > 0

                                    if (!hasSubs && !hasChildren) {
                                        // Category with no subcategories — render as a simple link
                                        return (
                                            <NavLink
                                                key={category.id}
                                                href={`/shop/${category.slug}`}
                                                icon={Tag}
                                                label={category.name}
                                                onClick={closeAndNavigate}
                                            />
                                        )
                                    }

                                    return (
                                        <AccordionItem key={category.id} value={category.id} className="border-0">
                                            <AccordionTrigger className="py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-muted/50 hover:no-underline [&[data-state=open]]:bg-muted/50 transition-colors">
                                                <span className="flex items-center gap-3">
                                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                                    {category.name}
                                                </span>
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-1 pt-0">
                                                <div className="ml-6 pl-4 border-l-2 border-muted space-y-0.5">
                                                    {/* New-style sub_categories */}
                                                    {isCategoryWithSubs(category) && category.sub_categories?.map((sub) => (
                                                        <Link
                                                            key={sub.id}
                                                            href={`/shop/${category.slug}/${sub.slug}`}
                                                            onClick={closeAndNavigate}
                                                            className="flex items-center gap-2.5 text-sm py-2 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                                                        >
                                                            <span className="text-base">{sub.icon || '•'}</span>
                                                            {sub.name}
                                                        </Link>
                                                    ))}

                                                    {/* Legacy children */}
                                                    {!isCategoryWithSubs(category) && category.children?.map((child) => (
                                                        <div key={child.id}>
                                                            <Link
                                                                href={`/shop/${category.slug}/${child.slug}`}
                                                                onClick={closeAndNavigate}
                                                                className="text-xs font-bold text-[#ff3f6c] uppercase tracking-wide block py-1.5 px-2"
                                                            >
                                                                {child.name}
                                                            </Link>
                                                            {child.children?.map((item) => (
                                                                <Link
                                                                    key={item.id}
                                                                    href={`/shop/${category.slug}/${child.slug}/${item.slug}`}
                                                                    onClick={closeAndNavigate}
                                                                    className="text-sm text-muted-foreground py-1.5 px-2 block hover:text-foreground transition-colors"
                                                                >
                                                                    {item.name}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    ))}

                                                    <Link
                                                        href={`/shop/${category.slug}`}
                                                        onClick={closeAndNavigate}
                                                        className="flex items-center gap-2 text-xs font-semibold text-indigo-600 py-2 px-2 hover:underline"
                                                    >
                                                        View All {category.name} <ChevronRight className="h-3 w-3" />
                                                    </Link>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )
                                })}
                            </Accordion>
                        )}
                    </div>

                    <div className="mx-4 border-t" />

                    {/* Features Section  */}
                    <div className="p-4 space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-3 mb-2">Features</p>
                        <NavLink href="/try-on" icon={Camera} label="Virtual Try-On" onClick={closeAndNavigate} highlight />
                        <NavLink href="/outfit-builder" icon={Shirt} label="Outfit Builder" onClick={closeAndNavigate} />
                        <NavLink href="/shop?sort=new" icon={Star} label="New Arrivals" onClick={closeAndNavigate} />
                    </div>

                    <div className="mx-4 border-t" />

                    {/* Account Section (only when logged in) */}
                    {user && (
                        <>
                            <div className="p-4 space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-3 mb-2">My Account</p>
                                <NavLink href="/profile" icon={User} label="Profile" onClick={closeAndNavigate} />
                                <NavLink href="/account/orders" icon={Package} label="My Orders" onClick={closeAndNavigate} count={orderCount} />
                                <NavLink href="/account/wishlist" icon={Heart} label="Wishlist" onClick={closeAndNavigate} count={wishlistCount} countColor="text-rose-500 bg-rose-50" />
                                <NavLink href="/account/closet" icon={Shirt} label="My Closet" onClick={closeAndNavigate} />
                                <NavLink href="/account/tryon-history" icon={Clock} label="Try-On History" onClick={closeAndNavigate} />
                                <NavLink href="/account/addresses" icon={MapPin} label="Addresses" onClick={closeAndNavigate} />
                                <NavLink href="/account/notifications" icon={Bell} label="Notifications" onClick={closeAndNavigate} />
                            </div>

                            <div className="mx-4 border-t" />

                            <div className="p-4 space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-3 mb-2">More</p>
                                <NavLink href="/account/settings" icon={Settings} label="Settings" onClick={closeAndNavigate} />
                                <NavLink href="/account/referrals" icon={Gift} label="Referrals" onClick={closeAndNavigate} />
                                <NavLink href="/loyalty" icon={Crown} label="Loyalty & Rewards" onClick={closeAndNavigate} />
                            </div>
                        </>
                    )}
                </div>

                {/* ── FOOTER ── */}
                {user ? (
                    <div className="p-4 border-t bg-muted/30">
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-destructive w-full py-2.5 px-3 rounded-lg hover:bg-destructive/5 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <div className="p-4 border-t bg-muted/30">
                        <p className="text-xs text-center text-muted-foreground">
                            © {new Date().getFullYear()} FitMirror. All rights reserved.
                        </p>
                    </div>
                )}

            </SheetContent>
        </Sheet>
    )
}


// ── Reusable NavLink ──
function NavLink({
    href, icon: Icon, label, onClick, badge, badgeColor, count, countColor, highlight
}: {
    href: string
    icon: any
    label: string
    onClick?: () => void
    badge?: string
    badgeColor?: string
    count?: number
    countColor?: string
    highlight?: boolean
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium transition-all group
                ${highlight
                    ? 'bg-gradient-to-r from-pink-50 to-violet-50 text-pink-700 hover:from-pink-100 hover:to-violet-100 dark:from-pink-950/30 dark:to-violet-950/30 dark:text-pink-300'
                    : 'text-foreground/80 hover:bg-muted/50 hover:text-foreground'
                }`}
        >
            <span className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${highlight ? 'text-pink-500' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`} />
                {label}
                {badge && (
                    <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full ${badgeColor || 'bg-gray-500'}`}>
                        {badge}
                    </span>
                )}
            </span>
            <span className="flex items-center gap-2">
                {count !== undefined && count > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${countColor || 'bg-blue-50 text-blue-600'}`}>
                        {count}
                    </span>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
        </Link>
    )
}
