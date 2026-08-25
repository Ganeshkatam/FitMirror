import { CouponFact, MoneyPaise } from "./types";
import { Money } from "./money";

export function calculateOrderDiscount(subtotalPaise: MoneyPaise, couponFact: CouponFact | null): MoneyPaise {
    if (!couponFact) {
        return Money.ZERO;
    }

    if (couponFact.discountAmountPaise != null && couponFact.discountPercentage != null) {
        throw new Error("Invalid coupon: cannot have both fixed amount and percentage");
    }

    if (couponFact.minOrderAmountPaise != null && subtotalPaise < couponFact.minOrderAmountPaise) {
        // Did not meet minimum, so discount is 0
        return Money.ZERO;
    }

    let discount = Money.ZERO;

    if (couponFact.discountAmountPaise != null) {
        discount = couponFact.discountAmountPaise;
    } else if (couponFact.discountPercentage != null) {
        // Percentage: subtotal * percent / 100
        // e.g. 15.5% -> couponFact.discountPercentage = 15.5
        // Since we are doing integer math, we can multiply by percentage * 100 (which might be float, wait!)
        // If discountPercentage is 15.5, (subtotal * 15.5) / 100.
        // Better: subtotal * Math.round(percent * 100) / 10000
        // We shouldn't use Math.round inside the calculation of Money, but it's safe to turn the percentage into bps.
        const bps = Math.round(couponFact.discountPercentage * 100);
        discount = (subtotalPaise * BigInt(bps) + 5000n) / 10000n;
    }

    // Cap at max discount if specified
    if (couponFact.maxDiscountAmountPaise != null && discount > couponFact.maxDiscountAmountPaise) {
        discount = couponFact.maxDiscountAmountPaise;
    }

    // Discount cannot exceed subtotal
    if (discount > subtotalPaise) {
        discount = subtotalPaise;
    }
    
    if (discount < Money.ZERO) {
        throw new Error("Calculated discount cannot be negative");
    }

    return discount;
}

/**
 * Distributes a total order discount across line items proportionally by their gross amount.
 * The remainder is assigned to the items with the largest fractional part to ensure exact summation.
 */
export function distributeDiscount(
    totalDiscountPaise: MoneyPaise, 
    lineGrossAmounts: readonly MoneyPaise[]
): MoneyPaise[] {
    if (totalDiscountPaise === Money.ZERO) {
        return lineGrossAmounts.map(() => Money.ZERO);
    }

    const subtotal = lineGrossAmounts.reduce((a, b) => a + b, Money.ZERO);
    if (subtotal === Money.ZERO) {
        return lineGrossAmounts.map(() => Money.ZERO);
    }
    if (totalDiscountPaise > subtotal) {
        throw new Error("Total discount exceeds subtotal");
    }

    const discounts: MoneyPaise[] = [];
    let distributed = Money.ZERO;

    // We'll calculate proportional discount and track remainders
    const items = lineGrossAmounts.map((gross, index) => {
        // To maximize precision, we do: (gross * totalDiscount) / subtotal
        const exactNumerator = gross * totalDiscountPaise;
        const baseDiscount = exactNumerator / subtotal;
        const remainder = exactNumerator % subtotal;
        return { index, baseDiscount, remainder, gross };
    });

    // Assign base discounts
    items.forEach(item => {
        discounts[item.index] = item.baseDiscount;
        distributed += item.baseDiscount;
    });

    let shortfall = totalDiscountPaise - distributed;

    // Distribute shortfall (which will be <= items.length) 1 paise at a time
    // Prioritize items with the largest remainder
    items.sort((a, b) => {
        if (a.remainder > b.remainder) return -1;
        if (a.remainder < b.remainder) return 1;
        return 0;
    });

    let i = 0;
    while (shortfall > Money.ZERO && i < items.length) {
        const idx = items[i].index;
        // Make sure we don't discount more than the gross amount
        if (discounts[idx] < items[i].gross) {
            discounts[idx] += 1n;
            shortfall -= 1n;
        }
        i++;
    }

    return discounts;
}
