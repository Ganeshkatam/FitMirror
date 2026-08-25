import { createClient } from "@supabase/supabase-js";
import { ProductFact, CouponFact, ShippingMethodFact, MoneyPaise } from "./types";

export interface ResolvedFacts {
    productFacts: Map<string, ProductFact>;
    couponFact: CouponFact | null;
    shippingFact: ShippingMethodFact | null;
}

export class PricingRepository {
    private supabase;

    constructor(supabaseClient: any) {
        this.supabase = supabaseClient;
    }

    async resolveFacts(
        productIds: string[], 
        couponCode?: string | null, 
        shippingMethodCode?: string | null
    ): Promise<ResolvedFacts> {
        const productFacts = new Map<string, ProductFact>();
        let couponFact: CouponFact | null = null;
        let shippingFact: ShippingMethodFact | null = null;

        if (productIds.length > 0) {
            const { data: products, error } = await this.supabase
                .from("products")
                .select(`
                    id, 
                    price, 
                    sale_price, 
                    tax_rule_id,
                    tax_rules (rate_bps)
                `)
                .in("id", productIds);

            if (error) throw new Error("Failed to load products: " + error.message);

            for (const p of products) {
                productFacts.set(p.id, {
                    id: p.id,
                    pricePaise: BigInt(p.price),
                    salePricePaise: p.sale_price != null ? BigInt(p.sale_price) : null,
                    taxRuleId: p.tax_rule_id,
                    taxRateBps: p.tax_rules?.rate_bps ?? 0
                });
            }
        }

        if (couponCode) {
            const { data: coupon, error } = await this.supabase
                .from("coupons")
                .select("*")
                .eq("code", couponCode)
                .eq("is_active", true)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw new Error("Failed to load coupon: " + error.message);
            }

            if (coupon) {
                couponFact = {
                    id: coupon.id,
                    code: coupon.code,
                    discountAmountPaise: coupon.discount_amount_paise != null ? BigInt(coupon.discount_amount_paise) : null,
                    discountPercentage: coupon.discount_percentage,
                    minOrderAmountPaise: coupon.min_order_amount != null ? BigInt(coupon.min_order_amount) : null,
                    maxDiscountAmountPaise: coupon.max_discount_amount != null ? BigInt(coupon.max_discount_amount) : null,
                };
            }
        }

        if (shippingMethodCode) {
            const { data: shipping, error } = await this.supabase
                .from("shipping_methods")
                .select("*")
                .eq("code", shippingMethodCode)
                .eq("is_active", true)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw new Error("Failed to load shipping method: " + error.message);
            }

            if (shipping) {
                shippingFact = {
                    id: shipping.id,
                    code: shipping.code,
                    costPaise: BigInt(shipping.cost_paise)
                };
            }
        }

        return { productFacts, couponFact, shippingFact };
    }
}
