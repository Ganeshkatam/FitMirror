import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { ProductCard } from '@/components/product/product-card'
import { Store, MapPin, Calendar, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ChatWidget } from '@/components/chat/chat-widget'

export const dynamic = 'force-dynamic'

interface Props {
    params: Promise<{
        id: string
    }>
}

export default async function StorePage({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Fetch Store Details
    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .eq('status', 'active') // Only show active stores
        .single()

    if (!store || storeError) {
        notFound()
    }

    // 2. Fetch Store Products
    const { data: products } = await supabase
        .from('products')
        .select(`
            *,
            product_inventory (size, stock)
        `)
        .eq('store_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Store Header Banner */}
            <div className="relative bg-white dark:bg-gray-800 border-b">
                {/* Cover Image */}
                <div
                    className="h-48 md:h-64 w-full bg-gray-200 dark:bg-gray-700 relative overflow-hidden"
                    style={{
                        backgroundImage: store.cover_image ? `url(${store.cover_image})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: !store.cover_image ? (store.brand_color || '#000000') : undefined
                    }}
                >
                    {!store.cover_image && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <Store className="h-24 w-24 text-white" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                <div className="max-w-7xl mx-auto px-4 md:px-8 pb-8">
                    <div className="relative -mt-16 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                        {/* Logo */}
                        <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl bg-white">
                            {store.logo || store.logo_url ? (
                                <Image
                                    src={store.logo || store.logo_url}
                                    alt={store.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center text-white text-4xl font-bold"
                                    style={{ backgroundColor: store.brand_color || '#000' }}
                                >
                                    {store.name.charAt(0)}
                                </div>
                            )}
                        </div>

                        {/* Store Info */}
                        <div className="flex-1 space-y-2 mb-2">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                                {store.name}
                            </h1>
                            <p className="max-w-2xl text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                                {store.bio || store.description || `Welcome to ${store.name}. Discover our latest collection.`}
                            </p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-gray-500 delay-100 pt-2">
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    India
                                </span>
                                {store.created_at && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        Since {new Date(store.created_at).getFullYear()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mb-2">
                            <ChatWidget storeId={store.id} userId={user?.id} />
                            <button
                                className="px-6 py-2 rounded-full font-medium text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                                style={{ backgroundColor: store.brand_color || '#000000' }}
                            >
                                Follow Store
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl md:text-2xl font-bold">All Products</h2>
                    <span className="text-sm text-muted-foreground">
                        Showing {products?.length || 0} results
                    </span>
                </div>

                {products && products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                showTryOn={!!product.tryon_asset_ref}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed">
                        <Store className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No products found</h3>
                        <p className="text-gray-500">This store hasn&apos;t added any products yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
