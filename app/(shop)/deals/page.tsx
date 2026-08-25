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

    // 2. Fetch Global Coupons (seller_id is optional; omitting it returns platform-wide coupons)
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
