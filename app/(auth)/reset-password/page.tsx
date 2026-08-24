'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [password, setPassword] = React.useState('')
    const [confirmPassword, setConfirmPassword] = React.useState('')
    const [showPassword, setShowPassword] = React.useState(false)
    const [success, setSuccess] = React.useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error("Passwords don't match")
            return
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setIsLoading(true)
        const supabase = createClient()

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            })

            if (error) {
                toast.error('Failed to reset password', {
                    description: error.message,
                })
                return
            }

            setSuccess(true)
            toast.success('Password updated!')
            setTimeout(() => {
                router.push('/login')
            }, 2000)
        } catch {
            toast.error('Something went wrong.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card glass className="border-0 shadow-xl">
            <CardHeader className="px-4 md:px-6 py-4 md:py-6 pb-2 md:pb-4">
                <CardTitle className="text-xl md:text-2xl font-serif">Reset Password</CardTitle>
                <CardDescription className="text-sm md:text-base">
                    {success ? 'Your password has been updated' : 'Enter your new password'}
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                {success ? (
                    <div className="text-center py-4 md:py-6">
                        <CheckCircle2 className="h-10 w-10 md:h-12 md:w-12 mx-auto text-green-500 mb-3 md:mb-4" />
                        <p className="text-xs md:text-sm text-muted-foreground">
                            Redirecting to login...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="grid gap-3 md:gap-4">
                        <div className="grid gap-1.5 md:gap-2">
                            <Label htmlFor="password" className="text-sm">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="pr-10 h-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="grid gap-1.5 md:gap-2">
                            <Label htmlFor="confirmPassword" className="text-sm">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="h-10"
                            />
                        </div>
                        <Button disabled={isLoading || !password || !confirmPassword} className="h-10 text-sm">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    )
}
