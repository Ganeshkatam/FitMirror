import { MoneyPaise } from "./types";

export function calculateTax(taxablePaise: MoneyPaise, rateBps: number): MoneyPaise {
    if (taxablePaise < 0n) throw new Error("Negative taxable amount");
    if (rateBps < 0) throw new Error("Negative tax rate");

    // Multiply first, then divide. 
    // Integer rounding: round(val / 10000) = (val + 5000) / 10000
    const numerator = taxablePaise * BigInt(rateBps);
    return (numerator + 5000n) / 10000n;
}
