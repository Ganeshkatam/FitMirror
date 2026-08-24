import { createClient } from '@/lib/supabase/client'

export type AnalyticsEventType = 'view_item' | 'add_to_cart' | 'purchase' | 'try_on' | 'ai_chat' | 'quick_view'

interface TrackEventParams {
    eventType: AnalyticsEventType
    storeId: string
    productId?: string
    metadata?: Record<string, any>
}

export async function trackEvent({ eventType, storeId, productId, metadata }: TrackEventParams) {
    try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user?.id

        // 1. Log to Analytics Table (Fire & Forget)
        supabase
            .from('analytics_events')
            .insert({
                event_type: eventType,
                store_id: storeId,
                product_id: productId,
                user_id: userId,
                metadata: metadata || {}
            })
            .then(({ error }) => {
                if (error) console.error("Analytics Error:", error.message, error)
            })

        // 2. Send Signal to Personalization Engine (Fire & Forget)
        if ((eventType === 'view_item' || eventType === 'purchase') && productId && metadata?.category) {
            fetch('/api/personalization/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: eventType === 'view_item' ? 'view' : 'purchase',
                    productId,
                    category: metadata.category,
                    price: metadata.price,
                    color: metadata.color
                })
            }).catch(err => console.error("Personalization Signal Failed", err))
        }
    } catch (e) {
        console.error("Failed to track event", e)
    }
}
