import { OrderCalculation, OrderCalculationLine, PricingInput, MoneyPaise } from "./types";
import { Money } from "./money";
import { calculateTax } from "./tax";
import { calculateShipping } from "./shipping";
import { calculateOrderDiscount, distributeDiscount } from "./coupon";

export function calculateOrderTotals(input: PricingInput): OrderCalculation {
    if (input.items.length === 0) {
        throw new Error("Cannot calculate an empty order");
    }

    // 1. Calculate Gross Amounts
    let subtotalPaise: MoneyPaise = Money.ZERO;
    const grossLines = input.items.map(item => {
        if (item.quantity <= 0) {
            throw new Error(`Invalid quantity for product ${item.productId}: ${item.quantity}`);
        }
        
        const fact = input.productFacts.get(item.productId);
        if (!fact) {
            throw new Error(`Missing pricing facts for product ${item.productId}`);
        }

        const unitPricePaise = fact.salePricePaise != null ? fact.salePricePaise : fact.pricePaise;
        const grossAmountPaise = unitPricePaise * BigInt(item.quantity);
        subtotalPaise += grossAmountPaise;

        return {
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPricePaise,
            grossAmountPaise,
            taxRuleId: fact.taxRuleId,
            taxRateBps: fact.taxRateBps
        };
    });

    // 2. Calculate Total Discount
    const totalDiscountPaise = calculateOrderDiscount(subtotalPaise, input.couponFact);

    // 3. Distribute Discount to Lines
    const lineGrossAmounts = grossLines.map(l => l.grossAmountPaise);
    const lineDiscounts = distributeDiscount(totalDiscountPaise, lineGrossAmounts);

    // 4. Calculate Final Lines (Taxable, Tax, Total)
    let sumDiscountPaise = Money.ZERO;
    let sumTaxablePaise = Money.ZERO;
    let sumTaxPaise = Money.ZERO;
    
    const finalLines: OrderCalculationLine[] = grossLines.map((line, index) => {
        const discountAmountPaise = lineDiscounts[index];
        const taxableAmountPaise = line.grossAmountPaise - discountAmountPaise;
        const taxAmountPaise = calculateTax(taxableAmountPaise, line.taxRateBps);
        const totalAmountPaise = taxableAmountPaise + taxAmountPaise;

        sumDiscountPaise += discountAmountPaise;
        sumTaxablePaise += taxableAmountPaise;
        sumTaxPaise += taxAmountPaise;

        return Object.freeze({
            ...line,
            discountAmountPaise,
            taxableAmountPaise,
            taxAmountPaise,
            totalAmountPaise
        });
    });

    // 5. Assert Distribution Invariant
    if (sumDiscountPaise !== totalDiscountPaise) {
        throw new Error("Discount distribution invariant violation");
    }

    // 6. Calculate Shipping
    const shippingPaise = calculateShipping(input.shippingFact);

    // 7. Grand Total
    const totalPaise = sumTaxablePaise + sumTaxPaise + shippingPaise;

    return Object.freeze({
        currency: "INR",
        subtotalPaise,
        discountPaise: totalDiscountPaise,
        taxablePaise: sumTaxablePaise,
        taxPaise: sumTaxPaise,
        shippingPaise,
        totalPaise,
        lines: Object.freeze(finalLines),
        shippingMethodId: input.shippingFact ? input.shippingFact.id : null
    });
}
