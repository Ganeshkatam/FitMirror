import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function WishlistPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch wishlist with product details - use error object, not try-catch
    const { data: wishlistItems, error } = await supabase
        .from('wishlists')
        .select('*, products(id, name, price, image, brand)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    // Safe fallback if error or null
    const items = wishlistItems || []

    return (
        <div className="container max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/profile">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-serif font-bold">My Wishlist</h1>
                    <p className="text-muted-foreground">{items.length} items saved</p>
                </div>
            </div>

            {items.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
                    <p className="text-muted-foreground mb-6">
                        Save items you love by clicking the heart icon on products.
                    </p>
                    <Link href="/shop">
                        <Button className="inline-flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            Start Shopping
                        </Button>
                    </Link>
                </Card>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <Card key={item.id} className="group overflow-hidden">
                            <div className="relative aspect-[3/4] bg-gray-100">
                                <Image
                                    src={item.products?.image || '/placeholder.jpg'}
                                    alt={item.products?.name || 'Product'}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors">
                                    <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                                </button>
                            </div>
                            <CardContent className="p-3">
                                <p className="text-xs text-muted-foreground">{item.products?.brand}</p>
                                <h3 className="font-medium text-sm truncate">{item.products?.name}</h3>
                                <p className="font-bold mt-1">₹{item.products?.price?.toLocaleString()}</p>
                                <Button size="sm" className="w-full mt-2" asChild>
                                    <Link href={`/product/${item.products?.id}`}>
                                        View Product
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
