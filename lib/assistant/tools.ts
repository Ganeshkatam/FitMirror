import { z } from 'zod';

// 1. Search Tool Definition
export const searchToolDefinition = {
    name: 'search_products',
    description: 'Search for products in the store based on queries like "red dress", "party wear", "cheap tops".',
    parameters: z.object({
        query: z.string().describe('The search query (e.g. "black evening gown")'),
        category: z.string().optional().describe('Filter by category (dresses, tops, bottoms)'),
        color: z.string().optional().describe('Filter by color'),
        sort: z.string().optional().describe('Sort order: price-low, price-high, newest'),
    }),
};

// 2. Navigation Tool Definition
export const navigateToolDefinition = {
    name: 'navigate',
    description: 'Navigate the user to a specific page URL.',
    parameters: z.object({
        url: z.string().describe('The relative URL to navigate to (e.g. "/shop", "/account/orders")'),
    }),
};

// 3. Stock Check Tool Definition
export const checkStockToolDefinition = {
    name: 'check_stock',
    description: 'Check inventory availability for a specific product ID.',
    parameters: z.object({
        productId: z.string().describe('The UUID of the product'),
        size: z.string().optional().describe('Specific size to check (S, M, L)'),
    }),
};
