import { NextRequest, NextResponse } from 'next/server'
import { resolveAssistantAction } from '@/lib/assistant'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { message, context } = body
        const supabase = await createClient()

        // Securely get user context
        const { data: { user } } = await supabase.auth.getUser()

        // Resolve action using the Assistant Engine
        // (This runs shared logic from packages/assistant)
        const response = await resolveAssistantAction(message, {
            ...context,
            supabase, // Inject database client
            user_context: {
                userId: user?.id,
                ...context?.user_context // allow other client-provided context if needed (e.g. location), but userId is critical
            }
        })

        return NextResponse.json(response)
    } catch (error: any) {
        console.error("Assistant API Error:", error)
        return NextResponse.json(
            { error: "Failed to process request", detail: error.message },
            { status: 500 }
        )
    }
}
