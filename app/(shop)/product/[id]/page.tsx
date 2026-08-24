import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductGallery } from '@/components/product/product-gallery'
import { ProductViewTracker } from '@/components/product/product-view-tracker'
import { Suspense } from 'react'
import { ProductCard } from '@/components/product/product-card'
import { ReviewList } from '@/components/reviews/review-list'
import { TabbedRecommendations } from '@/components/product/tabbed-recommendations'
import { getProductReviews } from '@/lib/actions/reviews'
import { ProductDetailsClient } from './product-details-client'
import { CompleteTheLook } from '@/components/product/complete-the-look'
import { TrackProductView, BecauseYouViewed } from '@/components/personalization'
import { ProductInfo } from '@/components/product/product-info'

// --- 1. Data Fetching ---

// --- 1. Data Fetching ---

import { StorefrontService } from '@/lib/service/storefront'

// --- 2. SEO Metadata ---

export async function generateMetadata(
    { params }: { params: Promise<{ id: string }> },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const id = (await params).id
    const result: any = await StorefrontService.getProductById(id)
    if (result && result.error) return { title: 'Error Loading Product' }
    const product = result

    if (!product) {
        return { title: 'Product Not Found' }
    }

    const previousImages = (await parent).openGraph?.images || []
    const imageUrl = product.images?.[0] || product.image || '/og-default.jpg'

    return {
        title: `${product.name} | FitMirror`,
        description: product.description?.substring(0, 160) || 'Shop this item on FitMirror.',
        keywords: [product.category, product.material, product.gender, 'fashion', 'clothing'].filter(Boolean),
        openGraph: {
            title: product.name,
            description: product.description,
            images: [imageUrl, ...previousImages],
            type: 'website',
            siteName: 'FitMirror',
        },
        twitter: {
            card: 'summary_large_image',
            title: product.name,
            description: product.description,
            images: [imageUrl],
        }
    }
}

