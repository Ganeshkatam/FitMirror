import { describe, it, expect } from 'vitest'
import { calculateOrderTotals } from '@/lib/domain/pricing/calculator'
import {
    OrderCalculation,
    PricingInput,
    ProductFact,
    CouponFact,
    ShippingMethodFact
} from '@/lib/domain/pricing/types'

describe('PricingDomain - calculateOrderTotals Determinism', () => {

    it('should accurately calculate a simple 1 item order without discount or shipping', () => {
        const input: PricingInput = {
            items: [{ productId: 'p1', quantity: 1 }],
            productFacts: new Map<string, ProductFact>([
                ['p1', { id: 'p1', pricePaise: 100000n, salePricePaise: null, taxRuleId: 't1', taxRateBps: 1800 }]
            ]),
            couponFact: null,
            shippingFact: null
        }

        const result = calculateOrderTotals(input)

        expect(result.subtotalPaise).toBe(100000n)
        expect(result.discountPaise).toBe(0n)
        expect(result.shippingPaise).toBe(0n)
        expect(result.totalPaise).toBe(118000n)

        // 100000 * 18% = 18000n
        expect(result.taxPaise).toBe(18000n)
        expect(result.lines[0].taxAmountPaise).toBe(18000n)
    })

    it('should never produce negative totals or phantom tax on ₹0 items', () => {
        const input: PricingInput = {
            items: [{ productId: 'p1', quantity: 1 }],
            productFacts: new Map<string, ProductFact>([
                ['p1', { id: 'p1', pricePaise: 0n, salePricePaise: null, taxRuleId: 't1', taxRateBps: 1800 }]
            ]),
            couponFact: null,
            shippingFact: null
        }

        const result = calculateOrderTotals(input)

        expect(result.totalPaise).toBe(0n)
        expect(result.subtotalPaise).toBe(0n)
        expect(result.taxPaise).toBe(0n)
    })

    it('should correctly allocate exact multi-item discount without remainder loss', () => {
        const input: PricingInput = {
            items: [
                { productId: 'p1', quantity: 1 },
                { productId: 'p2', quantity: 1 },
                { productId: 'p3', quantity: 1 }
            ],
            productFacts: new Map<string, ProductFact>([
                ['p1', { id: 'p1', pricePaise: 333n, salePricePaise: null, taxRuleId: 't1', taxRateBps: 0 }],
                ['p2', { id: 'p2', pricePaise: 333n, salePricePaise: null, taxRuleId: 't1', taxRateBps: 0 }],
                ['p3', { id: 'p3', pricePaise: 334n, salePricePaise: null, taxRuleId: 't1', taxRateBps: 0 }]
            ]),
            couponFact: {
                id: 'c1',
                code: 'DISC100',
                discountAmountPaise: 100n,
                discountPercentage: null,
                minOrderAmountPaise: null,
                maxDiscountAmountPaise: null
            },
            shippingFact: null
        }

        const result = calculateOrderTotals(input)

        expect(result.subtotalPaise).toBe(1000n)
        expect(result.discountPaise).toBe(100n)

        // Line item discounts:
        const lineItemDiscounts = result.lines.map(l => l.discountAmountPaise)
        expect(lineItemDiscounts).toContain(33n)
        expect(lineItemDiscounts).toContain(34n)
        expect(lineItemDiscounts.reduce((a, b) => a + b, 0n)).toBe(100n)
    })

    it('should cap a percentage coupon at the maximum configured discount', () => {
        const input: PricingInput = {
            items: [{ productId: 'p1', quantity: 1 }],
            productFacts: new Map<string, ProductFact>([
                ['p1', { id: 'p1', pricePaise: 1000000n, salePricePaise: null, taxRuleId: 't1', taxRateBps: 0 }] // 10k INR
            ]),
            couponFact: {
                id: 'c1',
                code: '50OFF',
                discountAmountPaise: null,
                discountPercentage: 50, // 50%
                minOrderAmountPaise: null,
                maxDiscountAmountPaise: 100000n // Max 1000 INR
            },
            shippingFact: null
        }

        const result = calculateOrderTotals(input)

        expect(result.subtotalPaise).toBe(1000000n)
        expect(result.discountPaise).toBe(100000n) // capped at 100,000 paise
        expect(result.totalPaise).toBe(900000n)
    })

    it('should cap a fixed coupon at the eligible subtotal (100% discount max)', () => {
        const input: PricingInput = {
            items: [{ productId: 'p1', quantity: 1 }],
            productFacts: new Map<string, ProductFact>([
                ['p1', { id: 'p1', pricePaise: 50000n, salePricePaise: null, taxRuleId: 't1', taxRateBps: 0 }]
            ]),
            couponFact: {
                id: 'c1',
                code: 'MINUS1000',
                discountAmountPaise: 100000n,
                discountPercentage: null,
                minOrderAmountPaise: null,
                maxDiscountAmountPaise: null
            },
            shippingFact: null
        }

        const result = calculateOrderTotals(input)

        expect(result.subtotalPaise).toBe(50000n)
        expect(result.discountPaise).toBe(50000n)
        expect(result.totalPaise).toBe(0n)
    })

    it('should enforce determinism for identical inputs (no Math.random / floating variance)', () => {
        const input: PricingInput = {
            items: [
                { productId: 'p1', quantity: 3 },
                { productId: 'p2', quantity: 1 }
            ],
            productFacts: new Map<string, ProductFact>([
                ['p1', { id: 'p1', pricePaise: 99900n, salePricePaise: null, taxRuleId: 't1', taxRateBps: 1800 }],
                ['p2', { id: 'p2', pricePaise: 14900n, salePricePaise: null, taxRuleId: 't1', taxRateBps: 1800 }]
            ]),
            couponFact: {
                id: 'c1',
                code: 'PROMO15',
                discountAmountPaise: null,
                discountPercentage: 15,
                minOrderAmountPaise: null,
                maxDiscountAmountPaise: 25000n
            },
            shippingFact: {
                id: 's1',
                code: 'express',
                costPaise: 15000n
            }
        }

        const res1 = calculateOrderTotals(input)
        const res2 = calculateOrderTotals(input)

        expect(res1).toEqual(res2)
    })

    it('should throw an error for missing product facts', () => {
        const input: PricingInput = {
            items: [{ productId: 'p1', quantity: 1 }],
            productFacts: new Map<string, ProductFact>(),
            couponFact: null,
            shippingFact: null
        }
        expect(() => calculateOrderTotals(input)).toThrow(/Missing pricing facts/)
    })
})
