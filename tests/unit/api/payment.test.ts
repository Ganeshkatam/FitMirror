import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as verifyPayment } from '@/app/api/payment/verify/route'
import crypto from 'crypto'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn()
}))

vi.mock('@/lib/razorpay', () => ({
    razorpay: {
        payments: {
            fetch: vi.fn()
        }
    }
}))

// Mock process.env
process.env.RAZORPAY_KEY_SECRET = 'test_secret'

import { createClient } from '@/lib/supabase/server'
import { razorpay } from '@/lib/razorpay'

// Helper to generate a valid signature
const generateSignature = (orderId: string, paymentId: string) => {
    return crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(`${orderId}|${paymentId}`)
        .digest("hex")
}

// Helper to create a mocked NextRequest
const createMockRequest = (body: any) => {
    return new NextRequest('http://localhost/api/payment/verify', {
        method: 'POST',
        body: JSON.stringify(body)
    })
}

describe('Payment Boundary Adversarial Matrix (8D.8)', () => {
    let mockSupabase: any

    beforeEach(() => {
        vi.clearAllMocks()

        // Setup default Supabase mock
        mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { id: 'db_order_1', total_amount: 100000, currency: 'INR', status: 'pending_payment', user_id: 'user_1' },
                error: null
            }),
            rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null })
            })
        };
        (createClient as any).mockResolvedValue(mockSupabase)

        // Setup default Razorpay mock
        ;(razorpay.payments.fetch as any).mockResolvedValue({
            id: 'pay_123',
            order_id: 'rzp_order_123',
            amount: 100000,
            currency: 'INR',
            status: 'captured'
        })
    })

    it('Exact amount + INR + valid signature -> Accept', async () => {
        const req = createMockRequest({
            razorpay_order_id: 'rzp_order_123',
            razorpay_payment_id: 'pay_123',
            razorpay_signature: generateSignature('rzp_order_123', 'pay_123'),
            db_order_ids: ['db_order_1']
        })

        const res = await verifyPayment(req)
        const json = await res.json()
        
        expect(res.status).toBe(200)
        expect(json.status).toBe('success')
        expect(mockSupabase.rpc).toHaveBeenCalledWith('transition_order_status', expect.any(Object))
    })

    it('Amount - ₹1 -> Reject', async () => {
        // Razorpay says 99999, local DB says 100000
        ;(razorpay.payments.fetch as any).mockResolvedValue({
            id: 'pay_123', order_id: 'rzp_order_123', amount: 99999, currency: 'INR', status: 'captured'
        })

        const req = createMockRequest({
            razorpay_order_id: 'rzp_order_123',
            razorpay_payment_id: 'pay_123',
            razorpay_signature: generateSignature('rzp_order_123', 'pay_123'),
            db_order_ids: ['db_order_1']
        })

        const res = await verifyPayment(req)
        const json = await res.json()
        
        expect(res.status).toBe(400)
        expect(json.error).toMatch(/Amount mismatch violation/)
    })

    it('Amount + ₹1 -> Reject', async () => {
        // Razorpay says 100001, local DB says 100000
        ;(razorpay.payments.fetch as any).mockResolvedValue({
            id: 'pay_123', order_id: 'rzp_order_123', amount: 100001, currency: 'INR', status: 'captured'
        })

        const req = createMockRequest({
            razorpay_order_id: 'rzp_order_123',
            razorpay_payment_id: 'pay_123',
            razorpay_signature: generateSignature('rzp_order_123', 'pay_123'),
            db_order_ids: ['db_order_1']
        })

        const res = await verifyPayment(req)
        const json = await res.json()
        
        expect(res.status).toBe(400)
        expect(json.error).toMatch(/Amount mismatch violation/)
    })

    it('Wrong currency -> Reject', async () => {
        ;(razorpay.payments.fetch as any).mockResolvedValue({
            id: 'pay_123', order_id: 'rzp_order_123', amount: 100000, currency: 'USD', status: 'captured'
        })

        const req = createMockRequest({
            razorpay_order_id: 'rzp_order_123',
            razorpay_payment_id: 'pay_123',
            razorpay_signature: generateSignature('rzp_order_123', 'pay_123'),
            db_order_ids: ['db_order_1']
        })

        const res = await verifyPayment(req)
        const json = await res.json()
        
        expect(res.status).toBe(400)
        expect(json.error).toMatch(/Currency violation/)
    })

    it('Wrong Razorpay order ID -> Reject', async () => {
        ;(razorpay.payments.fetch as any).mockResolvedValue({
            id: 'pay_123', order_id: 'DIFFERENT_ORDER', amount: 100000, currency: 'INR', status: 'captured'
        })

        const req = createMockRequest({
            razorpay_order_id: 'rzp_order_123',
            razorpay_payment_id: 'pay_123',
            razorpay_signature: generateSignature('rzp_order_123', 'pay_123'),
            db_order_ids: ['db_order_1']
        })

        const res = await verifyPayment(req)
        const json = await res.json()
        
        expect(res.status).toBe(400)
        expect(json.error).toMatch(/Provider order ID mismatch/)
    })

    it('Invalid signature -> Reject', async () => {
        const req = createMockRequest({
            razorpay_order_id: 'rzp_order_123',
            razorpay_payment_id: 'pay_123',
            razorpay_signature: 'invalid_signature_deadbeef',
            db_order_ids: ['db_order_1']
        })

        const res = await verifyPayment(req)
        const json = await res.json()
        
        expect(res.status).toBe(400)
        expect(json.error).toMatch(/Invalid Payment Signature/)
    })

    it('Unknown local order -> Reject', async () => {
        mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Not found') })

        const req = createMockRequest({
            razorpay_order_id: 'rzp_order_123',
            razorpay_payment_id: 'pay_123',
            razorpay_signature: generateSignature('rzp_order_123', 'pay_123'),
            db_order_ids: ['unknown_db_order']
        })

        const res = await verifyPayment(req)
        const json = await res.json()
        
        expect(res.status).toBe(404)
        expect(json.error).toMatch(/Local order not found/)
    })

    it('Already transitioned order -> Idempotent success (no second mutation)', async () => {
        mockSupabase.single.mockResolvedValue({
            data: { id: 'db_order_1', total_amount: 100000, currency: 'INR', status: 'placed', user_id: 'user_1' },
            error: null
        })

        const req = createMockRequest({
            razorpay_order_id: 'rzp_order_123',
            razorpay_payment_id: 'pay_123',
            razorpay_signature: generateSignature('rzp_order_123', 'pay_123'),
            db_order_ids: ['db_order_1']
        })

        const res = await verifyPayment(req)
        const json = await res.json()
        
        expect(res.status).toBe(200)
        expect(json.status).toBe('success')
        // Ensure RPC is NOT called because it was already transitioned
        expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })
})
