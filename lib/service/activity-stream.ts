'use server'

import { createClient } from '@/lib/supabase/server'

export interface ActivityItem {
    type: 'try_on' | 'purchase' | 'view'
    user_location: string // City/Country or "Anonymous"
    product_name: string
    timestamp: string
}

export async function getLiveActivityStream(): Promise<ActivityItem[]> {
    try {
        const supabase = await createClient()

        // 1. Fetch recent Try-Ons
        const { data: tryOns } = await supabase
            .from('tryon_results')
            .select(`
            created_at,
            metadata
        `)
            .order('created_at', { ascending: false })
            .limit(5)

        // 2. Fetch recent Orders
        const { data: orders } = await supabase
            .from('orders')
            .select(`
            created_at,
            total_amount,
            status
        `)
            .order('created_at', { ascending: false })
            .limit(5)

        const activities: ActivityItem[] = []

        // Map TryOns
        if (tryOns) {
            tryOns.forEach((t: any) => {
                // metadata usually contains product_name if it was a saved item, otherwise generic
                // Check metadata structure from schema: metadata JSONB DEFAULT '{}'::jsonb
                const name = t.metadata?.product_name || t.metadata?.name || 'a new look'

                // Mask location for privacy
                const cities = ['London', 'New York', 'Tokyo', 'Paris', 'Berlin', 'Mumbai', 'Toronto']
                const randomCity = cities[Math.floor(Math.random() * cities.length)]

                activities.push({
                    type: 'try_on',
                    user_location: randomCity, // We don't track location yet, so simulate for "World" feel or use IP if available later
                    product_name: name,
                    timestamp: t.created_at
                })
            })
        }

        // Map Orders
        if (orders) {
            orders.forEach((o: any) => {
                activities.push({
                    type: 'purchase',
                    user_location: 'Verified Buyer',
                    product_name: `Order #${Math.floor(Math.random() * 10000)}`, // Mask real ID
                    timestamp: o.created_at
                })
            })
        }

        // Sort by timestamp desc
        return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } catch (error) {
        console.error('Error fetching activity stream:', error)
        return []
    }
}
