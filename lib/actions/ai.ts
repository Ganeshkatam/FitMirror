'use server'

/**
 * Mock implementation of AI Image Generation.
 * In production, replace with Fal.ai, Replicate, or OpenAI DALL-E 3 calls.
 */

interface GenerateImageResult {
    success: boolean
    imageUrl?: string
    error?: string
}

export async function generateVTON(
    userImage: string,
    garmentImage: string,
    category: 'tops' | 'bottoms' | 'one-pieces'
): Promise<GenerateImageResult> {
    console.log(`[AI] Starting VTON Job...`)
    console.log(`[AI] Category: ${category}`)

    // VALIDATION
    if (!userImage || !garmentImage) {
        return { success: false, error: 'Missing images for try-on' }
    }

    // 1. SIMULATION MODE (Default)
    // ---------------------------------------------------------
    // In a real implementation, this would call Fal.ai 'idm-vton'

    // Simulate Network Latency (Processing Time)
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Return a "Success" Mock
    // We return the user's original image (or a placeholder) 
    // effectively "pretending" it worked for the UI flow.
    // Ideally, we'd return a pre-generated result if we had one.

    return {
        success: true,
        imageUrl: userImage, // In simulation, we just return the input or a placeholder
        // Use a slightly different placeholder if we want to show "change":
        // imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80'
    }
}

/**
 * Legacy/General Helper
 */
export async function generateProductImage(prompt: string, style: string = 'studio'): Promise<GenerateImageResult> {
    // ... (keep existing)
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 2000))
    return {
        success: true,
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80'
    }
}

/**
 * Alias for try-on-modal compatibility
 * Accepts userId and productImage per the TryOnModal usage pattern
 */
export async function generateUserTryOn(
    userId: string,
    productImage: string,
    options?: { profileId?: string }
): Promise<GenerateImageResult> {
    // In simulation mode, we just return the product image as-is
    // In production, we would fetch the user's profile image and call VTON
    console.log(`[AI] generateUserTryOn for user ${userId}, profile ${options?.profileId}`)

    await new Promise(resolve => setTimeout(resolve, 2000))

    return {
        success: true,
        imageUrl: productImage // Return product image as "result" in simulation
    }
}
