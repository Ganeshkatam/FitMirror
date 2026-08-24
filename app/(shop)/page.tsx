import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/product/product-card'
import { RecentlyViewed } from '@/components/product/recently-viewed'
import { Sparkles, Zap, Crown, Gift } from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/scroll-reveal'
import { RealtimeListener } from '@/components/realtime/realtime-listener'
import { CouponBanner } from '@/components/home/coupon-banner'
import { TrendingStrip } from '@/components/home/trending-strip'
import { StatsSection } from '@/components/home/stats-section'
import { StorefrontService } from '@/lib/service/storefront'
import { ForYouGrid } from '@/components/personalization'
import dynamic from 'next/dynamic'

// Lazy Load Heavy Components
const BrandSpotlight = dynamic(() => import('@/components/home/brand-spotlight').then(mod => mod.BrandSpotlight))
import { BentoGrid } from '@/components/home/bento-grid'
import { LiveTicker } from '@/components/home/live-ticker'
import { ShopTheLook } from '@/components/home/shop-the-look'
import { StyleQuizTeaser } from '@/components/home/style-quiz-teaser'
import { ParallaxHero } from '@/components/hero/parallax-hero'
import { CategoryOrbit } from '@/components/home/category-orbit'
import { PromoStrip } from '@/components/home/promo-strip'
import { StorySwiper } from '@/components/mobile/story-swiper'
const TestimonialCarousel = dynamic(() => import('@/components/home/testimonial-carousel').then(mod => mod.TestimonialCarousel))
const FlashSaleSection = dynamic(() => import('@/components/home/flash-sale-section').then(mod => mod.FlashSaleSection))
const JournalSection = dynamic(() => import('@/components/home/journal-section').then(mod => mod.JournalSection))
const ConsciousLuxurySection = dynamic(() => import('@/components/home/sustainability-section').then(mod => mod.ConsciousLuxurySection))
import { ContinueShopping } from '@/components/home/continue-shopping'
import { RecommendedProducts } from '@/components/home/recommended-products'
import { TryOnShowcase } from '@/components/home/try-on-showcase'
import { CouponStrip } from '@/components/home/coupon-strip'
import { CategoryShowcase } from '@/components/home/category-showcase'

import { Metadata } from 'next'
import { HeroCarousel } from '@/components/hero/hero-carousel'

export const revalidate = 3600 // ISR: Revalidate every hour

export const metadata: Metadata = {
    title: 'FitMirror | AI-Powered Fashion & Virtual Try-On',
    description: 'Shop the latest trends and try them on virtually before you buy. Experience the future of online fashion shopping with FitMirror.',
    openGraph: {
        title: 'FitMirror | Virtual Try-On Fashion',
        description: 'See exactly how clothes look on you with our AI technology.',
        type: 'website',
    }
}


