import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DashboardStats } from '@/components/account/dashboard-stats'
import { ArrowRight, Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AccountDashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch Stats
    let orderCount = 0
    let wishlistCount = 0
    let totalSpent = 0
    let styleScore = 10 // Base score

    try {
        const { count, data: orders } = await supabase
            .from('orders')
            .select('total_amount', { count: 'exact', head: false })
            .eq('user_id', user.id)

        orderCount = count || 0
        totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    } catch (e) { /* ignore */ }

    try {
        const { count } = await supabase
            .from('wishlists')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
        wishlistCount = count || 0
    } catch (e) { /* ignore */ }

    // Calculate Points (1 point per currency unit)
    const points = Math.floor(totalSpent)

    // Calculate Style Score
    try {
        // Dynamically import to avoid build issues if service is server-only
        const { PersonalizationService } = await import('@/lib/service/personalization')
        const styleProfile = await PersonalizationService.getStyleProfile(user.id)

        if (styleProfile) {
            if (Object.keys(styleProfile.styleVector || {}).length > 0) styleScore += 40
            if (styleProfile.preferredCategories?.length > 0) styleScore += 25
            if (styleProfile.preferredColors?.length > 0) styleScore += 25
        }
    } catch (e) {
        console.error('Failed to fetch style profile', e)
    }

    // Fetch Recent Order
    let recentOrder = null
    try {
        const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        recentOrder = data
    } catch (e) { /* ignore */ }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-xl font-bold font-serif">Hello, {user.email?.split('@')[0]}</h2>
                <Link href="/shop">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">Continue Shopping</Button>
                </Link>
            </div>

            {/* Stats Overview */}
            <DashboardStats
                orderCount={orderCount}
                wishlistCount={wishlistCount}
                points={points}
                styleScore={styleScore}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Order Tile */}
                <Card className="border-gray-100 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <Package className="h-5 w-5 text-indigo-500" /> Recent Order
                            </h3>
                            <Link href="/account/orders" className="text-sm text-indigo-600 hover:underline">
                                View All
                            </Link>
                        </div>

                        {recentOrder ? (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-gray-900">Order #{recentOrder.id.slice(0, 8)}</span>
                                    <span className="text-sm text-gray-500">
                                        {new Date(recentOrder.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium capitalize">
                                        {recentOrder.status || 'Processing'}
                                    </span>
                                    <span className="font-bold">
                                        ₹{(recentOrder.total_amount || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <p className="text-gray-500 mb-2">No active orders</p>
                                <Link href="/shop">
                                    <Button variant="link" className="text-indigo-600 p-0 h-auto">
                                        Start Shopping &rarr;
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Integration Promo */}
                <div className="rounded-xl bg-gradient-to-br from-indigo-900 to-violet-900 p-6 text-white relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                    <h3 className="font-bold text-xl mb-2 relative z-10">Complete Your Style Profile</h3>
                    <p className="text-indigo-100 text-sm mb-6 relative z-10">
                        Get personalized recommendations and unlock virtual try-on features.
                    </p>
                    <Link href="/account/settings" className="relative z-10">
                        <Button className="bg-white text-indigo-900 hover:bg-gray-100 border-0 w-full sm:w-auto">
                            Update Profile <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
