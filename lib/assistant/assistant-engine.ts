// lib/assistant/engine.ts

import { FitMirrorAI, AssistantContext, AssistantResponse } from '@/lib/sdk/ai'

// Re-export types for backward compatibility
export type { AssistantActionType, AssistantResponse } from '@/lib/sdk/ai'

export async function resolveAssistantAction(message: string, context: AssistantContext): Promise<AssistantResponse> {
    const ai = FitMirrorAI.getInstance()

    // Delegate to the AI SDK
    return await ai.resolve(message, context)
}
