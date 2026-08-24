import { LocationSelector } from '@/components/layout/location-selector'
import { getAddresses } from '@/app/actions/addresses'
import Link from 'next/link'
import { Sparkles, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GlobalSearch } from '@/components/global-search'
import { ClientNotificationCenter as NotificationCenter } from '@/components/client-notification-center'
import { CartInitializer } from '@/components/cart/cart-initializer'
import { CartButton } from '@/components/cart/cart-button'
import { GenieNavButton } from '@/components/global-genie'
import { ShopMegaMenu } from '@/components/shop-mega-menu'
import { MobileNav } from '@/components/mobile-nav'
import { WishlistButton } from '@/components/wishlist-button'
import { StorefrontService } from '@/lib/service/storefront'
import { AuthDropdown } from '@/components/layout/auth-dropdown'

export async function SiteHeader() {
    const supabase = await createClient()

    // Fetch Settings, Categories, and User data in parallel
    const [settingsRes, megaMenuData, addressesRes, userRes] = await Promise.all([
        supabase.from('store_settings').select('*').single(),
        StorefrontService.getMegaMenuData(),
        getAddresses(),
        supabase.auth.getUser()
    ])

    const storeSettings = settingsRes.data
    const addresses = addressesRes.data || []
    const currentUser = userRes.data?.user || null

    // Fetch user-specific data
    let mobileNavUser: { id: string; email: string; display_name?: string; avatar_url?: string | null } | null = null
    let headerOrderCount = 0
    let headerWishlistCount = 0
    let profileData: any = null
    let isAdmin = false

    if (currentUser) {
        const [profileRes, ordersRes, wishlistRes] = await Promise.all([
            supabase.from('profiles').select('display_name, avatar_url').eq('id', currentUser.id).single(),
            supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
            supabase.from('wishlists').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id)
        ])

        mobileNavUser = {
            id: currentUser.id,
            email: currentUser.email || '',
            display_name: profileRes.data?.display_name || undefined,
            avatar_url: profileRes.data?.avatar_url || null
        }
        headerOrderCount = ordersRes.count || 0
        headerWishlistCount = wishlistRes.count || 0
    }

    // Fallback categories for mobile nav if needed (using megaMenu structure as base)
    const mobileCategories = megaMenuData.map((m: any, idx: number) => ({
        id: m.id || `menu-${idx}`,
        name: m.label,
        slug: m.href.split('/').pop() || '',
        sub_categories: []
    }))

    return (
        <>
            {/* Maintenance Banner */}
            {storeSettings?.maintenance_banner_enabled && (
                <div className="bg-amber-600 dark:bg-amber-700 text-white text-center py-2.5 px-4 text-sm font-medium z-[51]">
                    <AlertTriangle className="inline-block h-4 w-4 mr-2 mb-0.5" />
                    {storeSettings.maintenance_banner_text || "System Maintenance: Some features may be unavailable."}
                </div>
            )}

            <header className="sticky top-0 z-50 w-full border-b-2 border-gray-200 dark:border-gray-800 bg-background shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="w-full max-w-[1800px] mx-auto px-4 md:px-6 flex h-16 items-center justify-between">

                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Trigger */}
                        <MobileNav categories={mobileCategories} user={mobileNavUser} orderCount={headerOrderCount} wishlistCount={headerWishlistCount} />

                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-2 group">
                            <div className="h-8 w-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xl font-serif font-bold tracking-tight group-hover:text-amber-700 transition-colors hidden min-[350px]:inline">
                                FitMirror
                            </span>
                        </Link>

                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center h-full gap-6">
                        <Link href="/" className="px-1 h-full flex items-center text-sm font-bold tracking-wide text-foreground/80 hover:text-foreground transition-colors uppercase border-b-[3px] border-transparent hover:border-amber-500">
                            HOME
                        </Link>
                        <ShopMegaMenu menuData={megaMenuData} />
                        <Link href="/shop?sort=new" className="px-1 h-full flex items-center gap-1 text-sm font-bold tracking-wide text-foreground/80 hover:text-foreground transition-colors uppercase border-b-[3px] border-transparent hover:border-amber-500">
                            NEW ARRIVALS
                            <span className="text-[10px] bg-[#ff3f6c] text-white px-1.5 py-0.5 rounded-full">NEW</span>
                        </Link>
                    </nav>

                    {/* Right Icons */}
                    <div className="flex items-center justify-end space-x-1">
                        <GlobalSearch />


                        {/* Desktop Only Icons */}
                        <GenieNavButton />
                        <LocationSelector addresses={addresses} className="hidden lg:flex" />
                        <NotificationCenter />
                        <AuthDropdown user={currentUser} profile={profileData} />
                    </div>

                </div>
            </header>
        </>
    )
}

// ----------------------------------------------------------------------------
// Sub-components (Server Components for minimal client bundle)
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Sub-components (Server Components for minimal client bundle)
// ----------------------------------------------------------------------------
// AdminButton and AuthButton are now handled by AuthDropdown
