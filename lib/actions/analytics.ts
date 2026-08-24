'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfDay, subDays, format, parseISO } from 'date-fns'

export interface DailyRevenue {
    date: string
    revenue: number
}

export interface TopProduct {
    name: string
    sales: number
    revenue: number
}

export interface DashboardStats {
    totalRevenue: number
    totalOrders: number
    activeProducts: number
    lowStockProducts: number
}

export async function getDailyRevenue(): Promise<DailyRevenue[]> {
    const supabase = await createClient()
    const today = new Date()
    const thirtyDaysAgo = subDays(today, 30)

    const { data: orders } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .neq('status', 'cancelled')
        .order('created_at', { ascending: true })

    if (!orders) return []

    // Group by date
    const revenueMap = new Map<string, number>()

    // Initialize last 30 days with 0
    for (let i = 0; i <= 30; i++) {
        const d = subDays(today, 30 - i)
        revenueMap.set(format(d, 'yyyy-MM-dd'), 0)
    }

    orders.forEach(order => {
        const dateKey = format(parseISO(order.created_at), 'yyyy-MM-dd')
        const current = revenueMap.get(dateKey) || 0
        revenueMap.set(dateKey, current + order.total_amount)
    })

    // Convert to array
    return Array.from(revenueMap.entries()).map(([date, revenue]) => ({
        date: format(parseISO(date), 'MMM dd'),
        revenue
    }))
}

export async function getTopProducts(): Promise<TopProduct[]> {
    const supabase = await createClient()

    // This is a bit complex in Supabase JS without raw SQL for aggregation
    // We'll fetch order items and aggregate in JS for now (not efficient for scale but fine for MVP)
    const { data: items } = await supabase
        .from('order_items')
        .select(`
        quantity, 
        price, 
        products (
            name
        )
    `)
        // We should filter by recent orders ideally, but let's take all-time for "Top"
        .limit(1000)

    if (!items) return []

    const productMap = new Map<string, { sales: number, revenue: number }>()

    items.forEach(item => {
        // Assert type for joined product which Supabase returns as object or array
        const product = item.products as unknown as { name: string } | null
        const name = product?.name || 'Unknown Product'

        // Check if price exists, fallback to 0
        const price = item.price || 0

        const current = productMap.get(name) || { sales: 0, revenue: 0 }

        productMap.set(name, {
            sales: current.sales + item.quantity,
            revenue: current.revenue + (price * item.quantity)
        })
    })

    return Array.from(productMap.entries())
        .map(([name, stats]) => ({
            name,
            ...stats
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createClient()

    const [
        { count: totalOrders },
        { data: activeProductsData }, // Just count would be nice but need filtering
        { data: lowStockData },
        { data: revenueData }
    ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('product_inventory').select('id', { count: 'exact', head: true }).lt('stock', 5),
        supabase.from('orders').select('total_amount').neq('status', 'cancelled')
    ])

    // Calculate total revenue
    const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0

    return {
        totalRevenue,
        totalOrders: totalOrders || 0,
        activeProducts: activeProductsData?.length || 0, // head:true doesn't return data length in same way for count? 
        // Actually when using count: 'exact', head: true, the response has `count`. `data` is null.
        // Wait, activeProductsData will be null if head: true.
        // Let's fix this in variables result.
        lowStockProducts: lowStockData?.length || 0 // same here
    }
}

// Fixed version of getDashboardStats
export async function getDashboardStatsFixed(): Promise<DashboardStats & { ordersToday: number, pendingOrders: number, totalUsers: number }> {
    const supabase = await createClient()

    const today = startOfDay(new Date()).toISOString()

    // 1. Total Orders
    const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true })

    // 2. Active Products
    const { count: activeProducts } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true)

    // 3. Low Stock 
    const { count: lowStockProducts } = await supabase.from('product_inventory').select('*', { count: 'exact', head: true }).lt('stock', 5)

    // 4. Total Revenue
    const { data: orders } = await supabase.from('orders').select('total_amount').neq('status', 'cancelled')
    const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0

    // 5. Orders Today
    const { count: ordersToday } = await supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today)

    // 6. Pending Orders
    const { count: pendingOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'placed')

    // 7. Total Users (Profiles)
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })

    return {
        totalRevenue,
        totalOrders: totalOrders || 0,
        activeProducts: activeProducts || 0,
        lowStockProducts: lowStockProducts || 0,
        ordersToday: ordersToday || 0,
        pendingOrders: pendingOrders || 0,
        totalUsers: totalUsers || 0
    }
}
