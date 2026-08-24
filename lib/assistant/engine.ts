// --- Types ---

export type IntentType =
    | 'NAVIGATE'
    | 'SEARCH'
    | 'ACTION' // e.g. "Toggle Theme", "Add to Cart"
    | 'STYLE_ADVICE'
    | 'chat'   // Fallback

export interface Intent {
    type: IntentType
    confidence: number
    payload: any // Dynamic based on type
    originalQuery: string
}

export interface Skill {
    id: string
    name: string
    description: string
    canHandle: (intent: Intent) => boolean
    execute: (intent: Intent, context: any) => Promise<SkillResult>
}

export interface SkillResult {
    success: boolean
    message?: string
    action?: () => void // UI Action to run (e.g. router.push)
    data?: any
}

// --- Intent Router ---
// Rule-Based Router for Storefront Assistant

export function detectIntent(query: string): Intent {
    const q = query.toLowerCase().trim()

    // 1. Navigation Rules
    if (q.startsWith('go to') || q.startsWith('open') || q.includes('page')) {
        let target = '/'
        if (q.includes('wishlist')) target = '/account/wishlist'
        if (q.includes('cart')) target = '/cart'
        if (q.includes('orders')) target = '/account/orders'
        if (q.includes('settings')) target = '/account/settings'
        if (q.includes('closet')) target = '/account/closet'
        if (q.includes('try-on') || q.includes('tryon')) target = '/try-on'

        return {
            type: 'NAVIGATE',
            confidence: 0.9,
            payload: { target },
            originalQuery: query
        }
    }

    // 2. Action Rules
    if (q.includes('dark mode') || q.includes('light mode') || q.includes('theme')) {
        return {
            type: 'ACTION',
            confidence: 0.95,
            payload: {
                action: 'SET_THEME',
                value: q.includes('dark') ? 'dark' : 'light'
            },
            originalQuery: query
        }
    }

    // 3. Style/Advice Rules
    const styleKeywords = ['wear', 'outfit', 'style', 'match', 'recommend', 'suggestion', 'look', 'fashion', 'trend', 'advice']
    if (styleKeywords.some(k => q.includes(k))) {
        return {
            type: 'STYLE_ADVICE',
            confidence: 0.85,
            payload: { query },
            originalQuery: query
        }
    }

    // 4. Help & Support
    if (q.includes('help') || q.includes('support') || q.includes('return') || q.includes('contact')) {
        return {
            type: 'NAVIGATE',
            confidence: 0.9,
            payload: { target: '/contact' },
            originalQuery: query
        }
    }

    // 5. Search Fallback (Default)
    return {
        type: 'SEARCH',
        confidence: 0.8,
        payload: { query },
        originalQuery: query
    }
}
