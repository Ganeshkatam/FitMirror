export type InventoryAction = 'deduct' | 'restock' | 'reserve' | 'release' | 'audit'

export interface InventoryRecord {
    productId: string
    variantId?: string | null
    size: string
    count: number
    reserved: number
    lastUpdated: Date
}

export interface Reservation {
    token: string
    productId: string
    variantId?: string | null
    size: string
    quantity: number
    expiresAt: Date
    status: 'active' | 'expired' | 'confirmed'
}

export interface StockTransaction {
    id: string
    action: InventoryAction
    quantity: number
    reason?: string
    timestamp: Date
}

// Pure Logic

export function isStockAvailable(record: InventoryRecord, requested: number): boolean {
    return (record.count - record.reserved) >= requested
}

export function calculateAvailableStock(record: InventoryRecord): number {
    return Math.max(0, record.count - record.reserved)
}

/**
 * Attempt to create a reservation. 
 * Returns a Reservation object if successful, null if not.
 */
export function createReservation(
    record: InventoryRecord,
    requested: number,
    durationMinutes: number = 15
): Reservation | null {
    if (!isStockAvailable(record, requested)) return null

    // In a real DB impl, this would be an atomic update. 
    // Here we define the logic for the transformation.

    return {
        token: crypto.randomUUID(), // Valid in Node/Browser
        productId: record.productId,
        variantId: record.variantId,
        size: record.size,
        quantity: requested,
        expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000),
        status: 'active'
    }
}

