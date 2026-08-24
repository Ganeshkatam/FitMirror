import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { z } from 'zod';
import { SYSTEM_PROMPT } from '@/lib/assistant/prompts';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getRateLimitMessage } from '@/lib/rate-limiter';
import { NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * AI Chat Agent Route with Tools
 * 
 * Tools: search_products, check_stock, navigate
 * 
 * Note: Using 'as any' cast on tools object to work around
 * AI SDK type inference issues with Turbopack build.
 */

// Tool definitions with explicit schemas
const searchProductsSchema = z.object({
    query: z.string().describe('Search query or product description'),
    category: z.string().optional().describe('Product category like tops, dresses, shoes'),
    color: z.string().optional().describe('Color filter'),
    maxPrice: z.number().optional().describe('Maximum price in INR'),
});

const checkStockSchema = z.object({
    productId: z.string().describe('The product ID to check'),
    size: z.string().optional().describe('Specific size to check (S, M, L, XL, etc.)'),
});

const navigateSchema = z.object({
    destination: z.enum(['product', 'cart', 'try-on', 'shop', 'wishlist']).describe('Where to navigate'),
    productId: z.string().optional().describe('Product ID if navigating to a product page'),
});

// Tool execute functions
async function searchProducts(params: z.infer<typeof searchProductsSchema>) {
    const { query, category, color, maxPrice } = params;
    const supabase = await createClient();

    let queryBuilder = supabase
        .from('products')
        .select('id, name, price, category, image_url, tryon_supported')
        .eq('is_active', true)
        .limit(10);

    if (category) {
        queryBuilder = queryBuilder.ilike('category', `%${category}%`);
    }
    if (color) {
        queryBuilder = queryBuilder.ilike('color', `%${color}%`);
    }
    if (maxPrice) {
        queryBuilder = queryBuilder.lte('price', maxPrice);
    }
    if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    const { data: products, error } = await queryBuilder;

    if (error) {
        return { success: false, error: error.message, products: [] };
    }

    return {
        success: true,
        count: products?.length || 0,
        products: products || [],
        hint: products?.length ? 'Here are some products I found for you!' : 'No products matched your criteria.'
    };
}

async function checkStock(params: z.infer<typeof checkStockSchema>) {
    const { productId, size } = params;
    const supabase = await createClient();

    let queryBuilder = supabase
        .from('product_inventory')
        .select('size, stock, sku')
        .eq('product_id', productId);

    if (size) {
        queryBuilder = queryBuilder.eq('size', size.toUpperCase());
    }

    const { data: inventory, error } = await queryBuilder;

    if (error) {
        return { success: false, error: error.message, inventory: [] };
    }

    const totalStock = inventory?.reduce((sum, item) => sum + (item.stock || 0), 0) || 0;

    return {
        success: true,
        productId,
        totalStock,
        sizes: inventory || [],
        inStock: totalStock > 0,
        hint: totalStock > 0 ? `This item is in stock!` : 'This item is currently out of stock.'
    };
}

async function navigate(params: z.infer<typeof navigateSchema>) {
    const { destination, productId } = params;

    const routes: Record<string, string> = {
        'product': productId ? `/product/${productId}` : '/shop',
        'cart': '/cart',
        'try-on': '/try-on',
        'shop': '/shop',
        'wishlist': '/account/wishlist',
    };

    return {
        success: true,
        url: routes[destination] || '/shop',
        action: 'navigate',
        hint: `Taking you to ${destination}...`
    };
}

export async function POST(req: Request) {
    // Rate limiting
    const clientId = req.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimit = checkRateLimit(clientId);

    if (!rateLimit.allowed) {
        return NextResponse.json({
            role: 'assistant',
            content: getRateLimitMessage(rateLimit.resetIn),
        });
    }

    const { messages } = await req.json();

    // Build tools object with type cast to bypass strict inference
    const tools = {
        search_products: {
            description: 'Search for products by query, category, color, or occasion.',
            parameters: searchProductsSchema,
            execute: searchProducts,
        },
        check_stock: {
            description: 'Check stock availability for a specific product and size.',
            parameters: checkStockSchema,
            execute: checkStock,
        },
        navigate: {
            description: 'Navigate the user to a specific page in the app.',
            parameters: navigateSchema,
            execute: navigate,
        },
    } as any; // Type cast to bypass Turbopack inference issues

    const result = streamText({
        model: google('gemini-1.5-flash') as any,
        system: SYSTEM_PROMPT,
        messages: messages,
        tools: tools,
    });

    // Rate limiting
    // Rate limiting (handled at top)
    // We need to import checkRateLimit. 
    // Since I can't easily add import in single replace if they are far apart, implies I need multi_replace.
    // But checkRateLimit is in @/lib/rate-limiter.
    // Let's use multi_replace for this file too.

    // Placeholder to signal I will use multi_replace next.
    // Actually, I can just use replace_file_content if I only edit this block and assume imports exist?
    // They don't exist.

    // I will skip this call and use multi_replace in the tool list (but I can't call multi_replace twice strictly in parallel if implied?
    // "Do NOT make multiple parallel calls to this tool OR replace_file_content for same file."
    // I am editing TWO DIFFERENT FILES. `try-on/route.ts` and `chat/agent/route.ts`.
    // So I can use multi_replace for BOTH in parallel? 
    // "Do NOT make multiple parallel calls to this tool... for the SAME file."
    // Different files is fine.

    return (result as any).toDataStreamResponse();
}
