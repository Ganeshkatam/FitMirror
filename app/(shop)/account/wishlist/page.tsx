import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingBag } from 'lucide-react'
import { ProductCard } from '@/components/product/product-card'
import { ShareWishlistDialog } from '@/components/wishlist/share-wishlist-dialog'
import { PriceAlertButton } from '@/components/wishlist/price-alert-button'
import { AccountLayout } from '@/components/account/account-layout'

export const dynamic = 'force-dynamic'

export default async function WishlistPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: wishlistItems } = await supabase
        .from('wishlists')
        .select(`
            id,
            product_id,
            products (
                *,
                product_inventory (
                    size,
                    stock
                )
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    const validItems = wishlistItems?.filter(item => item.products) || []

    return (
        <AccountLayout title="My Wishlist" description={`${validItems.length} ${validItems.length === 1 ? 'item' : 'items'} saved for later`}>
            <div className="flex justify-end mb-4">
                {validItems.length > 0 && <ShareWishlistDialog />}
            </div>

            {validItems.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-xl bg-gray-50/50">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="h-7 w-7 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Your wishlist is empty</h3>
                    <p className="text-muted-foreground mt-1 mb-6 max-w-sm mx-auto">
                        Heart items while you shop to save them here for later.
                    </p>
                    <Button asChild>
                        <Link href="/shop">Start Shopping</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {validItems.map((item: any) => (
                        <div key={item.id} className="h-full relative group">
                            <ProductCard
                                product={item.products}
                                showTryOn={true}
                            />
                            <PriceAlertButton
                                productId={item.products.id}
                                currentPrice={item.products.price}
                            />
                        </div>
                    ))}
                </div>
            )}
        </AccountLayout>
    )
}
