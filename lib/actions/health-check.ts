'use server'

import { logError } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

interface HealthResult {
    status: 'ok' | 'error'
    checks: {
        database: { status: 'ok' | 'error', message?: string, latency?: number }
        content: { status: 'ok' | 'error', message?: string }
        products: { status: 'ok' | 'error', message?: string }
        auth: { status: 'ok' | 'error', message?: string }
    }
    timestamp: string
}

export async function runHealthCheck(): Promise<HealthResult> {
    const start = performance.now()
    const supabase = await createClient()

    const result: HealthResult = {
        status: 'ok',
        checks: {
            database: { status: 'ok' },
            content: { status: 'ok' },
            products: { status: 'ok' },
            auth: { status: 'ok' }
        },
        timestamp: new Date().toISOString()
    }

    // 1. Database Connectivity & Latency
    try {
        const dbStart = performance.now()
        const { error } = await supabase.from('system_errors').select('count', { count: 'exact', head: true })
        if (error) throw error
        result.checks.database = { status: 'ok', latency: Math.round(performance.now() - dbStart) }
    } catch (e: any) {
        result.checks.database = { status: 'error', message: e.message }
        result.status = 'error'
        await logError(`Health Check Failed: Database - ${e.message}`, { severity: 'critical', path: 'Health Check' })
    }

    // 2. Content Table Check
    try {
        const { error } = await supabase.from('collections').select('id').limit(1)
        if (error) throw error
        result.checks.content = { status: 'ok' }
    } catch (e: any) {
        result.checks.content = { status: 'error', message: e.message }
        result.status = 'error'
        await logError(`Health Check Failed: Content - ${e.message}`, { severity: 'error', path: 'Health Check' })
    }

    // 3. Products Check
    try {
        const { error } = await supabase.from('products').select('id').limit(1)
        if (error) throw error
        result.checks.products = { status: 'ok' }
    } catch (e: any) {
        result.checks.products = { status: 'error', message: e.message }
        // Don't fail overall health if products table acts up, just section
        // result.status = 'error' 
        await logError(`Health Check Failed: Products - ${e.message}`, { severity: 'warning', path: 'Health Check' })
    }

    // 4. Auth Service Check (dummy call)
    try {
        const { error } = await supabase.auth.getSession()
        if (error) throw error
        result.checks.auth = { status: 'ok' }
    } catch (e: any) {
        result.checks.auth = { status: 'error', message: e.message }
        result.status = 'error'
        await logError(`Health Check Failed: Auth - ${e.message}`, { severity: 'critical', path: 'Health Check' })
    }

    return result
}
