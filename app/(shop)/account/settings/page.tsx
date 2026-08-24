'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, User, Shield, Ruler, Bell, ChevronRight, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { updateProfile, updateUserSettings, requestPasswordUpdate, verifyOtpAndUpdatePassword, requestDeletionLink, getProfile, getUserSettings } from '@/lib/actions/settings'
import { AvatarUpload } from '@/components/account/avatar-upload'

const settingsSections = [
    { id: 'account', label: 'Account', icon: User, description: 'Profile & personal info' },
    { id: 'size', label: 'Body Profile', icon: Ruler, description: 'Measurements & sizing' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Email & push alerts' },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield, description: 'Data & security settings' },
]

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL']
const waistSizes = ['26', '28', '30', '32', '34', '36', '38', '40', '42']

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState('account')
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [settings, setSettings] = useState<any>(null)
    const [loading, setLoading] = useState(true)


    useEffect(() => {
        async function loadUserData() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            console.log('User:', user)

            if (user) {
                setUser(user)

                // Fetch profile via server action (handles auto-creation)
                const { profile: profileData, error: profileError } = await getProfile()
                console.log('Profile from server action:', { profileData, profileError })
                setProfile(profileData)

                // Fetch settings via server action (handles auto-creation)
                const { settings: settingsData, error: settingsError } = await getUserSettings()
                console.log('Settings from server action:', { settingsData, settingsError })
                setSettings(settingsData || {})
            }
            setLoading(false)
        }
        loadUserData()
    }, [])

    if (loading) {
        return (
            <div className="container max-w-6xl mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="container max-w-6xl mx-auto px-4 py-8 text-center">
                <p>Please log in to access settings.</p>
                <Link href="/login">
                    <Button className="mt-4">Login</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="container max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/profile">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-gray-900">Settings</h1>
                    <p className="text-muted-foreground">Manage your account and preferences</p>
                </div>
            </div>

            {/* Main Layout: Sidebar + Content - Fixed ratio at all sizes */}
            <div className="flex gap-4">
                {/* Sidebar - 25% width */}
                <div className="w-1/4 min-w-[180px] shrink-0">
                    <Card className="sticky top-24 border-0 shadow-sm">
                        <CardContent className="p-2">
                            <nav className="space-y-1">
                                {settingsSections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={cn(
                                            "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all",
                                            activeSection === section.id
                                                ? "bg-indigo-50 text-indigo-700"
                                                : "hover:bg-gray-50 text-gray-700"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-1.5 rounded-lg shrink-0",
                                            activeSection === section.id
                                                ? "bg-indigo-100 text-indigo-600"
                                                : "bg-gray-100 text-gray-500"
                                        )}>
                                            <section.icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{section.label}</p>
                                            <p className="text-xs text-muted-foreground truncate hidden sm:block">{section.description}</p>
                                        </div>
                                        <ChevronRight className={cn(
                                            "h-4 w-4 shrink-0 hidden sm:block",
                                            activeSection === section.id ? "text-indigo-500" : "text-gray-300"
                                        )} />
                                    </button>
                                ))}
                            </nav>
                        </CardContent>
                    </Card>
                </div>

                {/* Content Area - 75% width */}
                <div className="flex-1 min-w-0">
                    {activeSection === 'account' && <AccountSection user={user} profile={profile} />}
                    {activeSection === 'size' && <SizeSection user={user} settings={settings} />}
                    {activeSection === 'notifications' && <NotificationsSection user={user} settings={settings} />}
                    {activeSection === 'privacy' && <PrivacySection user={user} />}
                </div>
            </div>
        </div>
    )
}

// ============ ACCOUNT SECTION ============
function AccountSection({ user, profile }: { user: any, profile: any }) {
    const [localProfile, setLocalProfile] = useState(profile)
    const [displayName, setDisplayName] = useState(profile?.display_name || '')
    const [phone, setPhone] = useState(profile?.phone || '')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')


    const handleSave = async () => {
        setSaving(true)
        setError('')
        setSaved(false)

        const result = await updateProfile({
            display_name: displayName,
            phone: phone,
        })

        console.log('Server action result:', result)

        if (result.error) {
            setError(result.error)
        } else {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        }
        setSaving(false)
    }

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your personal details and profile information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center space-y-4 mb-6">
                    <AvatarUpload
                        url={localProfile?.avatar_url}
                        size={100}
                        onUpload={(url) => setLocalProfile({ ...localProfile, avatar_url: url })}
                    />
                    <Label className="text-muted-foreground font-normal">Tap to change profile photo</Label>
                </div>
                <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input value={user?.email || ''} disabled className="bg-gray-50" />
                    <p className="text-xs text-muted-foreground">Your email address is verified and cannot be changed.</p>
                </div>
                <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your full name"
                    />
                    <p className="text-xs text-muted-foreground">This is how your name will appear on orders and reviews.</p>
                </div>
                <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                    />
                    <p className="text-xs text-muted-foreground">Used for order updates and delivery coordination.</p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        <span>⚠️</span> {error}
                    </div>
                )}
                {saved && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                        <Check className="h-4 w-4" /> Changes saved successfully!
                    </div>
                )}

                <Button className="w-full" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </CardContent>
        </Card>
    )
}

