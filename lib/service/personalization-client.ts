import { ProductViewEvent } from './personalization/types'

/**
 * Client-side helper to track views
 */
export async function trackViewClient(event: ProductViewEvent): Promise<void> {
    try {
        await fetch('/api/personalization/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'view', ...event })
        })
    } catch (error) {
        // Silent fail - tracking shouldn't break UX
        console.debug('Track failed:', error)
    }
}
