import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function POST(req: Request) {
    try {
        // Guard: check API key
        if (!genAI || !apiKey) {
            console.error("Visual Search: GOOGLE_GENERATIVE_AI_API_KEY is not configured")
            return NextResponse.json(
                { error: 'Visual search is not configured', analysis: null },
                { status: 503 }
            )
        }

        const formData = await req.formData()
        const file = formData.get('image') as File

        if (!file) {
            return NextResponse.json({ error: 'No image uploaded' }, { status: 400 })
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64Image = buffer.toString('base64')

        // 1. Analyze Image with Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `Analyze this fashion image and extract search parameters for a clothing store.
Return ONLY valid JSON (no markdown fences, no extra text) with these fields:
{
  "query": "short search query like 'red floral dress' or 'blue denim jacket'",
  "category": "one of: tops, bottoms, dresses, shoes, accessories, ethnic, outerwear",
  "color": "dominant color",
  "gender": "men or women or unisex",
  "style": "casual, party, formal, streetwear, ethnic, sportswear"
}

IMPORTANT: Return ONLY the JSON object, nothing else.`

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: file.type || 'image/jpeg'
                }
            }
        ])

        const responseText = result.response.text()
        console.log("Gemini raw response:", responseText)

        // Robust JSON extraction — handle markdown fences, extra text, etc.
        let analysis: any
        try {
            // Try direct parse first
            analysis = JSON.parse(responseText.trim())
        } catch {
            // Extract JSON from markdown fences or surrounding text
            const jsonMatch = responseText.match(/\{[\s\S]*?\}/)
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0])
            } else {
                console.error("Could not parse Gemini response:", responseText)
                return NextResponse.json(
                    { error: 'Could not analyze image', analysis: null },
                    { status: 422 }
                )
            }
        }

        console.log("Visual Search Analysis:", analysis)

        // 2. Execute Search via RPC
        const supabase = await createClient()

        const { data: searchResults, error } = await supabase.rpc('universal_search', {
            search_query: analysis.query || '',
            filter_category: analysis.category || null,
            filter_store_id: null,
            min_price: 0,
            max_price: 100000,
            page_number: 1,
            page_size: 10,
            filter_genders: analysis.gender ? [analysis.gender] : null,
            filter_colors: analysis.color ? [analysis.color] : null,
            sort_by: 'relevance'
        })

        if (error) {
            console.error("RPC Error:", error)
            // Still return the analysis even if search fails — client can use the query
            return NextResponse.json({
                analysis,
                results: [],
                searchError: error.message
            })
        }

        const products = (searchResults as any)?.results || []

        return NextResponse.json({
            analysis,
            results: products.map((p: any) => ({
                id: p.product_id || p.id,
                name: p.title || p.name,
                category: p.category,
                price: p.price,
                image: p.images?.[0]?.src || p.image,
                match_reason: `Matches ${analysis.color} ${analysis.category}`
            }))
        })

    } catch (e: any) {
        console.error("Visual Search Failed:", e?.message || e)
        return NextResponse.json(
            { error: 'Visual search failed', details: e?.message || 'Unknown error', analysis: null },
            { status: 500 }
        )
    }
}
