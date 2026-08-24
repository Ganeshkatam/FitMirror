import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/search/ask
 * 
 * AI-powered search that interprets natural language queries
 * and returns structured search parameters + products.
 * 
 * Body: { query: string }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { query } = await request.json()

        if (!query || query.length < 2) {
            return NextResponse.json({
                error: 'Query too short',
                products: [],
                interpretation: null
            }, { status: 400 })
        }

        // Parse natural language query into search parameters
        const interpretation = parseNaturalQuery(query)

        // Execute search with interpreted parameters
        const { data: searchResult, error } = await supabase.rpc('universal_search', {
            search_query: interpretation.searchTerms,
            filter_category: interpretation.category,
            min_price: interpretation.minPrice || 0,
            max_price: interpretation.maxPrice || 100000,
            page_number: 1,
            page_size: 20,
            filter_genders: interpretation.gender ? [interpretation.gender] : null,
            filter_colors: interpretation.colors?.length ? interpretation.colors : null,
            sort_by: interpretation.sortBy || 'recommended'
        })

        if (error) throw error

        // Generate natural language response
        const response = generateResponse(interpretation, searchResult)

        return NextResponse.json({
            products: searchResult?.results || [],
            total: searchResult?.total || 0,
            interpretation,
            response,
            query
        })

    } catch (error) {
        console.error('AI Search error:', error)
        return NextResponse.json({
            error: 'Search failed',
            products: [],
            interpretation: null
        }, { status: 500 })
    }
}

interface QueryInterpretation {
    searchTerms: string
    category?: string
    gender?: string
    colors: string[]
    minPrice?: number
    maxPrice?: number
    sortBy?: string
    intent: 'browse' | 'find' | 'compare' | 'outfit'
}

/**
 * Parse natural language query into structured parameters
 */
function parseNaturalQuery(query: string): QueryInterpretation {
    const lowerQuery = query.toLowerCase()

    const result: QueryInterpretation = {
        searchTerms: query,
        colors: [],
        intent: 'browse'
    }

    // Detect categories
    const categories = {
        't-shirts?': 't-shirts',
        'shirts?': 'shirts',
        'tops?': 'tops',
        '(jeans|denim)': 'jeans',
        'pants?': 'pants',
        'trousers?': 'pants',
        'dress(es)?': 'dresses',
        'skirts?': 'skirts',
        'jackets?': 'jackets',
        'coats?': 'coats',
        'sweaters?': 'sweaters',
        'hoodies?': 'hoodies',
        'shorts?': 'shorts',
        'kurtas?': 'kurta',
        'sarees?': 'saree',
        'lehengas?': 'lehenga'
    }

    for (const [pattern, category] of Object.entries(categories)) {
        if (new RegExp(pattern, 'i').test(lowerQuery)) {
            result.category = category
            break
        }
    }

    // Detect gender
    if (/\b(men'?s?|male|guys?|him)\b/i.test(lowerQuery)) {
        result.gender = 'men'
    } else if (/\b(women'?s?|female|ladies|her|girls?)\b/i.test(lowerQuery)) {
        result.gender = 'women'
    } else if (/\b(kids?|children|boys?|girls?)\b/i.test(lowerQuery)) {
        result.gender = 'kids'
    }

    // Detect colors
    const colorPatterns = [
        'black', 'white', 'red', 'blue', 'green', 'yellow', 'pink',
        'purple', 'orange', 'gray', 'grey', 'brown', 'navy', 'beige',
        'maroon', 'teal', 'olive', 'coral', 'lavender', 'mint', 'cream'
    ]
    for (const color of colorPatterns) {
        if (lowerQuery.includes(color)) {
            result.colors.push(color)
        }
    }

    // Detect price constraints
    const priceMatch = lowerQuery.match(/under\s*(?:₹|rs\.?|inr)?\s*(\d+)/i)
    if (priceMatch) {
        result.maxPrice = parseInt(priceMatch[1])
    }

    const aboveMatch = lowerQuery.match(/(?:above|over|more than)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i)
    if (aboveMatch) {
        result.minPrice = parseInt(aboveMatch[1])
    }

    const rangeMatch = lowerQuery.match(/(?:₹|rs\.?)?\s*(\d+)\s*(?:to|-)\s*(?:₹|rs\.?)?\s*(\d+)/i)
    if (rangeMatch) {
        result.minPrice = parseInt(rangeMatch[1])
        result.maxPrice = parseInt(rangeMatch[2])
    }

    // Detect sort intent
    if (/cheapest|lowest price|budget|affordable/i.test(lowerQuery)) {
        result.sortBy = 'price-low'
    } else if (/expensive|premium|luxury|high.?end/i.test(lowerQuery)) {
        result.sortBy = 'price-high'
    } else if (/new|latest|recent/i.test(lowerQuery)) {
        result.sortBy = 'newest'
    } else if (/popular|trending|best.?sell/i.test(lowerQuery)) {
        result.sortBy = 'popularity'
    } else if (/discount|sale|deal|offer/i.test(lowerQuery)) {
        result.sortBy = 'discount'
    }

    // Detect intent
    if (/show|find|looking for|search|where|get/i.test(lowerQuery)) {
        result.intent = 'find'
    } else if (/compare|difference|vs|or/i.test(lowerQuery)) {
        result.intent = 'compare'
    } else if (/outfit|pair|match|goes with|complete/i.test(lowerQuery)) {
        result.intent = 'outfit'
    }

    // Clean search terms (remove interpreted keywords)
    let cleanedTerms = query
    cleanedTerms = cleanedTerms.replace(/\b(show me|find|i want|i need|i'm looking for|looking for|search for|get me)\b/gi, '')
    cleanedTerms = cleanedTerms.replace(/\b(under|above|over|more than)\s*(?:₹|rs\.?|inr)?\s*\d+/gi, '')
    cleanedTerms = cleanedTerms.replace(/\b(cheapest|expensive|newest|popular|trending)\b/gi, '')
    cleanedTerms = cleanedTerms.replace(/\b(men'?s?|women'?s?|for him|for her)\b/gi, '')
    result.searchTerms = cleanedTerms.trim() || query

    return result
}

/**
 * Generate natural language response
 */
function generateResponse(
    interpretation: QueryInterpretation,
    result: { results: any[]; total: number } | null
): string {
    const count = result?.total || 0

    if (count === 0) {
        return `I couldn't find any products matching "${interpretation.searchTerms}". Try broadening your search or checking out our trending items!`
    }

    let response = `Found ${count} `

    if (interpretation.colors.length > 0) {
        response += interpretation.colors.join(' or ') + ' '
    }

    if (interpretation.category) {
        response += interpretation.category
    } else {
        response += 'products'
    }

    if (interpretation.gender) {
        response += ` for ${interpretation.gender}`
    }

    if (interpretation.maxPrice) {
        response += ` under ₹${interpretation.maxPrice.toLocaleString('en-IN')}`
    }

    if (interpretation.sortBy) {
        const sortLabels: Record<string, string> = {
            'price-low': 'sorted by lowest price',
            'price-high': 'sorted by highest price',
            'newest': 'sorted by newest first',
            'popularity': 'sorted by popularity',
            'discount': 'sorted by biggest discounts'
        }
        response += `, ${sortLabels[interpretation.sortBy] || ''}`
    }

    response += '.'

    return response
}
