import { BrevoClient } from '@getbrevo/brevo'

export const brevoClient = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY || 'brevo_key_missing'
})

if (!process.env.BREVO_API_KEY) {
    console.warn('⚠️ BREVO_API_KEY is missing. Emails will not be sent.')
}