export default async function HomePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch Cached Data
    const [
        ,
        products,
        trendingProducts,
        collectionsData,
        categoriesData,
        homeStats,
        continueShopping,
        featuredReviews,
        recommendedProducts
    ] = await Promise.all([
        StorefrontService.getStoreSettings(),
        StorefrontService.getFeaturedProducts(),
        StorefrontService.getTrendingProducts(),
        StorefrontService.getCollections(),
        user ? import('@/lib/service/personalization').then(m => m.PersonalizationService.getPersonalizedCategories(user.id)) : StorefrontService.getAllCategories(),
        StorefrontService.getHomeStats(),
        user ? import('@/lib/service/personalization').then(m => m.PersonalizationService.getContinueShopping(user.id)) : Promise.resolve([]),
        StorefrontService.getFeaturedReviews(),
        StorefrontService.getRecommendedProducts()
    ])

    return (
        <div className="min-h-screen">
            {/* Realtime Listeners */}
            <RealtimeListener table="products" filter="is_active=eq.true" />
            <RealtimeListener table="product_inventory" />
            <RealtimeListener table="collections" filter="is_active=eq.true" />
            <RealtimeListener table="product_categories" filter="is_active=eq.true" />
            <RealtimeListener table="coupons" filter="is_active=eq.true" />

            {/* 1. Coupon Strip (New) */}
            <CouponStrip />

            {/* 1. Hero */}
            <HeroCarousel />

            {/* 2. Smart Promo Strip */}
            <PromoStrip />
            {/* 1.5. Category Showcase (New Myntra Style) */}
            <CategoryShowcase />


            {/* 2.5 Story Swiper — Mobile-Only Discovery (md:hidden internally) */}
            {trendingProducts && trendingProducts.length > 0 && (
                <StorySwiper products={trendingProducts} title="Trending Now 🔥" />
            )}

            {/* 3. Category Orbit (Mobile-first quick access) */}
            {categoriesData && categoriesData.length > 0 && (
                <CategoryOrbit categories={categoriesData} />
            )}

            {/* 4. Live Activity Ticker */}
            <LiveTicker />

            {/* 5. Shop The Look */}
            {/* <ShopTheLook /> */}

            {/* 4. Continue Shopping (Personalized) - High Priority */}
            {continueShopping && continueShopping.length > 0 && (
                <ContinueShopping items={continueShopping} />
            )}

            {/* 5. Trending / Flash Sale */}
            {products && products.length > 0 && (
                <FlashSaleSection products={products.slice(0, 8)} />
            )}

            {/* 6. Recommended Products (New - "Most Loved") */}
            {recommendedProducts && recommendedProducts.length > 0 && (
                <RecommendedProducts products={recommendedProducts} />
            )}

            {/* 7. Try-On Showcase (New - Feature Highlight) */}
            <TryOnShowcase />

            {/* 6. Coupon Banner */}
            <CouponBanner />

            {/* 7. Style Personality Quiz (New - Break) */}
            {/* <StyleQuizTeaser /> */}

            {/* 8. Trending Strip (Existing) */}
            {trendingProducts && trendingProducts.length > 0 && (
                <TrendingStrip products={trendingProducts.map(p => ({
                    id: p.id,
                    name: p.name || 'Product',
                    image: (p.images && p.images.length > 0 ? p.images[0] : '/placeholder.jpg'),
                    price: p.price,
                    badge: 'hot' as const
                }))} />
            )}

            {/* 9. Bento Grid Collections (Existing) */}
            {categoriesData && categoriesData.length > 0 && (
                <BentoGrid categories={categoriesData} />
            )}

            {/* 10. Featured Products (New Arrivals) */}
            <section className="w-full py-10 md:py-24 bg-white">
                <div className="w-full max-w-[1800px] mx-auto px-4 md:px-6">
                    <FadeIn className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-12">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1 rounded-full mb-3">
                                <Crown className="h-4 w-4 text-amber-600" />
                                <span className="text-amber-700 text-sm font-medium">Just Arrived</span>
                            </div>
                            <h2 className="text-2xl md:text-5xl font-serif font-bold tracking-tight">
                                New Arrivals
                            </h2>
                            <p className="text-muted-foreground mt-1 md:mt-2 max-w-md text-sm md:text-lg">
                                Curated pieces designed for the modern woman
                            </p>
                        </div>
                        <Link href="/shop">
                            <Button variant="outline" size="lg" className="rounded-full hover-lift group">
                                View All Products
                                <Zap className="ml-2 h-4 w-4 group-hover:text-amber-500 transition-colors" />
                            </Button>
                        </Link>
                    </FadeIn>

                    {products && products.length > 0 ? (
                        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
                            {products.map((product) => (
                                <StaggerItem key={product.id}>
                                    <ProductCard product={product} showTryOn />
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    ) : (
                        <div className="text-center py-16 bg-gradient-to-br from-amber-50/50 to-rose-50/50 rounded-3xl border border-amber-100">
                            <Sparkles className="h-12 w-12 mx-auto text-amber-400 mb-4 animate-pulse" />
                            <p className="text-lg font-medium text-gray-800">Products coming soon!</p>
                            <p className="text-sm text-muted-foreground mt-1">Check back in a bit</p>
                        </div>
                    )}
                </div>
            </section>


            {/* 12. Personalized Picks (For You) */}
            <section className="w-full py-8 md:py-16 bg-gradient-to-b from-amber-50/50 to-white">
                <div className="w-full max-w-[1800px] mx-auto px-4 md:px-6">
                    <ForYouGrid title="Picked For You" limit={8} />
                </div>
            </section>

            {/* 13. Brand Spotlight (CMS) */}
            {collectionsData && collectionsData.length > 0 && (
                <BrandSpotlight collections={collectionsData} />
            )}

            {/* 14. Journal Editorial Section */}
            <JournalSection />

            {/* 15. Stats Section - Social Proof */}
            {/* <StatsSection stats={homeStats} /> */}

            {/* 16. Testimonials */}
            <TestimonialCarousel reviews={featuredReviews} />

            {/* 17. Recently Viewed (Bottom) */}
            <div className="w-full max-w-[1800px] mx-auto px-4 md:px-6 mb-16">
                <RecentlyViewed />
            </div>

            {/* 18. Conscious Luxury Section */}
            <ConsciousLuxurySection />

            {/* 19. Newsletter/CTA Section */}
            <section className="w-full py-12 md:py-32 bg-[#0f172a] text-white relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
                        backgroundSize: '32px 32px'
                    }} />
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl" />

                <div className="w-full max-w-[1800px] mx-auto px-4 md:px-6 text-center relative">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
                            <Gift className="h-5 w-5 text-amber-400" />
                            <span className="text-medium font-medium">Get 15% off your first order</span>
                        </div>
                        <h2 className="text-2xl md:text-6xl font-serif font-bold mb-4 md:mb-6">
                            Ready to Transform<br />Your Wardrobe?
                        </h2>
                        <p className="text-white/60 max-w-2xl mx-auto mb-6 md:mb-10 text-sm md:text-xl">
                            Join with millions of people who shop with confidence using virtual try-on
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link href="/signup">
                                <Button size="lg" className="rounded-full h-12 px-8 text-base md:h-16 md:px-12 md:text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-xl hover:shadow-2xl transition-all">
                                    Create Account
                                </Button>
                            </Link>
                            <Link href="/shop">
                                <Button size="lg" className="rounded-full h-12 px-8 text-base md:h-16 md:px-12 md:text-lg bg-white text-indigo-950 hover:bg-indigo-50 shadow-lg hover:shadow-xl transition-all border border-transparent">
                                    Start Shopping
                                </Button>
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </section>
        </div>
    )
}
