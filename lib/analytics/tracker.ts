import { createClient } from '@/lib/supabase/client'

export type AnalyticsEventType = 'view_item' | 'add_to_cart' | 'purchase' | 'quick_view'

interface TrackEventParams {
    eventType: AnalyticsEventType
    offerId?: string
    sellerId?: string
    productId?: string
    metadata?: Record<string, any>
}

export async function trackEvent({ eventType, offerId, sellerId, productId, metadata }: TrackEventParams) {
    try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user?.id

        supabase
            .from('analytics_events')
            .insert({
                event_type: eventType,
                offer_id: offerId,
                seller_id: sellerId,
                product_id: productId,
                user_id: userId,
                metadata: metadata || {}
            })
            .then(({ error }) => {
                if (error) console.error("Analytics Error:", error.message, error)
            })

        
    } catch (e) {
        console.error("Failed to track event", e)
    }
}
