import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cancelOrder } from '@/lib/actions/orders'

// Mock next/cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn()
}))

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

describe('Order Cancellation Security & Atomic Invariant Matrix', () => {
    let mockSupabase: any

    beforeEach(() => {
        vi.clearAllMocks()

        mockSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: { user: { id: 'user_alice' } },
                    error: null
                })
            },
            rpc: vi.fn().mockResolvedValue({
                data: { success: true, order_id: 'ord_123' },
                error: null
            })
        }

        vi.mocked(createClient).mockResolvedValue(mockSupabase)
    })

    it('rejects cancellation when user is not authenticated', async () => {
        mockSupabase.auth.getUser.mockResolvedValueOnce({
            data: { user: null },
            error: null
        })

        await expect(cancelOrder('ord_123')).rejects.toThrow('Unauthorized')
        expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('does not send client-provided p_user_id to the database RPC', async () => {
        await cancelOrder('ord_123')

        expect(mockSupabase.rpc).toHaveBeenCalledWith('cancel_order', {
            p_order_id: 'ord_123',
            p_reason: 'User cancelled'
        })

        // Confirms p_user_id was NOT sent as parameter (bound inside DB via auth.uid())
        const rpcArgs = mockSupabase.rpc.mock.calls[0][1]
        expect(rpcArgs).not.toHaveProperty('p_user_id')
    })

    it('propagates authorization failure on cross-user cancellation attempt', async () => {
        // RPC detects order.user_id !== auth.uid() and raises Forbidden exception
        mockSupabase.rpc.mockResolvedValueOnce({
            data: null,
            error: { message: 'Forbidden: order does not belong to authenticated user' }
        })

        await expect(cancelOrder('ord_victim_456')).rejects.toThrow(
            'Forbidden: order does not belong to authenticated user'
        )
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('aborts and rolls back when an inventory row is missing for restocking', async () => {
        // RPC detects missing inventory row and raises exception
        mockSupabase.rpc.mockResolvedValueOnce({
            data: null,
            error: { message: 'Inventory row missing for product prod_999 and size M' }
        })

        await expect(cancelOrder('ord_corrupted_789')).rejects.toThrow(
            'Inventory row missing for product prod_999 and size M'
        )
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('revalidates paths and returns payload upon atomic cancellation success', async () => {
        const result = await cancelOrder('ord_123')

        expect(result).toEqual({ success: true, order_id: 'ord_123' })
        expect(revalidatePath).toHaveBeenCalledWith('/account/orders/ord_123')
        expect(revalidatePath).toHaveBeenCalledWith('/account/orders')
    })
})