// ============ SIZE SECTION ============
function SizeSection({ user, settings }: { user: any, settings: any }) {
    const [topSize, setTopSize] = useState(settings?.preferred_top_size || '')
    const [bottomSize, setBottomSize] = useState(settings?.preferred_bottom_size || '')
    const [dressSize, setDressSize] = useState(settings?.preferred_dress_size || '')
    const [measurementUnit, setMeasurementUnit] = useState(settings?.measurement_unit || 'metric')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')

    const handleSave = async () => {
        setSaving(true)
        setError('')
        setSaved(false)

        const supabase = createClient()
        const { error: upsertError } = await supabase
            .from('user_settings')
            .upsert({
                user_id: user.id,
                preferred_top_size: topSize,
                preferred_bottom_size: bottomSize,
                preferred_dress_size: dressSize,
                measurement_unit: measurementUnit,
            }, { onConflict: 'user_id' })

        if (upsertError) {
            setError(upsertError.message)
        } else {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        }
        setSaving(false)
    }

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle>Body Profile & Sizes</CardTitle>
                <CardDescription>Set your preferred sizes for personalized recommendations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <Label>Preferred Top Size (Shirts, T-shirts, Jackets)</Label>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map(size => (
                            <button
                                key={size}
                                onClick={() => setTopSize(size)}
                                className={cn(
                                    "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                                    topSize === size
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                                )}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <Label>Preferred Bottom Size (Pants, Jeans)</Label>
                    <div className="flex flex-wrap gap-2">
                        {waistSizes.map(size => (
                            <button
                                key={size}
                                onClick={() => setBottomSize(size)}
                                className={cn(
                                    "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                                    bottomSize === size
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                                )}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <Label>Preferred Dress/Kurta Size</Label>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map(size => (
                            <button
                                key={size}
                                onClick={() => setDressSize(size)}
                                className={cn(
                                    "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                                    dressSize === size
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                                )}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <Label>Measurement Unit</Label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMeasurementUnit('metric')}
                            className={cn(
                                "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                                measurementUnit === 'metric'
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                            )}
                        >
                            Metric (cm, kg)
                        </button>
                        <button
                            onClick={() => setMeasurementUnit('imperial')}
                            className={cn(
                                "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                                measurementUnit === 'imperial'
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                            )}
                        >
                            Imperial (in, lbs)
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        <span>⚠️</span> {error}
                    </div>
                )}
                {saved && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                        <Check className="h-4 w-4" /> Size preferences saved!
                    </div>
                )}

                <Button className="w-full" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {saving ? 'Saving...' : 'Save Size Preferences'}
                </Button>
            </CardContent>
        </Card>
    )
}

// ============ NOTIFICATIONS SECTION ============
function NotificationsSection({ user, settings }: { user: any, settings: any }) {
    const [orderUpdates, setOrderUpdates] = useState(settings?.email_order_updates ?? true)
    const [promotions, setPromotions] = useState(settings?.email_promotions ?? false)
    const [weeklyDigest, setWeeklyDigest] = useState(settings?.email_weekly_digest ?? false)
    const [newArrivals, setNewArrivals] = useState(settings?.email_new_arrivals ?? false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')

    const handleSave = async () => {
        setSaving(true)
        setError('')
        setSaved(false)

        const supabase = createClient()
        const { error: upsertError } = await supabase
            .from('user_settings')
            .upsert({
                user_id: user.id,
                email_order_updates: orderUpdates,
                email_promotions: promotions,
                email_weekly_digest: weeklyDigest,
                email_new_arrivals: newArrivals,
            }, { onConflict: 'user_id' })

        if (upsertError) {
            setError(upsertError.message)
        } else {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        }
        setSaving(false)
    }

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to hear from us.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-1">
                        <Label className="text-base font-medium">Order Updates</Label>
                        <p className="text-sm text-muted-foreground">Shipping, delivery, and order status notifications.</p>
                    </div>
                    <Switch checked={orderUpdates} onCheckedChange={setOrderUpdates} />
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-1">
                        <Label className="text-base font-medium">Promotions & Sales</Label>
                        <p className="text-sm text-muted-foreground">Exclusive deals, discounts, and seasonal sales.</p>
                    </div>
                    <Switch checked={promotions} onCheckedChange={setPromotions} />
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-1">
                        <Label className="text-base font-medium">Weekly Style Digest</Label>
                        <p className="text-sm text-muted-foreground">Curated fashion picks and style tips every week.</p>
                    </div>
                    <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
                </div>

                <div className="flex items-center justify-between py-3">
                    <div className="space-y-1">
                        <Label className="text-base font-medium">New Arrivals</Label>
                        <p className="text-sm text-muted-foreground">Be the first to know about new products.</p>
                    </div>
                    <Switch checked={newArrivals} onCheckedChange={setNewArrivals} />
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        <span>⚠️</span> {error}
                    </div>
                )}
                {saved && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                        <Check className="h-4 w-4" /> Notification preferences saved!
                    </div>
                )}

                <Button className="w-full" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
            </CardContent>
        </Card>
    )
}

