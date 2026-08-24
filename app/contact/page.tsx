import { Metadata } from 'next'
import { ModernHero } from '@/components/home/modern-hero'
import { ContactForm } from '@/components/contact/contact-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Mail, MapPin, Phone, Clock, Send } from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'
export const metadata: Metadata = {
    title: 'Contact Us | FitMirror',
    description: 'Get in touch with the FitMirror team. We are here to help with your fashion journey.',
}

export default function ContactPage() {
    return (
        <div className="bg-stone-50 min-h-screen">
            {/* Hero */}
            {/* <ModernHero
                title="Get in Touch"
                subtitle="We'd love to hear from you. Questions, feedback, or just want to say hello?"
                backgroundImage="https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=2073&auto=format&fit=crop"
                theme="light"
            /> */}
            <SiteHeader />
            <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                    {/* Contact Info */}
                    <div className="space-y-12">
                        <div>
                            <h2 className="font-serif text-3xl md:text-4xl text-gray-900 mb-6">Contact Information</h2>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                Our team is dedicated to providing you with the best virtual try-on experience.
                                Reach out to us through any of the channels below.
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-xl text-gray-900 mb-1">Our Studio</h3>
                                    <p className="text-gray-600">123 Fashion Avenue, <br />Tech District, Bangalore 560001</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 shrink-0">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-xl text-gray-900 mb-1">Email Us</h3>
                                    <p className="text-gray-600">support@fitmirror.com</p>
                                    <p className="text-gray-600">partnerships@fitmirror.com</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                                    <Phone className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-xl text-gray-900 mb-1">Call Us</h3>
                                    <p className="text-gray-600">+91 98765 43210</p>
                                    <p className="text-sm text-gray-500 mt-1">Mon-Fri, 9am - 6pm IST</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <ContactForm />
                </div>
            </div>
        </div>
    )
}
