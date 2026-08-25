import { createClient } from '@/lib/supabase/server'
import { OrderCard } from '@/components/account/order-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { redirect } from 'next/navigation'
import { AccountLayout } from '@/components/account/account-layout'

export const dynamic = 'force-dynamic'

export default async function OrderHistoryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch Orders with Items
    const { data: ordersData } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items(
                id,
                quantity,
                price,
                size,
                product:products(
                    id,
                    name,
                    images
                )
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    // Normalize Data for UI
    const orders = ordersData?.map(o => ({
        id: o.id,
        date: new Date(o.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
        status: o.status,
        total: o.total_amount,
        expected_delivery: "Calculating...",
        items: o.items.map((i: any) => ({
            id: i.id,
            productId: i.product?.id,
            name: i.product?.name || 'Unknown Product',
            image: (i.product?.images && i.product.images.length > 0 ? i.product.images?.[0]?.src : ''),
            price: i.price,
            quantity: i.quantity,
            size: i.size
        }))
    })) || []

    return (
        <AccountLayout title="Your Orders" description="Track, return, or buy things again.">
            <div className="flex justify-end gap-2 mb-4">
                <Button variant="outline" size="sm">Last 30 Days</Button>
                <Button variant="outline" size="sm">2025</Button>
            </div>

            {orders.length > 0 ? (
                <div className="space-y-4">
                    {orders.map((order: any) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border rounded-xl bg-gray-50/50">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
                        <ShoppingBag className="h-7 w-7 text-gray-400" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">No orders yet</h2>
                    <p className="text-sm text-muted-foreground mb-6">Looks like you haven&apos;t started your collection yet.</p>
                    <Link href="/shop">
                        <Button className="rounded-full">Start Shopping</Button>
                    </Link>
                </div>
            )}
        </AccountLayout>
    )
}
