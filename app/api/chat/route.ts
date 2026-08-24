import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { detectIntent, getPromptForIntent, PROMPT_VERSION } from '@/lib/prompts/ai-stylist.v1'
import { checkRateLimit, getRateLimitMessage } from '@/lib/rate-limiter'

export const maxDuration = 30

interface Product {
    id: string
    name: string
    price: number
    category: string
    image_url: string | null
    description: string | null
}



export async function POST(req: Request) {
    try {
        const { messages, sessionId, cartItems } = await req.json()

        // Rate limiting
        const clientId = sessionId || req.headers.get('x-forwarded-for') || 'anonymous'
        const rateLimit = checkRateLimit(clientId)

        if (!rateLimit.allowed) {
            return NextResponse.json({
                id: crypto.randomUUID(),
                role: 'assistant',
                content: getRateLimitMessage(rateLimit.resetIn),
            })
        }

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
        if (!apiKey) {
            return NextResponse.json({
                id: crypto.randomUUID(),
                role: 'assistant',
                content: "I'm having a little trouble right now, but you can still explore our collections! 💕",
            })
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

        const supabase = await createClient()

        // ---------------------------------------------------------
        // 1. GATHER CONTEXT
        // ---------------------------------------------------------

        // A. User Identity & History
        const { data: { user } } = await supabase.auth.getUser()
        let userName = 'Friend'
        let orderHistoryContext = ''

        if (user) {
            // Get Name
            userName = user.user_metadata?.full_name?.split(' ')[0] || 'Friend'

            // Get last 5 orders for style context
            const { data: orders } = await supabase
                .from('orders')
                .select(`
                    created_at,
                    order_items (
                        products (name, category)
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)

            if (orders && orders.length > 0) {
                const pastItems = orders.flatMap(o =>
                    o.order_items.map((i: any) => i.products?.name)
                ).filter(Boolean).join(', ')

                if (pastItems) {
                    orderHistoryContext = `\nUSER'S PAST PURCHASES: ${pastItems}. (Use this to understand their style preference).`
                }
            }
        }

        // B. Intent Detection (on last message only for speed)
        const lastMessage = messages[messages.length - 1]
        const userMessage = lastMessage?.content ?? ''
        const intent = detectIntent(userMessage)

        // C. Fetch Relevant Products based on Intent
        let products: Product[] = []
        let productContext = ''

        if (intent === 'styling') {
            const searchTerms = userMessage.toLowerCase()

            let query = supabase
                .from('products')
                .select('id, name, price, category, image_url, description')
                .eq('is_active', true)

            // Basic keyword matching
            if (searchTerms.includes('dress')) query = query.ilike('category', '%dress%')
            else if (searchTerms.includes('jean') || searchTerms.includes('denim')) query = query.ilike('category', '%jeans%')
            else if (searchTerms.includes('top') || searchTerms.includes('shirt')) query = query.ilike('category', '%top%')
            else if (searchTerms.includes('party') || searchTerms.includes('wedding')) query = query.or('description.ilike.%party%,description.ilike.%wedding%')
            else if (searchTerms.includes('gym') || searchTerms.includes('active')) query = query.or('category.ilike.%active%,description.ilike.%gym%')

            const { data } = await query.limit(4)
            products = (data || []) as Product[]

            // Fallback to popular if no specific match
            if (products.length === 0) {
                const { data: allProducts } = await supabase
                    .from('products')
                    .select('id, name, price, category, image_url, description')
                    .eq('is_active', true)
                    .limit(4)
                products = (allProducts || []) as Product[]
            }

            productContext = products.map(p =>
                `- ${p.name} (${p.category}): ₹${p.price}`
            ).join('\n')
        }

        // D. Cart Context
        let cartContext = ''
        if (cartItems && cartItems.length > 0) {
            const cartNames = cartItems.map((item: { name: string }) => item.name).join(', ')
            cartContext = `\nITEMS CURRENTLY IN CART: ${cartNames}. (Suggest items that go well with these).`
        }

        // ---------------------------------------------------------
        // 2. CONSTRUCT PROMPT
        // ---------------------------------------------------------
        const basePrompt = getPromptForIntent(intent)

        let systemContext = `You are a helpful AI Stylist for FitMirror.
        The user's name is ${userName}.
        ${orderHistoryContext}
        ${cartContext}
        
        AVAILABLE PRODUCTS TO RECOMMEND:
        ${productContext}
        
        GUIDELINES:
        - Be friendly, enthusiastic, and concise (max 2-3 sentences).
        - If recommending products, ONLY use exact names from the "AVAILABLE PRODUCTS" list.
        - If the user asks about something unrelated to fashion, gently guide them back.
        `

        // Combine history
        // Google Generative AI supports "chat" mode, but for stateless REST, we often just append history to prompt
        // or use the `startChat` helper if we were maintaining state. 
        // Here we'll reconstruct the flow textually for simplicity and control.

        let fullConversation = systemContext + "\n\n--- CONVERSATION HISTORY ---\n"
        messages.forEach((m: { role: string, content: string }) => {
            fullConversation += `${m.role.toUpperCase()}: ${m.content}\n`
        })
        fullConversation += `ASSISTANT:`

        // ---------------------------------------------------------
        // 3. GENERATE
        // ---------------------------------------------------------
        const result = await model.generateContent(fullConversation)
        const response = result.response.text()

        return NextResponse.json({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response,
            products: intent === 'styling' ? products : undefined,
            meta: {
                intent,
                userName, // useful for debug
                promptVersion: PROMPT_VERSION,
                remaining: rateLimit.remaining
            }
        })

    } catch (error) {
        console.error('AI Chat Error:', error)
        return NextResponse.json({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: "I'm having a little trouble connecting to my fashion brain right now! 🧠✨ But I'm still here if you want to browse.",
        })
    }
}
