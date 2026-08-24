'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, Smartphone, Mail, Key, Fingerprint } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { SocialAuth } from './social-auth'

// Auth Method Types
type AuthMethod = 'email-password' | 'email-otp' | 'phone-password' | 'phone-otp' | 'passkey'

// Validation Schemas
const emailPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
})

const emailOtpSchema = z.object({
    email: z.string().email('Please enter a valid email address.'),
    otp: z.string().optional(),
})

const phonePasswordSchema = z.object({
    phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
})

const phoneOtpSchema = z.object({
    phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number.'),
    otp: z.string().optional(),
})

const passkeySchema = z.object({
    email: z.string().email('Please enter a valid email address.'),
})

export function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const queryRole = searchParams?.get('role')

    // State
    const [activeTab, setActiveTab] = React.useState<'email' | 'phone'>('email')
    const [authMethod, setAuthMethod] = React.useState<AuthMethod>('email-password')
    const [isLoading, setIsLoading] = React.useState(false)
    const [showPassword, setShowPassword] = React.useState(false)
    const [otpSent, setOtpSent] = React.useState(false)
    const [otpValue, setOtpValue] = React.useState('')

    // Email + Password Form
    const emailPasswordForm = useForm<z.infer<typeof emailPasswordSchema>>({
        resolver: zodResolver(emailPasswordSchema),
        defaultValues: { email: '', password: '' },
    })

    // Email OTP Form
    const emailOtpForm = useForm<z.infer<typeof emailOtpSchema>>({
        resolver: zodResolver(emailOtpSchema),
        defaultValues: { email: '' },
    })

    // Phone + Password Form
    const phonePasswordForm = useForm<z.infer<typeof phonePasswordSchema>>({
        resolver: zodResolver(phonePasswordSchema),
        defaultValues: { phone: '', password: '' },
    })

    // Phone OTP Form
    const phoneOtpForm = useForm<z.infer<typeof phoneOtpSchema>>({
        resolver: zodResolver(phoneOtpSchema),
        defaultValues: { phone: '' },
    })

    // Passkey Form
    const passkeyForm = useForm<z.infer<typeof passkeySchema>>({
        resolver: zodResolver(passkeySchema),
        defaultValues: { email: '' },
    })

    // Post-login handler with role-based redirect
    async function handlePostLogin(user: any) {
        const supabase = createClient()

        // Always fetch profile to determine role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const userRole = profile?.role || 'customer'

        // Role-based redirect
        switch (userRole) {
            case 'admin':
                toast.success('Welcome back, Admin!')
                router.push('/platform-admin')
                break

            case 'seller':
                // Even if role is seller, redirect to shop or show error since seller portal is gone
                toast.success('Welcome back!')
                router.push('/shop')
                break

            default:
                // Customer
                toast.success('Welcome back!')
                router.push('/shop')
        }

        router.refresh()
    }



    // ============ EMAIL + PASSWORD ============
    async function handleEmailPassword(values: z.infer<typeof emailPasswordSchema>) {
        setIsLoading(true)
        const supabase = createClient()

        try {
            const { data: { user }, error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            })

            if (error) {
                toast.error('Login Failed', { description: error.message })
                return
            }

            await handlePostLogin(user)
        } catch (error) {
            toast.error('Something went wrong.')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    // ============ EMAIL + OTP ============
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
                toast.error('Failed to send OTP', { description: error.message })
                return
            }

            setOtpSent(true)
            toast.success('OTP sent!', { description: 'Check your email for the verification code.' })
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

            await handlePostLogin(user)
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
            const { data: { user }, error } = await supabase.auth.signInWithPassword({
                phone: values.phone,
                password: values.password,
            })

            if (error) {
                toast.error('Login Failed', { description: error.message })
                return
            }

            await handlePostLogin(user)
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
            toast.success('OTP sent!', { description: 'Check your phone for the verification code.' })
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

            await handlePostLogin(user)
        } catch (error) {
            toast.error('Verification failed.')
        } finally {
            setIsLoading(false)
        }
    }

    // ============ PASSKEY (WebAuthn) ============
    async function handlePasskeyLogin() {
        const email = passkeyForm.getValues('email')
        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email first')
            return
        }

        setIsLoading(true)
        const supabase = createClient()

        try {
            // Note: Passkey requires Supabase Pro plan and proper configuration
            // This is a simplified example - actual implementation may vary
            const { data, error } = await (supabase.auth as any).signInWithPasskey?.({
                email: email,
            })

            if (error) {
                // Fallback: If passkey not supported, offer alternatives
                if (error.message.includes('not supported') || error.message.includes('not configured')) {
                    toast.error('Passkey not available', {
                        description: 'Please use email or phone login instead.'
                    })
                } else {
                    toast.error('Passkey login failed', { description: error.message })
                }
                return
            }

            await handlePostLogin(data?.user)
        } catch (error: any) {
            // Handle WebAuthn errors gracefully
            if (error?.name === 'NotAllowedError') {
                toast.error('Passkey cancelled or not allowed')
            } else if (error?.name === 'NotSupportedError') {
                toast.error('Passkey not supported on this device')
            } else {
                toast.error('Something went wrong with passkey.')
            }
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    // Reset OTP state when switching methods
    React.useEffect(() => {
        setOtpSent(false)
        setOtpValue('')
    }, [authMethod])

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
                setAuthMethod(v === 'email' ? 'email-password' : 'phone-otp')
                setOtpSent(false)
                setOtpValue('')
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
                    {/* Auth Method Selector */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={authMethod === 'email-password' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAuthMethod('email-password')}
                            className="flex-1"
                        >
                            <Key className="h-4 w-4 mr-1" /> Password
                        </Button>
                        <Button
                            type="button"
                            variant={authMethod === 'email-otp' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAuthMethod('email-otp')}
                            className="flex-1"
                        >
                            <Mail className="h-4 w-4 mr-1" /> OTP
                        </Button>
                        <Button
                            type="button"
                            variant={authMethod === 'passkey' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAuthMethod('passkey')}
                            className="flex-1"
                        >
                            <Fingerprint className="h-4 w-4 mr-1" /> Passkey
                        </Button>
                    </div>

                    {/* Email + Password Form */}
                    {authMethod === 'email-password' && (
                        <form onSubmit={emailPasswordForm.handleSubmit(handleEmailPassword)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email-pw">Email</Label>
                                <Input
                                    id="email-pw"
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
                                <div className="flex items-center">
                                    <Label htmlFor="password-email">Password</Label>
                                    <Link href="/forgot-password" className="ml-auto text-sm underline">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password-email"
                                        type={showPassword ? 'text' : 'password'}
                                        disabled={isLoading}
                                        className="pr-10"
                                        {...emailPasswordForm.register('password')}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {emailPasswordForm.formState.errors.password && (
                                    <p className="text-sm text-red-500">{emailPasswordForm.formState.errors.password.message}</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full" loading={isLoading}>
                                Sign In with Email
                            </Button>
                        </form>
                    )}

                    {/* Email + OTP Form */}
                    {authMethod === 'email-otp' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email-otp">Email</Label>
                                <Input
                                    id="email-otp"
                                    placeholder="name@example.com"
                                    type="email"
                                    disabled={isLoading || otpSent}
                                    {...emailOtpForm.register('email')}
                                />
                            </div>
                            {otpSent && (
                                <div className="space-y-2">
                                    <Label htmlFor="otp-email">Enter OTP</Label>
                                    <Input
                                        id="otp-email"
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
                                {otpSent ? 'Verify OTP' : 'Send OTP to Email'}
                            </Button>
                            {otpSent && (
                                <Button type="button" variant="ghost" className="w-full" onClick={() => setOtpSent(false)}>
                                    Change Email
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Passkey Form */}
                    {authMethod === 'passkey' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email-passkey">Email</Label>
                                <Input
                                    id="email-passkey"
                                    placeholder="name@example.com"
                                    type="email"
                                    disabled={isLoading}
                                    {...passkeyForm.register('email')}
                                />
                            </div>
                            <Button type="button" className="w-full" onClick={handlePasskeyLogin} loading={isLoading}>
                                <Fingerprint className="mr-2 h-4 w-4" />
                                Sign In with Passkey
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                Use your device&apos;s biometrics or security key
                            </p>
                        </div>
                    )}
                </TabsContent>

                {/* ============ PHONE TAB ============ */}
                <TabsContent value="phone" className="space-y-4 mt-4">
                    {/* Auth Method Selector */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={authMethod === 'phone-otp' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAuthMethod('phone-otp')}
                            className="flex-1"
                        >
                            <Smartphone className="h-4 w-4 mr-1" /> OTP
                        </Button>
                        <Button
                            type="button"
                            variant={authMethod === 'phone-password' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAuthMethod('phone-password')}
                            className="flex-1"
                        >
                            <Key className="h-4 w-4 mr-1" /> Password
                        </Button>
                    </div>

                    {/* Phone + OTP Form */}
                    {authMethod === 'phone-otp' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone-otp">Phone Number</Label>
                                <Input
                                    id="phone-otp"
                                    placeholder="+91 98765 43210"
                                    type="tel"
                                    disabled={isLoading || otpSent}
                                    {...phoneOtpForm.register('phone')}
                                />
                                <p className="text-xs text-muted-foreground">Include country code (e.g., +91)</p>
                            </div>
                            {otpSent && (
                                <div className="space-y-2">
                                    <Label htmlFor="otp-phone">Enter OTP</Label>
                                    <Input
                                        id="otp-phone"
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
                                {otpSent ? 'Verify OTP' : 'Send OTP to Phone'}
                            </Button>
                            {otpSent && (
                                <Button type="button" variant="ghost" className="w-full" onClick={() => setOtpSent(false)}>
                                    Change Phone Number
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Phone + Password Form */}
                    {authMethod === 'phone-password' && (
                        <form onSubmit={phonePasswordForm.handleSubmit(handlePhonePassword)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone-pw">Phone Number</Label>
                                <Input
                                    id="phone-pw"
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
                                <div className="flex items-center">
                                    <Label htmlFor="password-phone">Password</Label>
                                    <Link href="/forgot-password" className="ml-auto text-sm underline">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password-phone"
                                        type={showPassword ? 'text' : 'password'}
                                        disabled={isLoading}
                                        className="pr-10"
                                        {...phonePasswordForm.register('password')}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {phonePasswordForm.formState.errors.password && (
                                    <p className="text-sm text-red-500">{phonePasswordForm.formState.errors.password.message}</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full" loading={isLoading}>
                                Sign In with Phone
                            </Button>
                        </form>
                    )}
                </TabsContent>
            </Tabs>

            {/* Signup Link */}
            <div className="mt-2 text-center text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="underline font-medium">
                    Sign up
                </Link>
            </div>
        </div>
    )
}
