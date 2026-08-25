export type MoneyPaise = bigint;

export interface OrderCalculationLine {
    productId: string;
    variantId?: string;
    quantity: number;
    unitPricePaise: MoneyPaise;
    
    // Tax provenance
    taxRuleId: string | null;
    taxRateBps: number;
    
    // Calculated facts
    grossAmountPaise: MoneyPaise;
    discountAmountPaise: MoneyPaise;
    taxableAmountPaise: MoneyPaise;
    taxAmountPaise: MoneyPaise;
    totalAmountPaise: MoneyPaise; // Net payable (post-tax)
}

export interface OrderCalculation {
    currency: "INR";
    subtotalPaise: MoneyPaise;
    discountPaise: MoneyPaise;
    shippingPaise: MoneyPaise;
    taxablePaise: MoneyPaise;
    taxPaise: MoneyPaise;
    totalPaise: MoneyPaise; // Final amount to charge
    lines: readonly OrderCalculationLine[];
    shippingMethodId: string | null;
}

export interface ProductFact {
    id: string;
    pricePaise: MoneyPaise;
    salePricePaise: MoneyPaise | null;
    taxRuleId: string | null;
    taxRateBps: number; // resolved from taxRuleId
}

export interface CartItemInput {
    productId: string;
    variantId?: string;
    quantity: number;
}

export interface CouponFact {
    id: string;
    code: string;
    discountAmountPaise: MoneyPaise | null;
    discountPercentage: number | null;
    minOrderAmountPaise: MoneyPaise | null;
    maxDiscountAmountPaise: MoneyPaise | null;
}

export interface ShippingMethodFact {
    id: string;
    code: string;
    costPaise: MoneyPaise;
}

export interface PricingInput {
    items: readonly CartItemInput[];
    productFacts: ReadonlyMap<string, ProductFact>;
    couponFact: CouponFact | null;
    shippingFact: ShippingMethodFact | null;
}
