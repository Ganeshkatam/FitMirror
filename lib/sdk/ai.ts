import { detectIntent } from '@/lib/search/intent'

export type AssistantActionType = 'SEARCH' | 'TRY_ON' | 'STYLE_HELP' | 'NAVIGATE' | 'EXPLAIN' | 'ORDER_TRACKING'

export interface AssistantResponse {
    type: 'ACTION'
    action: AssistantActionType
    payload?: any
    reply: string
}

export interface AssistantContext {
    page?: string
    user_context?: {
        userId?: string
        size?: string
        gender?: string
        has_avatar?: boolean
        location?: string
    }
    store_id?: string
    supabase?: any
}

// 10x KNOWLEDGE GRAPH
const FASHION_KNOWLEDGE: Record<string, { advice: string, related: string[] }> = {
    'party': { advice: "Time to shine! ✨ For parties, I love our Midnight Velvet collection or a sequin bodycon dress.", related: ['heels', 'clutch'] },
    'wedding': { advice: "Wedding guest? 💍 Go for elegant florals, a silk saree, or a pastel maxi dress. Classy is key.", related: ['jewelry', 'heels'] },
    'office': { advice: "Power dressing mode: ON. 💼 Try a structured blazer with high-waisted trousers or a pencil skirt.", related: ['blazer', 'trousers'] },
    'date': { advice: "Ooh, date night? ❤️ A satin slip dress or a chic off-shoulder top is perfect. Keep it romantic!", related: ['dress', 'skirt'] },
    'vacation': { advice: "Vacay vibes! ✈️ Pack breezy linens, maxi dresses, and comfortable sandals. Don't forget a hat!", related: ['hat', 'sandals'] },
    'gym': { advice: "Crushing goals? 🏋️‍♀️ Look for high-compression leggings and moisture-wicking racerback tops.", related: ['leggings', 'sports bra'] },
    'brunch': { advice: "Sunday funday! 🥂 A floral sundress or white denim with a cute crop top is the ultimate brunch look.", related: ['sundress', 'sunglasses'] },
    'festival': { advice: "Festival season! 🎡 Think boho-chic: fringe, denim shorts, and boots. Go wild with accessories!", related: ['shorts', 'boots'] },
    'interview': { advice: "First impressions count. 🤝 A navy or black suit/dress is professional and timeless.", related: ['blazer', 'formal shoes'] },
    'summer': { advice: "Stay cool! ☀️ Light cottons, linens, and whites are your best friends right now.", related: ['shorts', 'dress'] },
    'winter': { advice: "Cozy up! ❄️ Layer a chunky knit sweater over a collar shirt, paired with wool trousers.", related: ['jacket', 'sweater'] },
}

const COLOR_MATRIX: Record<string, string> = {
    'red': "Red matches beautifully with Black, White, or Denim. For a bold look, try Red + Pink! ❤️🩷",
    'blue': "Blue is a neutral! Pair it with Beige, White, Mustard Yellow, or even Emerald Green. 💙💛",
    'green': "Green loves Earth tones: Beige, Brown, Cream. Or go fresh with White! 💚🤎",
    'black': "Black is the universal donor. It goes with EVERYTHING. Try Neon for a pop! 🖤💚",
    'white': "White is clean and crisp. It makes any other color pop. Try White + Metallics! 🤍✨",
    'yellow': "Yellow is sunshine! Tone it down with Grey or Navy, or go bright with Purple. 💛💜",
    'pink': "Pink pairs sweetly with Grey, White, or Red for a monochrome moment. 🩷🤍"
}

export class FitMirrorAI {
    private static instance: FitMirrorAI

    private constructor() { }

    public static getInstance(): FitMirrorAI {
        if (!FitMirrorAI.instance) {
            FitMirrorAI.instance = new FitMirrorAI()
        }
        return FitMirrorAI.instance
    }

