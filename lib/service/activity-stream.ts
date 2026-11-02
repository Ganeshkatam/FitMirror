'use server'

import { createClient } from '@/lib/supabase/server'

export interface ActivityItem {
    type: 'purchase' | 'view'
    user_location: string
    product_name: string
    timestamp: string
}

export async function getLiveActivityStream(): Promise<ActivityItem[]> {
    try {
        const supabase = await createClient()

        const { data: orders } = await supabase
            .from('orders')
            .select(`
            created_at,
            total_amount,
            status
        `)
            .order('created_at', { ascending: false })
            .limit(10)

        const activities: ActivityItem[] = []

        if (orders) {
            orders.forEach((o: any) => {
                activities.push({
                    type: 'purchase',
                    user_location: 'Verified Buyer',
                    product_name: `Order #${Math.floor(Math.random() * 10000)}`,
                    timestamp: o.created_at
                })
            })
        }

        return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } catch (error) {
        console.error('Error fetching activity stream:', error)
        return []
    }
}
