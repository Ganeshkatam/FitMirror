import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductCard } from '@/components/product/product-card'
import { Heart, Lock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Database } from '@/lib/database.types'

type Product = Database['public']['Tables']['products']['Row'] & {
    product_inventory?: { size: string; stock: number }[]
}

export default async function PublicWishlistPage({
    params
}: {
    params: Promise<{ code: string }>
}) {
    const { code } = await params
    const supabase = await createClient()

    // Find the share
    const { data: share, error } = await supabase
        .from('wishlist_shares')
        .select('user_id, is_public, name')
        .eq('share_code', code)
        .single()

    if (error || !share) {
        notFound()
    }

    if (!share.is_public) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-3 md:px-4">
                <div className="text-center max-w-md">
                    <div className="h-14 w-14 md:h-20 md:w-20 mx-auto mb-4 md:mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Lock className="h-7 w-7 md:h-10 md:w-10 text-amber-600" />
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold mb-1.5 md:mb-2">Private Wishlist</h1>
                    <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
                        This wishlist is currently set to private by its owner.
                    </p>
                    <Link href="/shop">
                        <Button className="h-10 md:h-11 text-sm">
                            <ArrowLeft className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                            Browse Shop
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    // Fetch the wishlist items
    const { data: wishlistItems } = await supabase
        .from('wishlists')
        .select(`
            product_id, 
            products(
                *,
                product_inventory (
                    size,
                    stock
                )
            )
        `)
        .eq('user_id', share.user_id)
        .order('created_at', { ascending: false })

    const products = (wishlistItems as unknown as { products: Product }[])
        ?.map(item => item.products)
        .filter(Boolean) as Product[] || []

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 dark:from-pink-950/20 dark:via-rose-950/20 dark:to-red-950/20 border-b">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(244,114,182,0.1),transparent_50%)]" />
                <div className="container px-3 md:px-6 py-4 md:py-12 relative">
                    <div className="flex items-center gap-2 md:gap-4">
                        <Link href="/shop">
                            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                            </Button>
                        </Link>

                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-pink-400/30 rounded-lg md:rounded-xl blur-lg" />
                                <div className="relative p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg">
                                    <Heart className="h-4 w-4 md:h-6 md:w-6" fill="currentColor" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl md:text-4xl font-serif font-bold tracking-tight">
                                    {share.name || 'Shared Wishlist'}
                                </h1>
                                <p className="text-xs md:text-base text-muted-foreground mt-0.5 md:mt-1">
                                    {products.length} {products.length === 1 ? 'item' : 'items'} curated with love
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products */}
            <div className="container px-3 md:px-6 py-4 md:py-12">
                {products.length === 0 ? (
                    <div className="text-center py-8 md:py-12">
                        <p className="text-sm md:text-base text-muted-foreground">This wishlist is empty.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2 md:gap-6">
                        {products.map((product, index) => (
                            <div
                                key={product.id}
                                className="animate-fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <ProductCard product={product} showTryOn={true} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
