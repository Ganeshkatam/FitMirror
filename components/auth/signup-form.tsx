'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, Smartphone, Mail, Key } from 'lucide-react'
import { SocialAuth } from './social-auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Validation Schemas
const emailPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

const emailOtpSchema = z.object({
    email: z.string().email('Please enter a valid email address.'),
})

const phonePasswordSchema = z.object({
    phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

const phoneOtpSchema = z.object({
    phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number.'),
})

export function SignupForm() {
    const router = useRouter()

    // State
    const [activeTab, setActiveTab] = React.useState<'email' | 'phone'>('email')
    const [useOtp, setUseOtp] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [showPassword, setShowPassword] = React.useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
    const [otpSent, setOtpSent] = React.useState(false)
    const [otpValue, setOtpValue] = React.useState('')

    // Forms
    const emailPasswordForm = useForm<z.infer<typeof emailPasswordSchema>>({
        resolver: zodResolver(emailPasswordSchema),
        defaultValues: { email: '', password: '', confirmPassword: '' },
    })

    const emailOtpForm = useForm<z.infer<typeof emailOtpSchema>>({
        resolver: zodResolver(emailOtpSchema),
        defaultValues: { email: '' },
    })

    const phonePasswordForm = useForm<z.infer<typeof phonePasswordSchema>>({
        resolver: zodResolver(phonePasswordSchema),
        defaultValues: { phone: '', password: '', confirmPassword: '' },
    })

    const phoneOtpForm = useForm<z.infer<typeof phoneOtpSchema>>({
        resolver: zodResolver(phoneOtpSchema),
        defaultValues: { phone: '' },
    })

    // ============ EMAIL + PASSWORD ============
    async function handleEmailPassword(values: z.infer<typeof emailPasswordSchema>) {
        setIsLoading(true)
        const supabase = createClient()

        try {
            const { data, error } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                },
            })

            if (error) {
                toast.error('Signup Failed', { description: error.message })
                return
            }

            toast.success('Account created!', {
                description: 'Please check your email to verify your account.',
            })
            router.push('/login')
        } catch (error) {
            toast.error('Something went wrong.')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    // ============ EMAIL + OTP (Magic Link) ============
    async function handleEmailOtpSend() {
        const email = emailOtpForm.getValues('email')
        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email first')
            return
        }

        setIsLoading(true)
        const supabase = createClient()

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                },
            })

            if (error) {
                toast.error('Failed to send verification', { description: error.message })
                return
            }

            setOtpSent(true)
            toast.success('Verification sent!', {
                description: 'Check your email for the verification code or link.',
            })
        } catch (error) {
            toast.error('Something went wrong.')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleEmailOtpVerify() {
        const email = emailOtpForm.getValues('email')
        if (!otpValue || otpValue.length !== 6) {
            toast.error('Please enter the 6-digit OTP')
            return
        }

        setIsLoading(true)
        const supabase = createClient()

        try {
            const { data: { user }, error } = await supabase.auth.verifyOtp({
                email: email,
                token: otpValue,
                type: 'email',
            })

            if (error) {
                toast.error('Invalid OTP', { description: error.message })
                return
            }

            toast.success('Account verified!')
            router.push('/shop')
            router.refresh()
        } catch (error) {
            toast.error('Verification failed.')
        } finally {
            setIsLoading(false)
        }
    }

    // ============ PHONE + PASSWORD ============
    async function handlePhonePassword(values: z.infer<typeof phonePasswordSchema>) {
        setIsLoading(true)
        const supabase = createClient()

        try {
            const { data, error } = await supabase.auth.signUp({
                phone: values.phone,
                password: values.password,
            })

            if (error) {
                toast.error('Signup Failed', { description: error.message })
                return
            }

            toast.success('Account created!', {
                description: 'Please verify your phone number.',
            })
            router.push('/login')
        } catch (error) {
            toast.error('Something went wrong.')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    // ============ PHONE + OTP ============
    async function handlePhoneOtpSend() {
        const phone = phoneOtpForm.getValues('phone')
        if (!phone || phone.length < 10) {
            toast.error('Please enter a valid phone number')
            return
        }

        setIsLoading(true)
        const supabase = createClient()

        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: phone,
            })

            if (error) {
                toast.error('Failed to send OTP', { description: error.message })
                return
            }

            setOtpSent(true)
            toast.success('OTP sent!', {
                description: 'Check your phone for the verification code.',
            })
        } catch (error) {
            toast.error('Something went wrong.')
        } finally {
            setIsLoading(false)
        }
    }

    async function handlePhoneOtpVerify() {
        const phone = phoneOtpForm.getValues('phone')
        if (!otpValue || otpValue.length !== 6) {
            toast.error('Please enter the 6-digit OTP')
            return
        }

        setIsLoading(true)
        const supabase = createClient()

        try {
            const { data: { user }, error } = await supabase.auth.verifyOtp({
                phone: phone,
                token: otpValue,
                type: 'sms',
            })

            if (error) {
                toast.error('Invalid OTP', { description: error.message })
                return
            }

            toast.success('Account created!')
            router.push('/shop')
            router.refresh()
        } catch (error) {
            toast.error('Verification failed.')
        } finally {
            setIsLoading(false)
        }
    }

    // Reset OTP state when switching
    React.useEffect(() => {
        setOtpSent(false)
        setOtpValue('')
    }, [activeTab, useOtp])

    return (
        <div className="grid gap-6">
            <SocialAuth isLoading={isLoading} />

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>
            {/* Tab Selector: Email vs Phone */}
            <Tabs value={activeTab} onValueChange={(v) => {
                setActiveTab(v as 'email' | 'phone')
                setUseOtp(false)
                setOtpSent(false)
            }}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Email
                    </TabsTrigger>
                    <TabsTrigger value="phone" className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" /> Phone
                    </TabsTrigger>
                </TabsList>

                {/* ============ EMAIL TAB ============ */}
                <TabsContent value="email" className="space-y-4 mt-4">
                    {/* Method Toggle */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={!useOtp ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setUseOtp(false)}
                            className="flex-1"
                        >
                            <Key className="h-4 w-4 mr-1" /> Password
                        </Button>
                        <Button
                            type="button"
                            variant={useOtp ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setUseOtp(true)}
                            className="flex-1"
                        >
                            <Mail className="h-4 w-4 mr-1" /> OTP
                        </Button>
                    </div>

                    {/* Email + Password Form */}
                    {!useOtp && (
                        <form onSubmit={emailPasswordForm.handleSubmit(handleEmailPassword)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email-signup">Email</Label>
                                <Input
                                    id="email-signup"
                                    placeholder="name@example.com"
                                    type="email"
                                    autoComplete="email"
                                    disabled={isLoading}
                                    {...emailPasswordForm.register('email')}
                                />
                                {emailPasswordForm.formState.errors.email && (
                                    <p className="text-sm text-red-500">{emailPasswordForm.formState.errors.email.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-signup">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password-signup"
                                        type={showPassword ? 'text' : 'password'}
                                        disabled={isLoading}
                                        className="pr-10"
                                        {...emailPasswordForm.register('password')}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {emailPasswordForm.formState.errors.password && (
                                    <p className="text-sm text-red-500">{emailPasswordForm.formState.errors.password.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirm-password"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        disabled={isLoading}
                                        className="pr-10"
                                        {...emailPasswordForm.register('confirmPassword')}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {emailPasswordForm.formState.errors.confirmPassword && (
                                    <p className="text-sm text-red-500">{emailPasswordForm.formState.errors.confirmPassword.message}</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account
                            </Button>
                        </form>
                    )}

                    {/* Email + OTP Form */}
                    {useOtp && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email-otp-signup">Email</Label>
                                <Input
                                    id="email-otp-signup"
                                    placeholder="name@example.com"
                                    type="email"
                                    disabled={isLoading || otpSent}
                                    {...emailOtpForm.register('email')}
                                />
                            </div>
                            {otpSent && (
                                <div className="space-y-2">
                                    <Label htmlFor="otp-email-signup">Enter OTP</Label>
                                    <Input
                                        id="otp-email-signup"
                                        placeholder="123456"
                                        maxLength={6}
                                        value={otpValue}
                                        onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                                        disabled={isLoading}
                                        className="text-center text-2xl tracking-widest"
                                    />
                                </div>
                            )}
                            <Button
                                type="button"
                                className="w-full"
                                onClick={otpSent ? handleEmailOtpVerify : handleEmailOtpSend}
                                loading={isLoading}
                            >
                                {otpSent ? 'Verify & Create Account' : 'Send Verification Email'}
                            </Button>
                            {otpSent && (
                                <Button type="button" variant="ghost" className="w-full" onClick={() => setOtpSent(false)}>
                                    Change Email
                                </Button>
                            )}
                        </div>
                    )}
                </TabsContent>

                {/* ============ PHONE TAB ============ */}
                <TabsContent value="phone" className="space-y-4 mt-4">
                    {/* Method Toggle */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={useOtp ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setUseOtp(true)}
                            className="flex-1"
                        >
                            <Smartphone className="h-4 w-4 mr-1" /> OTP
                        </Button>
                        <Button
                            type="button"
                            variant={!useOtp ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setUseOtp(false)}
                            className="flex-1"
                        >
                            <Key className="h-4 w-4 mr-1" /> Password
                        </Button>
                    </div>

                    {/* Phone + OTP Form */}
                    {useOtp && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone-otp-signup">Phone Number</Label>
                                <Input
                                    id="phone-otp-signup"
                                    placeholder="+91 98765 43210"
                                    type="tel"
                                    disabled={isLoading || otpSent}
                                    {...phoneOtpForm.register('phone')}
                                />
                                <p className="text-xs text-muted-foreground">Include country code (e.g., +91)</p>
                            </div>
                            {otpSent && (
                                <div className="space-y-2">
                                    <Label htmlFor="otp-phone-signup">Enter OTP</Label>
                                    <Input
                                        id="otp-phone-signup"
                                        placeholder="123456"
                                        maxLength={6}
                                        value={otpValue}
                                        onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                                        disabled={isLoading}
                                        className="text-center text-2xl tracking-widest"
                                    />
                                </div>
                            )}
                            <Button
                                type="button"
                                className="w-full"
                                onClick={otpSent ? handlePhoneOtpVerify : handlePhoneOtpSend}
                                loading={isLoading}
                            >
                                {otpSent ? 'Verify & Create Account' : 'Send OTP'}
                            </Button>
                            {otpSent && (
                                <Button type="button" variant="ghost" className="w-full" onClick={() => setOtpSent(false)}>
                                    Change Phone Number
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Phone + Password Form */}
                    {!useOtp && (
                        <form onSubmit={phonePasswordForm.handleSubmit(handlePhonePassword)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone-pw-signup">Phone Number</Label>
                                <Input
                                    id="phone-pw-signup"
                                    placeholder="+91 98765 43210"
                                    type="tel"
                                    disabled={isLoading}
                                    {...phonePasswordForm.register('phone')}
                                />
                                <p className="text-xs text-muted-foreground">Include country code (e.g., +91)</p>
                                {phonePasswordForm.formState.errors.phone && (
                                    <p className="text-sm text-red-500">{phonePasswordForm.formState.errors.phone.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-phone-signup">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password-phone-signup"
                                        type={showPassword ? 'text' : 'password'}
                                        disabled={isLoading}
                                        className="pr-10"
                                        {...phonePasswordForm.register('password')}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {phonePasswordForm.formState.errors.password && (
                                    <p className="text-sm text-red-500">{phonePasswordForm.formState.errors.password.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password-phone">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirm-password-phone"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        disabled={isLoading}
                                        className="pr-10"
                                        {...phonePasswordForm.register('confirmPassword')}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {phonePasswordForm.formState.errors.confirmPassword && (
                                    <p className="text-sm text-red-500">{phonePasswordForm.formState.errors.confirmPassword.message}</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account
                            </Button>
                        </form>
                    )}
                </TabsContent>
            </Tabs>

            {/* Login Link */}
            <div className="mt-2 text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="underline font-medium">
                    Sign in
                </Link>
            </div>
        </div>
    )
}
