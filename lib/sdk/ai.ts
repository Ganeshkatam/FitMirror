import { detectIntent } from '@/lib/search/intent'

export type AssistantActionType = 'SEARCH' | 'STYLE_HELP' | 'NAVIGATE' | 'EXPLAIN' | 'ORDER_TRACKING'

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
    seller_id?: string
    supabase?: any
}

// KNOWLEDGE GRAPH
const FASHION_KNOWLEDGE: Record<string, { advice: string, related: string[] }> = {
    'party': { advice: "Time to shine. For parties, consider a velvet collection piece or a sequin bodycon dress.", related: ['heels', 'clutch'] },
    'wedding': { advice: "Attending a wedding? Opt for elegant florals, a silk saree, or a pastel maxi dress. Refined elegance is key.", related: ['jewelry', 'heels'] },
    'office': { advice: "Professional tailored mode: Try a structured blazer with high-waisted trousers or a pencil skirt.", related: ['blazer', 'trousers'] },
    'date': { advice: "Planning a dinner or date night? A satin slip dress or a chic off-shoulder top is classic and flattering.", related: ['dress', 'skirt'] },
    'vacation': { advice: "Vacation ready: Pack breathable linens, flowing maxi dresses, and comfortable sandals.", related: ['hat', 'sandals'] },
    'gym': { advice: "Active performance: Look for high-compression leggings and moisture-wicking racerback tops.", related: ['leggings', 'sports bra'] },
    'brunch': { advice: "Casual daytime outing: A floral sundress or white denim with a tailored crop top creates a timeless look.", related: ['sundress', 'sunglasses'] },
    'festival': { advice: "Festival style: Consider boho-chic elements like structured denim and comfortable leather boots.", related: ['shorts', 'boots'] },
    'interview': { advice: "First impressions count: A tailored navy or dark charcoal suit or dress provides a polished, professional silhouette.", related: ['blazer', 'formal shoes'] },
    'summer': { advice: "Stay comfortable in heat: Lightweight cottons, breathable linens, and soft neutral tones work best.", related: ['shorts', 'dress'] },
    'winter': { advice: "Cold-weather layering: Layer a chunky knit sweater over a collared shirt, paired with wool trousers.", related: ['jacket', 'sweater'] },
}

const COLOR_MATRIX: Record<string, string> = {
    'red': "Red matches cleanly with black, white, or deep denim. For a high-contrast style, pair red with soft blush.",
    'blue': "Blue is a versatile neutral. Pair it with beige, white, mustard yellow, or deep emerald tones.",
    'green': "Green complements earth tones: beige, brown, and cream. Or pair with crisp white for clean contrast.",
    'black': "Black pairs universally across all palettes. Add contrast with vibrant monochrome accents or clean metallics.",
    'white': "White offers a crisp, clean base that highlights textures and accent shades. Works seamlessly with warm neutrals.",
    'yellow': "Yellow brings warmth and energy. Ground it with grey, charcoal, or deep navy.",
    'pink': "Pink pairs smoothly with grey, white, camel, or burgundy for a cohesive monochrome look."
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
                return { type: 'ACTION', action: 'NAVIGATE', payload: { url: '/login' }, reply: "Please sign in to your account so I can verify your order details." }
            }
        }

        // 2. Navigation
        const navResponse = this.checkNavigation(msg)
        if (navResponse) return navResponse

        // 3. Advanced Search (Fully DB Aware)
        const searchIntent = detectIntent(msg)
        if (this.isSearchIntent(msg, searchIntent)) {
            return await this.handleSearch(msg, searchIntent, supabase)
        }

        // 4. Expert Styling Advice (Enhanced with Personalization)
        for (const [key, data] of Object.entries(FASHION_KNOWLEDGE)) {
            if (msg.includes(key)) {
                let products: any[] = []
                try {
                    const { StorefrontService } = await import('@/lib/service/storefront')

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
                    reply: `${data.advice} \n\n(Tip: Don't forget ${data.related.join(' & ')}.)`,
                    payload: { products }
                }
            }
        }

        // 5. Color Theory
        for (const [color, advice] of Object.entries(COLOR_MATRIX)) {
            if (msg.includes(color) && (msg.includes('match') || msg.includes('wear') || msg.includes('outfit'))) {
                return { type: 'ACTION', action: 'STYLE_HELP', reply: advice }
            }
        }

        return this.getFallbackResponse(msg)
    }

    // --- Private Intelligence Helpers ---

    private isSearchIntent(msg: string, intent: any): boolean {
        return intent.type === 'search' || intent.filters?.category ||
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
                return { type: 'ACTION', action: 'NAVIGATE', payload: { url: '/shop' }, reply: "You have not placed any orders yet. Visit our shop to explore current collections." }
            }

            const latest = orders[0]
            const date = new Date(latest.created_at).toLocaleDateString()
            return {
                type: 'ACTION',
                action: 'ORDER_TRACKING',
                reply: `Your latest order placed on ${date} is currently ${latest.status.toUpperCase()}.`
            }
        } catch (e) {
            return { type: 'ACTION', action: 'EXPLAIN', reply: "Unable to access order records at this time. Please check your account profile." }
        }
    }

    private async handleSearch(msg: string, intent: any, supabase: any): Promise<AssistantResponse> {
        const { StorefrontService } = await import('@/lib/service/storefront')

        let query = msg
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
                reply: `Found ${count} items matching your criteria. Here are the top selections:`
            }
        }

        return {
            type: 'ACTION',
            action: 'EXPLAIN',
            reply: "No direct matches found. Try searching by garment category like dresses, jackets, or trousers."
        }
    }

    private checkNavigation(msg: string): AssistantResponse | null {
        const routes: Record<string, string> = {
            'cart': '/cart', 'checkout': '/cart', 'orders': '/orders', 'home': '/', 'shop': '/shop',
            'profile': '/profile', 'settings': '/settings', 'wishlist': '/wishlist',
            'outfit': '/outfit-builder', 'blog': '/blog'
        }

        for (const [key, path] of Object.entries(routes)) {
            if (msg.includes(key) && (msg.includes('go') || msg.includes('take') || msg.includes('open') || msg.includes('show') || msg.includes('view'))) {
                return { type: 'ACTION', action: 'NAVIGATE', payload: { url: path }, reply: `Navigating to ${key}.` }
            }
        }
        return null
    }

    private getFallbackResponse(msg: string): AssistantResponse {
        if (msg.length < 4) return { type: 'ACTION', action: 'EXPLAIN', reply: "Please provide more details on what styles or garments you are looking for." }
        return {
            type: 'ACTION',
            action: 'EXPLAIN',
            reply: "I am your Style Assistant. You can ask me to track orders, search garments by style, or recommend color pairings."
        }
    }
}
