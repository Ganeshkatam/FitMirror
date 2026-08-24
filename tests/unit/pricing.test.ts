import { describe, it, expect } from 'vitest'
import { calculateDiscountedPrice } from '@/lib/utils/pricing'

describe('Pricing Utils', () => {
    describe('calculateDiscountedPrice', () => {
        it('should calculate correct discount', () => {
            expect(calculateDiscountedPrice(100, 20)).toBe(80)
            expect(calculateDiscountedPrice(1000, 50)).toBe(500)
        })

        it('should handle floating point results by rounding', () => {
            // 33% off 100 = 67
            expect(calculateDiscountedPrice(100, 33)).toBe(67)
        })

        it('should return original price for invalid discounts', () => {
            expect(calculateDiscountedPrice(100, 0)).toBe(100)
            expect(calculateDiscountedPrice(100, -10)).toBe(100)
            expect(calculateDiscountedPrice(100, 110)).toBe(100)
        })
    })
})
