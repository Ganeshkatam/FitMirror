'use server'

import { EmailService } from '@/lib/email/service'
import { z } from 'zod'

const contactSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    subject: z.string().min(3),
    message: z.string().min(10)
})

export async function submitContactForm(formData: FormData) {
    const rawData = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message')
    }

    const result = contactSchema.safeParse(rawData)

    if (!result.success) {
        return { success: false, error: 'Invalid form data' }
    }

    const { name, email, subject, message } = result.data

    try {
        // Send email to support/admin
        await EmailService.sendContactEmail({
            fromName: name,
            fromEmail: email,
            subject,
            message
        })
        return { success: true }
    } catch (error) {
        console.error('Contact form submission failed:', error)
        return { success: false, error: 'Failed to send message' }
    }
}
