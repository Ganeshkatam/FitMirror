import { brevoClient } from '@/lib/brevo'

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
    if (!process.env.BREVO_API_KEY) {
        console.warn('BREVO_API_KEY is not set. Email not sent.')
        return
    }

    try {
        await brevoClient.transactionalEmails.sendTransacEmail({
            subject,
            htmlContent: html,
            sender: { name: "FitMirror", email: "orders@fitmirror.in" },
            to: [{ email: to }]
        })
    } catch (error) {
        console.error('Failed to send email:', error)
        throw error
    }
}

export async function sendSMS({ to, message }: { to: string, message: string }) {
    // SMS Provider implementation
    // Currently logging to console as no provider is configured.
    // TODO: Integrate with MSG91, Twilio, or AWS SNS based on user preference.
    if (!to) return

    console.log(`[SMS] To: ${to}, Message: ${message}`)

    // Example generic HTTP call if env vars were present
    /*
    if (process.env.SMS_API_URL) {
        await fetch(process.env.SMS_API_URL, {
            method: 'POST',
            body: JSON.stringify({ to, message, key: process.env.SMS_API_KEY })
        })
    }
    */
}

export async function sendReturnCreatedNotification(user: { email: string, phone?: string }, returnId: string, orderNumber: string) {
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/account/orders?tab=return`

    // Email
    await sendEmail({
        to: user.email,
        subject: `Return Request Received - Order #${orderNumber}`,
        html: `
            <h1>Return Request Received</h1>
            <p>We have received your return request for Order #${orderNumber}.</p>
            <p>Return ID: <strong>${returnId}</strong></p>
            <p>Status: <strong>Requested</strong></p>
            <p>We will review your request and notify you once approved.</p>
            <a href="${trackingUrl}">Track Return Status</a>
        `
    })

    // SMS
    if (user.phone) {
        await sendSMS({
            to: user.phone,
            message: `FitMirror: Return request for Order #${orderNumber} received. Return ID: ${returnId}. Track status: ${trackingUrl}`
        })
    }
}
