import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PricingRepository } from '@/lib/domain/pricing/repository';
import { calculateOrderTotals } from '@/lib/domain/pricing/calculator';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { items, couponCode, shippingMethod } = body;
        
        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items provided' }, { status: 400 });
        }

        const supabase = await createClient();
        const repo = new PricingRepository(supabase);
        
        const productIds = items.map((i: any) => i.productId || i.product_id);
        const resolvedFacts = await repo.resolveFacts(productIds, couponCode, shippingMethod);
        
        const inputItems = items.map((i: any) => ({
            productId: i.productId || i.product_id,
            variantId: i.variantId || i.variant_id || undefined,
            quantity: i.quantity
        }));
        
        const calculation = calculateOrderTotals({
            items: inputItems,
            productFacts: resolvedFacts.productFacts,
            couponFact: resolvedFacts.couponFact,
            shippingFact: resolvedFacts.shippingFact
        });

        // Convert BigInt to string for JSON
        const calculationJson = JSON.parse(JSON.stringify(calculation, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(calculationJson);
    } catch (error: any) {
        console.error("Quote failed:", error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
