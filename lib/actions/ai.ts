'use server'

interface GenerateImageResult {
    success: boolean
    imageUrl?: string
    error?: string
}

export async function generateProductImage(prompt: string, style: string = 'studio'): Promise<GenerateImageResult> {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return {
        success: true,
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80'
    }
}
