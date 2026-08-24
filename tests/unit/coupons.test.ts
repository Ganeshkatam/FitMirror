import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateCoupon, applyCouponToOrder } from '@/lib/actions/coupons'

// --- Mocks ---
const mockCouponsBuilder = {
    select: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    single: vi.fn(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
}

const mockFrom = vi.fn().mockImplementation((table: string) => {
    if (table === 'coupons') return mockCouponsBuilder
    return {
        select: vi.fn().mockReturnThis()
    }
})

vi.mock('@/lib/supabase/server', () => ({
    createClient: () => ({
        from: mockFrom
    })
}))

describe('Coupon Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('validateCoupon', () => {
        it('should return valid for a correct coupon', async () => {
            const validCoupon = {
                code: 'SAVE10',
                is_active: true,
                discount_type: 'percentage',
                discount_value: 10,
                min_order_value: 0,
                valid_until: null
            }

            mockCouponsBuilder.single.mockResolvedValue({ data: validCoupon, error: null })

            const result = await validateCoupon('SAVE10', 100, [])
            expect(result.valid).toBe(true)
            expect(result.discountAmount).toBe(10) // 10% of 100
        })

        it('should return invalid if coupon not found', async () => {
            mockCouponsBuilder.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })
            const result = await validateCoupon('INVALID', 100, [])
            expect(result.valid).toBe(false)
            expect(result.message).toContain('not found')
        })

        it('should return invalid if coupon is inactive', async () => {
            mockCouponsBuilder.single.mockResolvedValue({
                data: { code: 'OFF', is_active: false },
                error: null
            })
            const result = await validateCoupon('OFF', 100, [])
            expect(result.valid).toBe(false)
            expect(result.message).toContain('active')
        })

        it('should return invalid if expired', async () => {
            const pastDate = new Date()
            pastDate.setDate(pastDate.getDate() - 1)

            mockCouponsBuilder.single.mockResolvedValue({
                data: {
                    code: 'EXPIRED',
                    is_active: true,
                    valid_until: pastDate.toISOString()
                },
                error: null
            })
            const result = await validateCoupon('EXPIRED', 100, [])
            expect(result.valid).toBe(false)
            expect(result.message).toContain('expired')
        })

        it('should return invalid if min order value not met', async () => {
            mockCouponsBuilder.single.mockResolvedValue({
                data: {
                    code: 'MIN1000',
                    is_active: true,
                    min_order_value: 1000
                },
                error: null
            })
            const result = await validateCoupon('MIN1000', 500, [])
            expect(result.valid).toBe(false)
            expect(result.message).toContain('Minimum order value')
        })
    })

    describe('applyCouponToOrder', () => {
        it('should apply percentage discount correctly', async () => {
            mockCouponsBuilder.single.mockResolvedValue({
                data: {
                    code: '20OFF',
                    is_active: true,
                    discount_type: 'percentage',
                    discount_value: 20
                },
                error: null
            })
            const result = await applyCouponToOrder('20OFF', 200)

            expect(result.success).toBe(true)
            expect(result.discountAmount).toBe(40) // 20% of 200
            expect(result.finalTotal).toBe(160)
        })

        it('should apply fixed discount correctly', async () => {
            mockCouponsBuilder.single.mockResolvedValue({
                data: {
                    code: 'FLAT50',
                    is_active: true,
                    discount_type: 'fixed',
                    discount_value: 50
                },
                error: null
            })
            const result = await applyCouponToOrder('FLAT50', 200)

            expect(result.success).toBe(true)
            expect(result.discountAmount).toBe(50)
            expect(result.finalTotal).toBe(150)
        })

        it('should cap fixed discount at order total', async () => {
            mockCouponsBuilder.single.mockResolvedValue({
                data: {
                    code: 'BIG100',
                    is_active: true,
                    discount_type: 'fixed',
                    discount_value: 100
                },
                error: null
            })
            // Order total is less than discount
            const result = await applyCouponToOrder('BIG100', 50)

            expect(result.success).toBe(true)
            expect(result.discountAmount).toBe(50) // Capped at 50
            expect(result.finalTotal).toBe(0)
        })
    })
})
