'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { submitContactForm } from '@/lib/actions/contact'

export function ContactForm() {
    const [pending, setPending] = useState(false)
    const [success, setSuccess] = useState(false)

    async function handleSubmit(formData: FormData) {
        setPending(true)
        try {
            const result = await submitContactForm(formData)
            if (result.success) {
                setSuccess(true)
                toast.success('Message sent successfully!')
            } else {
                toast.error('Failed to send message. Please try again.')
            }
        } catch (error) {
            toast.error('An unexpected error occurred.')
        } finally {
            setPending(false)
        }
    }

    if (success) {
        return (
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-serif text-2xl text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600 mb-8 max-w-xs">
                    Thank you for reaching out. We've received your message and will get back to you shortly.
                </p>
                <Button variant="outline" onClick={() => setSuccess(false)}>
                    Send Another Message
                </Button>
            </div>
        )
    }

    return (
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 h-full">
            <h2 className="font-serif text-2xl md:text-3xl text-gray-900 mb-6">Send us a Message</h2>
            <form action={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-gray-700">Name</label>
                        <Input id="name" name="name" placeholder="John Doe" required className="bg-gray-50 border-gray-200 focus:bg-white transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                        <Input id="email" name="email" type="email" placeholder="john@example.com" required className="bg-gray-50 border-gray-200 focus:bg-white transition-colors" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium text-gray-700">Subject</label>
                    <Input id="subject" name="subject" placeholder="How can we help?" required className="bg-gray-50 border-gray-200 focus:bg-white transition-colors" />
                </div>

                <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-gray-700">Message</label>
                    <Textarea id="message" name="message" placeholder="Type your message here..." required className="bg-gray-50 border-gray-200 focus:bg-white transition-colors min-h-[150px]" />
                </div>

                <Button type="submit" size="lg" className="w-full bg-indigo-900 hover:bg-indigo-800 text-white" disabled={pending}>
                    {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {pending ? 'Sending...' : 'Send Message'}
                </Button>
            </form>
        </div>
    )
}
