import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredReservations } from '@/lib/actions/inventory-reservations'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        // Optional: Add authorization check
        const authHeader = request.headers.get('authorization')
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const result = await cleanupExpiredReservations()

        return NextResponse.json({
            success: true,
            cleaned: result.cleaned,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Cleanup failed:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
