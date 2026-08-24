import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Log frontend and client errors to database error_logs
export async function POST(req: Request) {
    try {
        const body = await req.json()

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const errorLog = {
            error_type: body.error_type || 'frontend',
            severity: body.severity || 'error',
            message: body.message || 'Unknown error',
            stack_trace: body.stack_trace || null,
            url: body.url || null,
            user_id: body.user_id || null,
            user_agent: req.headers.get('user-agent') || null,
            metadata: body.metadata || {},
        }

        const { error } = await supabase
            .from('error_logs')
            .insert(errorLog)

        if (error) {
            console.error('[TelemetryErrorLog] Failed to insert:', error.message)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('[TelemetryErrorLog] API Error:', message)
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