// ============ PRIVACY SECTION ============
function PrivacySection({ user }: { user: any }) {
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [showOtpForm, setShowOtpForm] = useState(false) // New state for OTP
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [otp, setOtp] = useState('') // New state for OTP input
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleRequestPasswordUpdate = async () => {
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }
        setSaving(true)
        setError('')
        setMessage('')

        // 1. Request OTP
        const result = await requestPasswordUpdate(user.email)

        if (result.error) {
            setError(result.error)
            setSaving(false)
        } else {
            setMessage('OTP sent to your email! Please verify.')
            setShowOtpForm(true) // Switch to OTP view
            setSaving(false)
        }
    }

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 6) {
            setError('Please enter a valid 6-digit OTP')
            return
        }
        setSaving(true)
        setError('')

        // 2. Verify OTP and Update Password
        const result = await verifyOtpAndUpdatePassword(user.email, otp, newPassword)

        if (result.error) {
            setError(result.error)
        } else {
            setMessage('Password updated successfully!')
            setNewPassword('')
            setConfirmPassword('')
            setOtp('')
            setTimeout(() => {
                setShowPasswordForm(false)
                setShowOtpForm(false)
                setMessage('')
            }, 2000)
        }
        setSaving(false)
    }

    const handleDeleteAccount = async () => {
        if (!confirm('Are you absolutely sure you want to delete your account?\n\nThis will permanently delete:\n• Your profile and settings\n\nThis action CANNOT be undone.')) {
            return
        }

        setSaving(true)
        const result = await requestDeletionLink()
        setSaving(false)

        if (result.error) {
            alert(result.error)
        } else {
            alert('Verification email sent!\n\nPlease check your inbox and click the link to confirm account deletion.')
        }
    }

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your password to keep your account secure.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!showPasswordForm ? (
                        <Button variant="outline" className="w-full" onClick={() => setShowPasswordForm(true)}>
                            Change Password
                        </Button>
                    ) : (
                        <div className="space-y-4">
                            {!showOtpForm ? (
                                // Step 1: Enter New Password
                                <>
                                    <div className="space-y-2">
                                        <Label>New Password</Label>
                                        <Input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password (min 6 characters)"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Confirm Password</Label>
                                        <Input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter new password"
                                        />
                                    </div>
                                </>
                            ) : (
                                // Step 2: Enter OTP
                                <div className="space-y-2">
                                    <Label>Verification Code</Label>
                                    <Input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="Enter the 6-digit code sent to your email"
                                        maxLength={6}
                                        className="text-center tracking-widest text-lg"
                                    />
                                    <p className="text-xs text-muted-foreground text-center">
                                        We sent a code to {user?.email}
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                                    <span>⚠️</span> {error}
                                </div>
                            )}
                            {message && (
                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                                    <Check className="h-4 w-4" /> {message}
                                </div>
                            )}

                            <div className="flex gap-3">
                                {!showOtpForm ? (
                                    <Button onClick={handleRequestPasswordUpdate} disabled={saving} className="flex-1">
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        {saving ? 'Sending OTP...' : 'Send Verification Code'}
                                    </Button>
                                ) : (
                                    <Button onClick={handleVerifyOtp} disabled={saving} className="flex-1">
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        {saving ? 'Verifying...' : 'Verify & Update Password'}
                                    </Button>
                                )}

                                <Button variant="ghost" onClick={() => {
                                    setShowPasswordForm(false)
                                    setShowOtpForm(false)
                                    setNewPassword('')
                                    setConfirmPassword('')
                                    setOtp('')
                                    setError('')
                                }}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-red-100">
                <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions that affect your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={handleDeleteAccount}
                    >
                        Delete My Account
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        This will permanently delete your account and all associated data.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
