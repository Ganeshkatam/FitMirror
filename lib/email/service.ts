import React from 'react'
import { brevoClient } from '@/lib/brevo'
import { render } from '@react-email/components'
import { WelcomeEmail } from './templates/welcome'
import { AbandonedCartEmail } from './templates/abandoned-cart'
import { PriceDropEmail } from './templates/price-drop'
import { DeleteAccountEmail } from './templates/delete-account'

// Sender configuration
const SENDER_EMAIL = { name: 'FitMirror', email: 'onboarding@fitmirror.in' }

export const EmailService = {
    async sendWelcomeEmail(email: string, firstName: string) {
        try {
            const html = await render(WelcomeEmail({ firstName }) as React.ReactElement)
            await brevoClient.transactionalEmails.sendTransacEmail({
                subject: 'Welcome to FitMirror',
                htmlContent: html,
                sender: SENDER_EMAIL,
                to: [{ email }]
            })
            return { success: true }
        } catch (error) {
            console.error('Failed to send welcome email:', error)
            return { success: false, error }
        }
    },

    async sendAbandonedCartEmail(email: string, items: any[], checkoutUrl: string) {
        try {
            const html = await render(AbandonedCartEmail({ items, checkoutUrl }) as React.ReactElement)
            await brevoClient.transactionalEmails.sendTransacEmail({
                subject: 'You left something behind',
                htmlContent: html,
                sender: SENDER_EMAIL,
                to: [{ email }]
            })
            return { success: true }
        } catch (error) {
            console.error('Failed to send abandoned cart email:', error)
            return { success: false, error }
        }
    },

    async sendPriceDropEmail(email: string, product: any, oldPrice: number, newPrice: number) {
        try {
            const html = await render(PriceDropEmail({
                productName: product.name,
                productImage: product.image,
                oldPrice,
                newPrice,
                productUrl: `https://fitmirror.app/product/${product.slug || product.id}`
            }) as React.ReactElement)
            await brevoClient.transactionalEmails.sendTransacEmail({
                subject: 'Price Drop Alert',
                htmlContent: html,
                sender: SENDER_EMAIL,
                to: [{ email }]
            })
            return { success: true }
        } catch (error) {
            console.error('Failed to send price drop email:', error)
            return { success: false, error }
        }
    },

    async sendContactEmail(data: { fromName: string; fromEmail: string; subject: string; message: string }) {
        try {
            await brevoClient.transactionalEmails.sendTransacEmail({
                subject: `New Contact Form Message: ${data.subject}`,
                htmlContent: `
                    <h2>New Message from ${data.fromName}</h2>
                    <p><strong>Email:</strong> ${data.fromEmail}</p>
                    <p><strong>Subject:</strong> ${data.subject}</p>
                    <hr />
                    <h3>Message:</h3>
                    <p>${data.message.replace(/\n/g, '<br/>')}</p>
                `,
                sender: SENDER_EMAIL,
                to: [{ email: 'support@fitmirror.com' }],
                replyTo: { email: data.fromEmail, name: data.fromName }
            })
            return { success: true }
        } catch (error) {
            console.error('Failed to send contact email:', error)
            return { success: false, error }
        }
    },

    async sendDeleteAccountEmail(email: string, token: string) {
        try {
            const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/account/delete/verify?token=${token}`
            const html = await render(DeleteAccountEmail({ confirmUrl }) as React.ReactElement)
            await brevoClient.transactionalEmails.sendTransacEmail({
                subject: 'Confirm Account Deletion',
                htmlContent: html,
                sender: SENDER_EMAIL,
                to: [{ email }]
            })
            return { success: true }
        } catch (error) {
            console.error('Failed to send delete account email:', error)
            return { success: false, error }
        }
    }
}
