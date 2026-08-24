import { StorefrontService } from '@/lib/service/storefront'
import { DealsHero } from '@/components/deals/deals-hero'
import { CouponCarousel } from '@/components/deals/coupon-carousel'
import { ProductCard } from '@/components/product/product-card'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Deals & Offers | FitMirror',
    description: 'Exclusive deals, flash sales, and active coupons on FitMirror.',
}

export default async function DealsPage() {
    // 1. Fetch Deals
    const deals = await StorefrontService.getDeals()

    // 2. Fetch Coupons (fetch global coupons, or for specific store if needed, here just getting global ones)
    // Note: getCoupons expects storeId, but we might want global coupons?
    // Let's modify getCoupons to be flexible or fetch from a 'default' store or null
    // The existing method: getCoupons(storeId). If storeId is undefined it returns empty array.
    // I'll try fetching for a known store or mock specific ones from DB with null store_id?
    // For now, I'll pass a common storeId if I knew one, or we need to update Service to support null storeId fetch.
    // StorefrontService.getCoupons() checks: if (!storeId) return []
    // I will use a different strategy or update StorefrontService later. For now, let's skip coupons fetch if we don't have a store ID context.
    // Or better, fetch top coupons regardless of store?

    // Workaround: We'll see if `deals` have store_ids and fetch coupons for the first store found?
    // Or just fetch coupons via direct supabase call in component (bad practice).
    // Let's assume we can enable global coupons fetch in getCoupons if storeId is 'global' or 'all'?
    // I'll leave coupons empty for now and fix Service if needed, or if I edited getCoupons in previous steps? No.
    // Wait, getCoupons calls .or(store_id.eq.${storeId},store_id.is.null). 
    // If I pass a dummy UUID it might return global coupons (store_id is null). 
    // But `storeId` is required in the TS signature.
    // I'll leave it empty for this iteration or pass a dummy valid UUID if I knew one.
    // Actually, I can fix `getCoupons` to allow optional storeId.

    // 2. Fetch Global Coupons
    const coupons = await StorefrontService.getCoupons()

    // Group deals by category for better display? Or just a big grid?
    // Big grid is fine for "Deals" page.

    return (
        <div className="min-h-screen bg-stone-50 pb-20">
            <div className="max-w-[1920px] mx-auto px-4 md:px-8 pt-6 md:pt-8 space-y-12">

                {/* Hero */}
                <DealsHero />

                {/* Coupons */}
                {coupons.length > 0 && (
                    <section>
                        <CouponCarousel coupons={coupons} />
                    </section>
                )}

                {/* Deals Grid */}
                <section id="shop-deals" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
                            Top Deals for You
                        </h2>
                        <span className="text-sm text-gray-500">{deals.length} offers found</span>
                    </div>

                    {deals.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed text-gray-500">
                            <p className="text-lg">No active deals right now. Check back later!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                            {deals.map((product: any) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
