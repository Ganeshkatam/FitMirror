import { MoneyPaise } from "./types";

export const Money = {
    ZERO: 0n,
    
    // Strict helper to prevent number/float drift
    fromNumber(value: number): MoneyPaise {
        if (!Number.isSafeInteger(value)) {
            throw new Error(`Invalid money amount: ${value}. Must be a safe integer.`);
        }
        return BigInt(value);
    },
    
    max(a: MoneyPaise, b: MoneyPaise): MoneyPaise {
        return a > b ? a : b;
    },
    
    min(a: MoneyPaise, b: MoneyPaise): MoneyPaise {
        return a < b ? a : b;
    }
};
