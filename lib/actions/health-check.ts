'use server'

import { logError } from '@/lib/logger/server'
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

    try {
        const dbStart = performance.now()
        const { error } = await supabase.from('products').select('id').limit(1)
        if (error) throw error
        result.checks.database = { status: 'ok', latency: Math.round(performance.now() - dbStart) }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Database connectivity check failed'
        result.checks.database = { status: 'error', message }
        result.status = 'error'
        await logError(`Health Check Failed: Database - ${message}`, { severity: 'critical', path: 'Health Check' })
    }

    try {
        const { error } = await supabase.from('collections').select('id').limit(1)
        if (error) throw error
        result.checks.content = { status: 'ok' }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Content check failed'
        result.checks.content = { status: 'error', message }
        result.status = 'error'
        await logError(`Health Check Failed: Content - ${message}`, { severity: 'error', path: 'Health Check' })
    }

    try {
        const { error } = await supabase.from('products').select('id').limit(1)
        if (error) throw error
        result.checks.products = { status: 'ok' }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Product check failed'
        result.checks.products = { status: 'error', message }
        await logError(`Health Check Failed: Products - ${message}`, { severity: 'warning', path: 'Health Check' })
    }

    try {
        const { error } = await supabase.auth.getSession()
        if (error) throw error
        result.checks.auth = { status: 'ok' }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Auth check failed'
        result.checks.auth = { status: 'error', message }
        result.status = 'error'
        await logError(`Health Check Failed: Auth - ${message}`, { severity: 'critical', path: 'Health Check' })
    }

    return result
}
