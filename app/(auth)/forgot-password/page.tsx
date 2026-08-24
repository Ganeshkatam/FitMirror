'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [email, setEmail] = React.useState('')
    const [sent, setSent] = React.useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        const supabase = createClient()

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
            })

            if (error) {
                toast.error('Failed to send reset email', {
                    description: error.message,
                })
                return
            }

            setSent(true)
            toast.success('Reset email sent!', {
                description: 'Check your inbox for the password reset link.',
            })
        } catch {
            toast.error('Something went wrong.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card glass className="border-0 shadow-xl">
            <CardHeader className="px-4 md:px-6 py-4 md:py-6 pb-2 md:pb-4">
                <CardTitle className="text-xl md:text-2xl font-serif">Forgot Password</CardTitle>
                <CardDescription className="text-sm md:text-base">
                    {sent
                        ? 'Check your email for the reset link'
                        : 'Enter your email and we&apos;ll send you a reset link'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                {sent ? (
                    <div className="text-center py-4 md:py-6">
                        <Mail className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-3 md:mb-4" />
                        <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                            We&apos;ve sent a password reset link to <strong>{email}</strong>
                        </p>
                        <Link href="/login">
                            <Button variant="outline" className="h-10 text-sm">
                                <ArrowLeft className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="grid gap-3 md:gap-4">
                        <div className="grid gap-1.5 md:gap-2">
                            <Label htmlFor="email" className="text-sm">Email</Label>
                            <Input
                                id="email"
                                placeholder="name@example.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="h-10"
                            />
                        </div>
                        <Button disabled={isLoading || !email} className="h-10 text-sm">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Reset Link
                        </Button>
                        <div className="text-center text-xs md:text-sm">
                            <Link href="/login" className="underline text-muted-foreground">
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    )
}
