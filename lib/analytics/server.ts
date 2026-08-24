import { PostHog } from 'posthog-node'

export function PostHogClient() {
    return new PostHog(
        process.env.NEXT_PUBLIC_POSTHOG_KEY!,
        { host: process.env.NEXT_PUBLIC_POSTHOG_HOST }
    )
}

export const analytics = {
    track: async (event: string, properties: any, userId?: string) => {
        if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

        const client = PostHogClient()

        client.capture({
            distinctId: userId || 'anonymous',
            event,
            properties
        })

        await client.shutdown()
    },

    identify: async (userId: string, traits: any) => {
        if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

        const client = PostHogClient()

        client.identify({
            distinctId: userId,
            properties: traits
        })

        await client.shutdown()
    }
}
