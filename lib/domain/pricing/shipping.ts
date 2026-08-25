import { ShippingMethodFact, MoneyPaise } from "./types";
import { Money } from "./money";

export function calculateShipping(shippingFact: ShippingMethodFact | null): MoneyPaise {
    if (!shippingFact) {
        return Money.ZERO;
    }
    
    if (shippingFact.costPaise < Money.ZERO) {
        throw new Error("Negative shipping cost is invalid");
    }

    return shippingFact.costPaise;
}
