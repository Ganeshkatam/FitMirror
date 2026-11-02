import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as handleWebhook } from '@/app/api/webhooks/razorpay/route'
import crypto from 'crypto'

const WEBHOOK_SECRET = 'test_webhook_secret'

// Mock service role client
vi.mock('@/lib/supabase/service-role', () => ({
    createServiceRoleClient: vi.fn()
}))

import { createServiceRoleClient } from '@/lib/supabase/service-role'

const generateWebhookSignature = (payload: string, secret: string) => {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

const createMockWebhookRequest = (body: any, eventId: string = 'evt_test_123', secret: string = WEBHOOK_SECRET) => {
    const rawBody = JSON.stringify(body)
    const signature = generateWebhookSignature(rawBody, secret)

    return new NextRequest('http://localhost/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-razorpay-signature': signature,
            'x-razorpay-event-id': eventId
        },
        body: rawBody
    })
}

describe('Razorpay Webhook Robustness & Invariant Matrix', () => {
    let mockSupabase: any
    let mockEventsTable: any
    let mockOrdersTable: any

    beforeEach(() => {
        vi.clearAllMocks()
        process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET

        mockEventsTable = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null })
            })
        }

        mockOrdersTable = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
                data: {
                    id: 'ord_123',
                    total_amount: 1000,
                    currency: 'INR',
                    status: 'pending_payment',
                    payment_status: 'pending',
                    is_paid: false
                },
                error: null
            }),
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null })
            })
        }

        mockSupabase = {
            from: vi.fn((table: string) => {
                if (table === 'payment_webhook_events') return mockEventsTable
                if (table === 'orders') return mockOrdersTable
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                    update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
                }
            }),
            rpc: vi.fn().mockResolvedValue({ data: true, error: null })
        }

        vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)
    })

    it('rejects requests with invalid signature', async () => {
        const payload = { event: 'payment.captured' }
        const rawBody = JSON.stringify(payload)
        const req = new NextRequest('http://localhost/api/webhooks/razorpay', {
            method: 'POST',
            headers: {
                'x-razorpay-signature': 'invalid_sig',
                'x-razorpay-event-id': 'evt_bad_sig'
            },
            body: rawBody
        })

        const res = await handleWebhook(req)
        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.error).toBe('Invalid signature')
    })

    it('handles duplicate events idempotently without reprocessing', async () => {
        mockEventsTable.maybeSingle.mockResolvedValueOnce({
            data: { event_id: 'evt_duplicate_1', status: 'processed' },
            error: null
        })

        const payload = {
            event: 'payment.captured',
            payload: { payment: { entity: { notes: { order_id: 'ord_123' }, amount: 1000, currency: 'INR' } } }
        }
        const req = createMockWebhookRequest(payload, 'evt_duplicate_1')

        const res = await handleWebhook(req)
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.status).toBe('success')
        expect(json.message).toBe('Event already processed')
        // Order should not be updated
        expect(mockOrdersTable.update).not.toHaveBeenCalled()
    })

    it('processes payment.captured and guarantees is_paid=true even if already placed', async () => {
        mockOrdersTable.maybeSingle.mockResolvedValueOnce({
            data: {
                id: 'ord_123',
                total_amount: 1000,
                currency: 'INR',
                status: 'placed', // Already placed via client
                payment_status: 'pending',
                is_paid: false
            },
            error: null
        })

        const payload = {
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_xyz',
                        order_id: 'order_rzp_1',
                        amount: 1000,
                        currency: 'INR',
                        notes: { order_id: 'ord_123' }
                    }
                }
            }
        }
        const req = createMockWebhookRequest(payload, 'evt_captured_1')

        const res = await handleWebhook(req)
        expect(res.status).toBe(200)

        // Verifies monotonic captured update occurred
        expect(mockOrdersTable.update).toHaveBeenCalledWith(
            expect.objectContaining({
                is_paid: true,
                payment_status: 'captured'
            })
        )
    })

    it('prevents monotonic downgrade: out-of-order payment.authorized cannot overwrite captured payment', async () => {
        mockOrdersTable.maybeSingle.mockResolvedValueOnce({
            data: {
                id: 'ord_123',
                total_amount: 1000,
                currency: 'INR',
                status: 'placed',
                payment_status: 'captured',
                is_paid: true
            },
            error: null
        })

        const payload = {
            event: 'payment.authorized',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_xyz',
                        amount: 1000,
                        currency: 'INR',
                        notes: { order_id: 'ord_123' }
                    }
                }
            }
        }
        const req = createMockWebhookRequest(payload, 'evt_authorized_delayed')

        const res = await handleWebhook(req)
        expect(res.status).toBe(200)

        // Monotonic protection: should NOT update payment_status to authorized
        expect(mockOrdersTable.update).not.toHaveBeenCalled()
    })

    it('prevents monotonic downgrade: out-of-order payment.failed cannot overwrite captured payment', async () => {
        mockOrdersTable.maybeSingle.mockResolvedValueOnce({
            data: {
                id: 'ord_123',
                total_amount: 1000,
                currency: 'INR',
                status: 'placed',
                payment_status: 'captured',
                is_paid: true
            },
            error: null
        })

        const payload = {
            event: 'payment.failed',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_xyz',
                        notes: { order_id: 'ord_123' }
                    }
                }
            }
        }
        const req = createMockWebhookRequest(payload, 'evt_failed_delayed')

        const res = await handleWebhook(req)
        expect(res.status).toBe(200)

        // Monotonic protection: should NOT update payment_status to failed
        expect(mockOrdersTable.update).not.toHaveBeenCalled()
    })

    it('records failed_retryable and returns 500 when processing encounters transient error', async () => {
        // Simulate unexpected database error during order update
        mockOrdersTable.maybeSingle.mockResolvedValueOnce({
            data: {
                id: 'ord_123',
                total_amount: 1000,
                currency: 'INR',
                status: 'pending_payment',
                payment_status: 'pending',
                is_paid: false
            },
            error: null
        })
        mockOrdersTable.update.mockImplementationOnce(() => {
            throw new Error('Database connection lost')
        })

        const payload = {
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_xyz',
                        amount: 1000,
                        currency: 'INR',
                        notes: { order_id: 'ord_123' }
                    }
                }
            }
        }
        const req = createMockWebhookRequest(payload, 'evt_transient_error')

        const res = await handleWebhook(req)
        expect(res.status).toBe(500)

        // Verifies event is marked as failed_retryable
        expect(mockEventsTable.update).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'failed_retryable'
            })
        )
    })

    it('allows retry for events marked failed_retryable', async () => {
        mockEventsTable.maybeSingle.mockResolvedValueOnce({
            data: {
                event_id: 'evt_retry_me',
                status: 'failed_retryable',
                updated_at: new Date(Date.now() - 30000).toISOString()
            },
            error: null
        })

        const payload = {
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_xyz',
                        amount: 1000,
                        currency: 'INR',
                        notes: { order_id: 'ord_123' }
                    }
                }
            }
        }
        const req = createMockWebhookRequest(payload, 'evt_retry_me')

        const res = await handleWebhook(req)
        expect(res.status).toBe(200)

        // Event should be reclaimed as processing, then marked processed
        expect(mockEventsTable.update).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'processing' })
        )
        expect(mockEventsTable.update).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'processed' })
        )
    })
})
