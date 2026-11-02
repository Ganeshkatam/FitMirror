import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as handleWebhook } from '@/app/api/webhooks/razorpay/route'
import crypto from 'crypto'

const WEBHOOK_SECRET = 'test_webhook_secret'

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

describe('Razorpay Webhook Robustness & Atomic RPC Lifecycle Matrix', () => {
    let mockSupabase: any
    let mockEventsTable: any

    beforeEach(() => {
        vi.clearAllMocks()
        process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET

        mockEventsTable = {
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null })
            })
        }

        mockSupabase = {
            from: vi.fn((table: string) => {
                if (table === 'payment_webhook_events') return mockEventsTable
                return {
                    update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
                }
            }),
            rpc: vi.fn().mockImplementation((rpcName: string, params: any) => {
                if (rpcName === 'claim_payment_webhook_event') {
                    return Promise.resolve({
                        data: { success: true, claimed: true, action: 'new_claim' },
                        error: null
                    })
                }
                if (rpcName === 'record_captured_payment') {
                    return Promise.resolve({
                        data: { success: true, order_id: params.p_order_id, payment_status: 'captured' },
                        error: null
                    })
                }
                if (rpcName === 'record_payment_status') {
                    return Promise.resolve({
                        data: { success: true, status: params.p_new_status },
                        error: null
                    })
                }
                if (rpcName === 'release_webhook_claim_on_failure') {
                    return Promise.resolve({ data: null, error: null })
                }
                return Promise.resolve({ data: null, error: null })
            })
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

    it('handles duplicate events idempotently via atomic claim RPC without reprocessing', async () => {
        mockSupabase.rpc.mockImplementationOnce((rpcName: string) => {
            if (rpcName === 'claim_payment_webhook_event') {
                return Promise.resolve({
                    data: { success: true, claimed: false, action: 'already_processed' },
                    error: null
                })
            }
            return Promise.resolve({ data: null, error: null })
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
        expect(mockSupabase.rpc).not.toHaveBeenCalledWith('record_captured_payment', expect.anything())
    })

    it('processes payment.captured atomically via record_captured_payment RPC', async () => {
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
        const json = await res.json()
        expect(json.status).toBe('success')
        expect(json.order_id).toBe('ord_123')

        // Verifies atomic claim and captured payment RPCs were executed
        expect(mockSupabase.rpc).toHaveBeenCalledWith('claim_payment_webhook_event', expect.objectContaining({
            p_event_id: 'evt_captured_1',
            p_event_type: 'payment.captured'
        }))
        expect(mockSupabase.rpc).toHaveBeenCalledWith('record_captured_payment', expect.objectContaining({
            p_order_id: 'ord_123',
            p_event_id: 'evt_captured_1',
            p_razorpay_payment_id: 'pay_xyz',
            p_razorpay_order_id: 'order_rzp_1',
            p_amount: 1000,
            p_currency: 'INR'
        }))
    })

    it('delegates authorized and failed events to record_payment_status RPC', async () => {
        const payload = {
            event: 'payment.authorized',
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
        const req = createMockWebhookRequest(payload, 'evt_authorized_1')

        const res = await handleWebhook(req)
        expect(res.status).toBe(200)

        expect(mockSupabase.rpc).toHaveBeenCalledWith('record_payment_status', expect.objectContaining({
            p_order_id: 'ord_123',
            p_event_id: 'evt_authorized_1',
            p_new_status: 'authorized',
            p_razorpay_payment_id: 'pay_xyz',
            p_razorpay_order_id: 'order_rzp_1'
        }))
    })

    it('releases claim on transient failure and returns 500 for provider retry', async () => {
        mockSupabase.rpc.mockImplementation((rpcName: string) => {
            if (rpcName === 'claim_payment_webhook_event') {
                return Promise.resolve({
                    data: { success: true, claimed: true, action: 'new_claim' },
                    error: null
                })
            }
            if (rpcName === 'record_captured_payment') {
                return Promise.resolve({
                    data: null,
                    error: new Error('Postgres connection pool exhausted')
                })
            }
            if (rpcName === 'release_webhook_claim_on_failure') {
                return Promise.resolve({ data: null, error: null })
            }
            return Promise.resolve({ data: null, error: null })
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

        // Verifies release_webhook_claim_on_failure RPC was called to unblock worker retries
        expect(mockSupabase.rpc).toHaveBeenCalledWith('release_webhook_claim_on_failure', expect.objectContaining({
            p_event_id: 'evt_transient_error',
            p_error_message: expect.stringContaining('Postgres connection pool exhausted')
        }))
    })

    it('handles in-flight concurrent requests by returning 200 in_flight without duplicate processing', async () => {
        mockSupabase.rpc.mockImplementationOnce((rpcName: string) => {
            if (rpcName === 'claim_payment_webhook_event') {
                return Promise.resolve({
                    data: { success: true, claimed: false, action: 'in_flight_locked', status: 'processing' },
                    error: null
                })
            }
            return Promise.resolve({ data: null, error: null })
        })

        const payload = {
            event: 'payment.captured',
            payload: { payment: { entity: { notes: { order_id: 'ord_123' }, amount: 1000, currency: 'INR' } } }
        }
        const req = createMockWebhookRequest(payload, 'evt_in_flight')

        const res = await handleWebhook(req)
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.status).toBe('in_flight')
        expect(mockSupabase.rpc).not.toHaveBeenCalledWith('record_captured_payment', expect.anything())
    })
})
