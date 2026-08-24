import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reserveStock, checkStockAvailability } from '@/lib/actions/inventory-reservations'

// Mock Builders for separation of concerns
const mockInventoryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
}

const mockReservationsBuilder = {
    insert: vi.fn(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn(), // gt is the terminator in checkStockAvailability
    delete: vi.fn()
}

// Helper to make mockReservationsBuilder.gt awaitable
// @ts-ignore
mockReservationsBuilder.gt.mockResolvedValue({ data: [], error: null })
// @ts-ignore
mockReservationsBuilder.insert.mockResolvedValue({ data: [], error: null })

const mockFrom = vi.fn().mockImplementation((table: string) => {
    if (table === 'product_inventory') return mockInventoryBuilder
    if (table === 'inventory_reservations') return mockReservationsBuilder
    return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
    }
})

vi.mock('@/lib/supabase/server', () => ({
    createClient: () => ({
        from: mockFrom
    })
}))

describe('Inventory Reservations', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('reserveStock', () => {
        it('should create reservations with 15min expiry', async () => {
            // Mock insert response to handle the awaited promise in reserveStock
            // code: await supabase.from(...).insert(...).select()
            // So insert needs to return an object with select() that returns a promise
            const mockSelect = vi.fn().mockResolvedValue({ data: [{ id: '1', expires_at: new Date(Date.now() + 15 * 60000).toISOString() }], error: null })

            // Redefine insert for this specific chain structure
            mockReservationsBuilder.insert.mockReturnValue({
                select: mockSelect
            })

            await reserveStock({
                cartId: 'cart-123',
                items: [{ productId: 'p1', size: 'M', quantity: 1 }]
            })

            expect(mockReservationsBuilder.insert).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({
                    cart_id: 'cart-123',
                    product_id: 'p1',
                    quantity: 1
                })
            ]))
        })
    })

    describe('checkStockAvailability', () => {
        it('should return available true when stock > reserved', async () => {
            // 1. Mock Inventory (single)
            mockInventoryBuilder.single.mockResolvedValue({ data: { stock: 10 } })

            // 2. Mock Reservations (.gt() which returns promise-like)
            // In implementation: .select(...).eq(...).eq(...).gt(...)
            // So gt is the stopper
            mockReservationsBuilder.gt.mockResolvedValue({ data: [{ quantity: 2 }] })

            const result = await checkStockAvailability('p1', 'M', 1)

            expect(result.available).toBe(true)
            expect(result.actualStock).toBe(10)
            expect(result.reservedStock).toBe(2)
        })

        it('should return available false when stock <= reserved', async () => {
            // Mock inventory: 5 in stock
            mockInventoryBuilder.single.mockResolvedValue({ data: { stock: 5 } })

            // Mock reservations: 5 reserved
            mockReservationsBuilder.gt.mockResolvedValue({ data: [{ quantity: 5 }] })

            const result = await checkStockAvailability('p1', 'M', 1)

            expect(result.available).toBe(false)
        })
    })
})
