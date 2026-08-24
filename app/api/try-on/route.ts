import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { client } from "@gradio/client"

export const maxDuration = 300 // Allow up to 5 minutes for queueing

interface TryOnRequest {
    personImageUrl: string
    garmentImageUrl: string
    category?: 'tops' | 'bottoms' | 'one-pieces'
}

// Helper to fetch blob from URL
// Helper to fetch blob from URL (supports http/s and data:)
async function fetchBlob(url: string): Promise<Blob> {
    if (url.startsWith('data:')) {
        const [meta, base64Data] = url.split(',')
        const mimeType = meta.split(':')[1].split(';')[0]
        const buffer = Buffer.from(base64Data, 'base64')
        return new Blob([buffer], { type: mimeType })
    }

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch image: ${url}`)
    return await res.blob()
}

// Gradio implementation (Free)
async function processGradioTryOn(personUrl: string, garmentUrl: string, category: string) {
    try {
        console.log("Fetching images for Gradio...")
        const personBlob = await fetchBlob(personUrl)
        const garmentBlob = await fetchBlob(garmentUrl)

        let lastError;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`Gradio attempt ${attempt}/3...`)

                // Connect to a fresh client to avoid stale states
                const app = await client("yisol/IDM-VTON")

                // Race Gradio with a timeout
                const result = await Promise.race([
                    (async () => {
                        const prediction = await app.predict("/tryon", [
                            { "background": personBlob, "layers": [], "composite": null },
                            garmentBlob,
                            category || "clothing item",
                            true,
                            true,
                            40, // Max allowed steps for yisol/IDM-VTON
                            Math.floor(Math.random() * 10000)
                        ]) as any
                        return prediction?.data?.[0]?.url
                    })(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Gradio timeout")), 120000)) // 2 mins per attempt
                ])

                if (!result) throw new Error("No image returned")

                return NextResponse.json({
                    success: true,
                    resultImage: result,
                    provider: 'gradio-idm-vton',
                })

            } catch (e) {
                console.warn(`Attempt ${attempt} failed:`, e)
                lastError = e
                if (attempt < 3) await new Promise(r => setTimeout(r, 3000)) // Wait 3s
            }
        }

        // If all retries fail
        throw lastError

    } catch (error) {
        console.error("Gradio Try-On Error:", error)
        throw error // Propagate to fallback
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please login to use Virtual Try-On.' },
                { status: 401 }
            )
        }

        const { personImageUrl, garmentImageUrl, category = 'tops' } = await req.json() as TryOnRequest

        if (!personImageUrl || !garmentImageUrl) {
            return NextResponse.json(
                { error: 'Missing required images' },
                { status: 400 }
            )
        }

        const replicateKey = process.env.REPLICATE_API_TOKEN
        const fashnKey = process.env.FASHN_API_KEY

        // Priority 1: Fashn.ai (Best Quality)
        if (fashnKey) {
            return await processFashnTryOn(personImageUrl, garmentImageUrl, category, fashnKey)
        }

        // Priority 2: Replicate (Good Quality, Paid)
        if (replicateKey) {
            return await processReplicateTryOn(personImageUrl, garmentImageUrl, replicateKey)
        }

        // Priority 3: Gradio (Free, but might be busy/slow)
        try {
            // Race Gradio with a timeout to prevent hanging
            const result = await Promise.race([
                processGradioTryOn(personImageUrl, garmentImageUrl, category),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Gradio timeout")), 300000))
            ])
            return result as NextResponse
        } catch (gradioError) {
            console.warn("Gradio failed or timed out:", gradioError)
            // Fallback to Simulation/Demo Mode
            return await simulateTryOn(personImageUrl, garmentImageUrl)
        }

    } catch (error) {
        console.error('Try-On Error:', error)
        return NextResponse.json(
            {
                error: 'Failed to generate try-on',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

// --- Previous Providers ---

// Fashn.ai implementation
async function processFashnTryOn(
    personUrl: string,
    garmentUrl: string,
    category: string,
    apiKey: string
) {
    const response = await fetch('https://api.fashn.ai/v1/run', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model_image: personUrl,
            garment_image: garmentUrl,
            category: category,
        }),
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Fashn API error: ${error}`)
    }

    const data = await response.json()

    // Poll for result if async
    if (data.id && !data.output) {
        return await pollFashnResult(data.id, apiKey)
    }

    return NextResponse.json({
        success: true,
        resultImage: data.output || data.image,
        provider: 'fashn',
    })
}

async function pollFashnResult(runId: string, apiKey: string): Promise<NextResponse> {
    const maxAttempts = 30
    const pollInterval = 2000 // 2 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval))

        const response = await fetch(`https://api.fashn.ai/v1/status/${runId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        })

        const data = await response.json()

        if (data.status === 'completed' && data.output) {
            return NextResponse.json({
                success: true,
                resultImage: data.output,
                provider: 'fashn',
            })
        }

        if (data.status === 'failed') {
            throw new Error('Try-on generation failed')
        }
    }

    throw new Error('Try-on generation timed out')
}

// Replicate IDM-VTON implementation
async function processReplicateTryOn(personUrl: string, garmentUrl: string, apiKey: string) {
    // Start prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            version: 'c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4',
            input: {
                human_img: personUrl,
                garm_img: garmentUrl,
                garment_des: 'clothing item',
            },
        }),
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Replicate API error: ${error}`)
    }

    const prediction = await response.json()

    // Poll for result
    return await pollReplicateResult(prediction.id, apiKey)
}

async function pollReplicateResult(predictionId: string, apiKey: string): Promise<NextResponse> {
    const maxAttempts = 60
    const pollInterval = 1000

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval))

        const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: {
                'Authorization': `Token ${apiKey}`,
            },
        })

        const data = await response.json()

        if (data.status === 'succeeded' && data.output) {
            return NextResponse.json({
                success: true,
                resultImage: Array.isArray(data.output) ? data.output[0] : data.output,
                provider: 'replicate',
            })
        }

        if (data.status === 'failed') {
            throw new Error(data.error || 'Try-on generation failed')
        }
    }

    throw new Error('Try-on generation timed out')
}

// Demo/Simulation mode when no API key is configured
async function simulateTryOn(personUrl: string, garmentUrl: string) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000))

    // In demo mode, we'll return the garment image with a demo overlay
    // In production, this would be the actual try-on result
    return NextResponse.json({
        success: true,
        resultImage: garmentUrl, // In demo, show the garment
        provider: 'demo',
        message: 'Free API busy - Showing demo result. Try again later for real AI try-on!',
    })
}
