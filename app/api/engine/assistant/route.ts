import { NextResponse } from 'next/server'
import { resolveAssistantAction } from '@/lib/assistant/assistant-engine'

interface AssistantRequest {
    message: string
    page?: string
    store_id?: string
    user_context?: any
}

export async function POST(req: Request) {
    try {
        const body = await req.json() as AssistantRequest
        const { message, page, store_id, user_context } = body

        if (!message) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 })
        }

        // Logic is pure function -> Easy to test
        const response = resolveAssistantAction(message, {
            page,
            store_id,
            user_context
        })

        return NextResponse.json(response)

    } catch (e) {
        console.error('Assistant Engine Error:', e)
        return NextResponse.json(
            { error: 'Assistant failed', details: e instanceof Error ? e.message : 'Unknown' },
            { status: 500 }
        )
    }
}
