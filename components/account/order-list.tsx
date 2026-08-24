import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, ChevronRight } from 'lucide-react'
import Image from 'next/image'

export async function OrderList() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Updated Query: Fetch product name AND image
    const { data: orders } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                *,
                products (
                    name,
                    image
                )
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
        placed: { bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-700 dark:text-amber-400', icon: '📦' },
        confirmed: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-700 dark:text-blue-400', icon: '✓' },
        shipped: { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-700 dark:text-purple-400', icon: '🚚' },
        delivered: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-700 dark:text-green-400', icon: '✨' },
        cancelled: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-700 dark:text-red-400', icon: '✗' },
    }

    if (!orders || orders.length === 0) {
        return (
            <Card className="overflow-hidden border-dashed border-2 bg-muted/20">
                <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">No particular orders yet</p>
                    <Link href="/shop">
                        <Button variant="outline" className="rounded-full">Start Shopping</Button>
                    </Link>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="overflow-hidden border border-border/50 shadow-sm bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <CardHeader className="border-b bg-muted/20 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Recent Orders</CardTitle>
                    </div>
                    <Link href="/account/orders">
                        <Button variant="ghost" size="sm" className="text-xs h-8">
                            View All
                            <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                    {orders.slice(0, 3).map((order) => (
                        <div key={order.id} className="p-4 hover:bg-muted/30 transition-colors group">
                            <div className="flex items-start gap-4">
                                {/* Product Thumbnails (Stacked) */}
                                <div className="flex -space-x-3 overflow-hidden py-1 pl-1">
                                    {order.order_items?.slice(0, 3).map((item: any, idx: number) => (
                                        <div key={idx} className="relative w-12 h-12 rounded-lg border-2 border-background overflow-hidden bg-muted shadow-sm">
                                            {item.products?.image ? (
                                                <Image
                                                    src={item.products.image}
                                                    alt={item.products.name || 'Product'}
                                                    className="object-cover"
                                                    fill
                                                    sizes="48px"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs bg-secondary">
                                                    🛍️
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {(order.order_items?.length || 0) > 3 && (
                                        <div className="w-12 h-12 rounded-lg border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground z-10">
                                            +{order.order_items.length - 3}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <Badge className={`h-5 text-[10px] px-1.5 ${statusConfig[order.status]?.bg} ${statusConfig[order.status]?.text} hover:bg-opacity-80 border-0`}>
                                            {order.status}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium truncate text-foreground/90">
                                        {order.order_items?.map((item: any) => item.products?.name).filter(Boolean).join(', ') || 'Order Details'}
                                    </p>
                                    <p className="text-xs font-semibold mt-1">
                                        ₹{order.total_amount?.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <Link href={`/order/${order.id}`}>
                                    <Button variant="outline" size="sm" className="h-8 rounded-full">
                                        Track
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