// --- 3. Page Component ---

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id
    // Cached Fetch
    const result: any = await StorefrontService.getProductById(id)
    if (result && result.error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-red-50 p-8 rounded-lg max-w-2xl">
                    <h1 className="text-xl font-bold text-red-700 mb-4">Error Loading Product</h1>
                    <pre className="text-sm text-red-600 whitespace-pre-wrap overflow-auto max-h-[500px]">
                        {JSON.stringify(result.error, null, 2)}
                    </pre>
                </div>
            </div>
        )
    }
    const product = result

    if (!product) {
        // Log for developers, but show polite UI to users
        console.error(`Product not found for ID: ${id} `)

        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-white px-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="relative w-32 h-32 mx-auto">
                        <div className="absolute inset-0 bg-rose-50 rounded-full animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-6xl">🛍️</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl md:text-3xl font-serif font-medium text-gray-900">
                            We couldn&apos;t find that piece
                        </h1>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            We&apos;re truly sorry, but the item you&apos;re looking for seems to have been moved or is no longer available.
                        </p>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                        <a
                            href="/shop"
                            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
                        >
                            Explore Our Collection
                        </a>
                        <a
                            href="/"
                            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-white text-gray-900 border border-gray-200 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Return Home
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    const [relatedProducts, reviews, coupons, siblingVariants] = await Promise.all([
        StorefrontService.getRelatedProducts(product.category, product.id, product.gender),
        StorefrontService.getProductReviews(product.id),
        StorefrontService.getCoupons(product.store_id || product.store?.id),
        StorefrontService.getProductColorVariants(product.name, product.id)
    ])

    // Build media array for gallery
    let media = []

    if (product.product_media && product.product_media.length > 0) {
        // Use rich media from product_media table
        media = product.product_media.map((item: any) => ({
            id: item.id,
            url: item.url,
            media_type: item.media_type
        }))
    } else {
        // Fallback to legacy images array
        media = (product.images || [product.image]).filter(Boolean).map((url: string, i: number) => {
            const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url)
            return {
                id: i.toString(),
                url,
                media_type: isVideo ? 'video' : 'image' as 'video' | 'image'
            }
        })
    }

    // Extract unique colors from inventory, fallback to products.color
    const inventoryColors = product.product_inventory?.map((i: any) => i.color).filter(Boolean) || []
    let localColors = inventoryColors.length > 0
        ? [...new Set(inventoryColors)] as string[]
        : (product.color ? [product.color] : [])

    // Merge with Sibling Variants (other products with same name)
    // Create a map of Color -> Product ID
    const variantMap: Record<string, string> = {}

    // 1. Current product colors -> current ID
    localColors.forEach(c => {
        variantMap[c.toLowerCase()] = product.id
    })

    // 2. Sibling variants -> sibling ID
    siblingVariants.forEach((v: any) => {
        if (v.color) {
            variantMap[v.color.toLowerCase()] = v.id
            if (!localColors.includes(v.color)) {
                localColors.push(v.color)
            }
        }
    })

    // Sort valid colors (optional, maybe put selected first or alphabetical?)
    const allColors = [...new Set(localColors)].sort()

    // Calculate review stats
    const avgRating = reviews.length > 0
        ? reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length
        : 0
    const reviewCount = reviews.length

    // JSON-LD Structured Data for Google
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Product',
                name: product.name,
                image: media.map((m: any) => m.url),
                description: product.description,
                brand: {
                    '@type': 'Brand',
                    name: product.brand || 'FitMirror'
                },
                offers: {
                    '@type': 'Offer',
                    url: `https://fitmirror.in/product/${product.id}`,
                    priceCurrency: 'INR',
                    price: product.price,
                    availability: (product.stock && product.stock > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                    itemCondition: 'https://schema.org/NewCondition'
                },
                aggregateRating: reviewCount > 0 ? {
                    '@type': 'AggregateRating',
                    ratingValue: avgRating.toFixed(1),
                    reviewCount: reviewCount
                } : undefined
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: 'Home',
                        item: 'https://fitmirror.in'
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: 'Shop',
                        item: 'https://fitmirror.in/shop'
                    },
                    ...(product.category ? [{
                        '@type': 'ListItem',
                        position: 3,
                        name: product.category,
                        item: `https://fitmirror.in/shop?category=${product.category.toLowerCase()}`
                    }] : [])
                ]
            }
        ]
    }



    // ...

    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* Analytics Tracker */}
            <ProductViewTracker product={product} />

            {/* Personalization Tracker */}
            <TrackProductView
                productId={product.id}
                category={product.category || 'other'}
                color={product.color}
                price={product.price}
            />

            {/* Breadcrumbs */}
            <div className="border-b bg-white">
                <div className="max-w-[1920px] mx-auto px-4 md:px-8 py-3">
                    <nav className="flex items-center text-xs uppercase tracking-wider text-muted-foreground space-x-2">
                        <a href="/" className="hover:text-black transition-colors">Home</a>
                        <span>/</span>
                        <a href="/shop" className="hover:text-black transition-colors">Shop</a>
                        {product.gender && (
                            <>
                                <span>/</span>
                                <a href={`/shop?gender=${product.gender.toLowerCase()}`} className="hover:text-black transition-colors capitalize">{product.gender}</a>
                            </>
                        )}
                        {product.category && (
                            <>
                                <span>/</span>
                                <a href={`/shop?category=${product.category.toLowerCase()}`} className="hover:text-black transition-colors capitalize">{product.category}</a>
                            </>
                        )}
                        <span>/</span>
                        <span className="text-black font-medium truncate max-w-[150px] md:max-w-none">{product.name}</span>
                    </nav>
                </div>
            </div>

            <div className="max-w-[1920px] mx-auto px-4 md:px-8 py-6 md:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                    {/* Left: Gallery */}
                    <div className="w-full">
                        <ProductGallery media={media} productName={product.name} />

                        {/* Desktop Description/Info (Moved here) */}
                        <div className="hidden lg:block mt-10">
                            <ProductInfo product={product} />
                        </div>
                    </div>

                    {/* Right: Product Details */}
                    <ProductDetailsClient
                        product={product}
                        colors={allColors}
                        variantMap={variantMap}
                        avgRating={avgRating}
                        reviewCount={reviewCount}
                        coupons={coupons}
                    />

                    {/* Mobile Description/Info (Visible only on mobile) */}
                    <div className="lg:hidden mt-8">
                        <ProductInfo product={product} />
                    </div>
                </div>


                {/* Complete the Look */}
                <section className="mt-16 md:mt-24">
                    <CompleteTheLook productId={product.id} />
                </section>

                {/* Personalized: Because You Viewed */}
                <section className="mt-16 md:mt-24">
                    <BecauseYouViewed productId={product.id} />
                </section>

                {/* Tabbed Recommendations (Similar / Complete Look / AI Picks) */}
                {relatedProducts.length > 0 && (
                    <section className="mt-12 md:mt-20">
                        <TabbedRecommendations
                            products={relatedProducts.map((p: any) => ({
                                ...p,
                                id: p.product_id || p.id,
                                name: p.title || p.name,
                                images: p.images || (p.image ? [p.image] : []),
                            }))}
                            currentProductId={product.id}
                        />
                    </section>
                )}

                {/* Reviews Section */}
                <section className="mt-20 md:mt-32 pb-20">
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                        <h2 className="text-2xl md:text-3xl font-serif">Customer Reviews</h2>
                        <div className="flex items-center gap-2">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg key={star} className={`h-5 w-5 ${star <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <span className="text-sm text-gray-600">{avgRating.toFixed(1)} ({reviewCount} reviews)</span>
                        </div>
                    </div>
                    <ReviewList
                        productId={product.id}
                        productName={product.name}
                        productImage={product.image}
                        reviews={reviews}
                    />
                </section>
            </div>
        </div>
    )
}