    public async resolve(message: string, context: AssistantContext): Promise<AssistantResponse> {
        const msg = message.toLowerCase()
        const supabase = context.supabase

        // 1. Order Tracking (DB Aware)
        if (supabase && (msg.includes('order') || msg.includes('tracking') || msg.includes('delivery'))) {
            if (context.user_context?.userId) {
                return await this.handleOrderTracking(context.user_context.userId, supabase)
            } else {
                return { type: 'ACTION', action: 'NAVIGATE', payload: { url: '/login' }, reply: "I can check your orders, but I need you to login first! 🔐" }
            }
        }

        // 2. Navigation
        const navResponse = this.checkNavigation(msg)
        if (navResponse) return navResponse

        // 3. Try-On Intent
        if (msg.includes('try') || msg.includes('wear') || msg.includes('mirror') || msg.includes('fitting')) {
            if (context.page?.includes('product')) {
                return { type: 'ACTION', action: 'TRY_ON', reply: "Initializing Magic Mirror... ✨ Let's see you in this!" }
            }
            return { type: 'ACTION', action: 'NAVIGATE', payload: { url: '/try-on' }, reply: "Opening the Virtual Studio so you can mix & match! 👗" }
        }

        // 4. Advanced Search (Fully DB Aware)
        const searchIntent = detectIntent(msg)
        if (this.isSearchIntent(msg, searchIntent)) {
            return await this.handleSearch(msg, searchIntent, supabase)
        }

        // 5. Expert Styling Advice (Enhanced with Personalization)
        for (const [key, data] of Object.entries(FASHION_KNOWLEDGE)) {
            if (msg.includes(key)) {
                let products: any[] = []
                try {
                    const { StorefrontService } = await import('@/lib/service/storefront')

                    // Search for products related to the occasion + advice
                    // e.g. "wedding" -> keywords from advice like "floral", "saree", "maxi"
                    // For now, let's just search for the occasion/related terms
                    const queryV2 = `${key} ${data.related.join(' ')}`

                    const { results } = await StorefrontService.searchProducts({
                        query: queryV2,
                        sort: 'recommended'
                    })
                    products = results.slice(0, 4)
                } catch (e) {
                    console.error("Failed to search styling products", e)
                }

                return {
                    type: 'ACTION',
                    action: 'STYLE_HELP',
                    reply: `${data.advice} \n\n(Tip: Don't forget ${data.related.join(' & ')}!)`,
                    payload: { products }
                }
            }
        }

        // 6. Color Theory
        for (const [color, advice] of Object.entries(COLOR_MATRIX)) {
            if (msg.includes(color) && (msg.includes('match') || msg.includes('wear') || msg.includes('outfit'))) {
                return { type: 'ACTION', action: 'STYLE_HELP', reply: advice }
            }
        }

        return this.getFallbackResponse(msg)
    }

    // --- Private Intelligence Helpers ---

    private isSearchIntent(msg: string, intent: any): boolean {
        return intent.type === 'search' || intent.filters.category ||
            ['buy', 'show', 'find', 'get', 'need', 'looking for', 'have', 'stock'].some(v => msg.includes(v))
    }

    private async handleOrderTracking(userId: string, supabase: any): Promise<AssistantResponse> {
        try {
            const { data: orders, error } = await supabase
                .from('orders')
                .select('status, total_amount, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)

            if (error || !orders || orders.length === 0) {
                return { type: 'ACTION', action: 'NAVIGATE', payload: { url: '/shop' }, reply: "You haven't placed any orders yet. Time to go shopping! 🛍️" }
            }

            const latest = orders[0]
            const date = new Date(latest.created_at).toLocaleDateString()
            return {
                type: 'ACTION',
                action: 'ORDER_TRACKING',
                reply: `Your latest order (placed on ${date}) is currently **${latest.status.toUpperCase()}**. 🚚`
            }
        } catch (e) {
            return { type: 'ACTION', action: 'EXPLAIN', reply: "I'm having trouble accessing the order database right now. Please check your profile page." }
        }
    }

    private async handleSearch(msg: string, intent: any, supabase: any): Promise<AssistantResponse> {
        const { StorefrontService } = await import('@/lib/service/storefront')

        let query = msg
        // Remove common trigger words for cleaner search
        const triggers = ['show me', 'find', 'looking for', 'i need', 'buy', 'get']
        triggers.forEach(t => query = query.replace(t, ''))
        query = query.trim()

        const { results, meta } = await StorefrontService.searchProducts({
            query: query,
            filters: intent.filters
        })

        const count = (meta as any)?.total_candidates || results.length

        if (count > 0) {
            return {
                type: 'ACTION',
                action: 'SEARCH',
                payload: { query: msg, products: results.slice(0, 5) },
                reply: `I found ${count} items match your search. Here are the top picks! 👇`
            }
        }

        return {
            type: 'ACTION',
            action: 'EXPLAIN', // Fallback to explain if no results
            reply: "I couldn't find anything matching that exactly. Try searching for 'summer dresses' or 'casual shirts'."
        }
    }

    private checkNavigation(msg: string): AssistantResponse | null {
        const routes: Record<string, string> = {
            'cart': '/cart', 'checkout': '/cart', 'orders': '/orders', 'home': '/', 'shop': '/shop',
            'profile': '/profile', 'settings': '/settings', 'wishlist': '/wishlist', 'try-on': '/try-on',
            'outfit': '/outfit-builder', 'blog': '/blog'
        }

        for (const [key, path] of Object.entries(routes)) {
            if (msg.includes(key) && (msg.includes('go') || msg.includes('take') || msg.includes('open') || msg.includes('show') || msg.includes('view'))) {
                return { type: 'ACTION', action: 'NAVIGATE', payload: { url: path }, reply: `Navigating to ${key}... 🚀` }
            }
        }
        return null
    }

    private getFallbackResponse(msg: string): AssistantResponse {
        if (msg.length < 4) return { type: 'ACTION', action: 'EXPLAIN', reply: "Tell me more! What are you looking for? 🤔" }
        return {
            type: 'ACTION',
            action: 'EXPLAIN',
            reply: "I'm your Smart Stylist! 🤖 Ask me to:\n- Track your order 🚚\n- Find slim fit shirts 👕\n- Suggest a wedding outfit 💍"
        }
    }
}

function listContains(str: string, list: string[]): boolean {
    return list.some(item => str.includes(item))
}
