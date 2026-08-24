"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2, ShoppingBag, User, Shield, Bell, Palette, Sparkles } from 'lucide-react'

// Define the shape of our preferences JSON
type UserPreferences = {
    // Shopping
    auto_select_size?: boolean
    preferred_fit?: 'slim' | 'regular' | 'relaxed' | null
    hide_out_of_stock?: boolean
    auto_wishlist_oos?: boolean
    confirm_cart_removal?: boolean
    persist_cart?: boolean

    // Body & Try-On
    body_profile_mode?: 'avatar' | 'static_tryon'
    auto_apply_body_profile?: boolean
    remember_last_tryon?: boolean
    show_fit_confidence?: boolean
    retain_tryon_images?: boolean

    // Privacy
    recently_viewed_days?: '0' | '7' | '30'
    show_data_usage_hints?: boolean

    // Communication
    order_update_level?: 'important_only' | 'all'
    promo_offers?: boolean
    promo_new_arrivals?: boolean
    promo_style_tips?: boolean

    // UI & Experience
    default_view?: 'shop' | 'tryon'
    reduce_motion?: boolean
    image_quality?: 'auto' | 'low' | 'high'
}

export function PreferencesForm() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [prefs, setPrefs] = useState<UserPreferences>({
        // Shopping defaults
        auto_select_size: false,
        preferred_fit: null,
        hide_out_of_stock: false,
        auto_wishlist_oos: true,
        confirm_cart_removal: true,
        persist_cart: true,

        // Body & Try-On defaults
        body_profile_mode: 'avatar',
        auto_apply_body_profile: false,
        remember_last_tryon: true,
        show_fit_confidence: true,
        retain_tryon_images: false,

        // Privacy defaults
        recently_viewed_days: '30',
        show_data_usage_hints: true,

        // Communication defaults
        order_update_level: 'all',
        promo_offers: true,
        promo_new_arrivals: true,
        promo_style_tips: false,

        // UI defaults
        default_view: 'shop',
        reduce_motion: false,
        image_quality: 'auto'
    })

    const [initialPrefs, setInitialPrefs] = useState<UserPreferences | null>(null)

    const supabase = createClient()

    useEffect(() => {
        const fetchPrefs = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    setLoading(false)
                    return
                }

                const { data, error } = await supabase
                    .from('user_preferences')
                    .select('preferences')
                    .eq('user_id', user.id)
                    .maybeSingle()

                // Silently handle all errors (table not found, RLS, etc.)
                if (error) {
                    setLoading(false)
                    return
                }

                if (data?.preferences) {
                    // Merge defaults with saved prefs
                    const merged = { ...prefs, ...data.preferences }
                    setPrefs(merged)
                    setInitialPrefs(merged)
                } else {
                    setInitialPrefs(prefs)
                }
            } catch {
                // Silently fail - use defaults
            } finally {
                setLoading(false)
            }
        }
        fetchPrefs()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase]) // Removed dependency on prefs to avoid loop, and logic was effectively mounting only

    const savePreferences = async () => {
        if (JSON.stringify(prefs) === JSON.stringify(initialPrefs)) {
            toast.info("No changes to save")
            return
        }

        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { error } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    preferences: prefs as unknown as Record<string, unknown>,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error
            setInitialPrefs(prefs)
            toast.success("Preferences saved")
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            console.error("Failed to save prefs:", error)
            toast.error("Failed to save: " + message)
        } finally {
            setSaving(false)
        }
    }

    const updatePref = (key: keyof UserPreferences, value: any) => {
        setPrefs(prev => ({ ...prev, [key]: value }))
    }

    if (loading) return <div className="h-48 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex justify-end">
                <Button onClick={savePreferences} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>

            {/* Shopping Flow */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                        <CardTitle>Shopping Experience</CardTitle>
                    </div>
                    <CardDescription>Control how you browse and shop</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label>Auto-Select Available Size</Label>
                            <p className="text-sm text-muted-foreground">Automatically select the first available size when viewing products.</p>
                        </div>
                        <Switch
                            checked={prefs.auto_select_size}
                            onCheckedChange={(c) => updatePref('auto_select_size', c)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="space-y-0.5">
                            <Label>Preferred Fit Style</Label>
                            <p className="text-sm text-muted-foreground">Used for sorting and highlighting recommendations.</p>
                        </div>
                        <Select
                            value={prefs.preferred_fit || 'none'}
                            onValueChange={(v) => updatePref('preferred_fit', v === 'none' ? null : v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="No preference" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Preference</SelectItem>
                                <SelectItem value="slim">Slim Fit</SelectItem>
                                <SelectItem value="regular">Regular Fit</SelectItem>
                                <SelectItem value="relaxed">Relaxed Fit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label>Hide Out of Stock Items</Label>
                            <p className="text-sm text-muted-foreground">Don&apos;t show products that are currently unavailable.</p>
                        </div>
                        <Switch
                            checked={prefs.hide_out_of_stock}
                            onCheckedChange={(c) => updatePref('hide_out_of_stock', c)}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label>Auto-Wishlist on Out of Stock</Label>
                            <p className="text-sm text-muted-foreground">If I click an Out of Stock item, add it to my wishlist instead.</p>
                        </div>
                        <Switch
                            checked={prefs.auto_wishlist_oos}
                            onCheckedChange={(c) => updatePref('auto_wishlist_oos', c)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label>Confirm Cart Removal</Label>
                            <p className="text-sm text-muted-foreground">Ask for confirmation before removing items from cart.</p>
                        </div>
                        <Switch
                            checked={prefs.confirm_cart_removal}
                            onCheckedChange={(c) => updatePref('confirm_cart_removal', c)}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label>Keep Cart Between Sessions</Label>
                            <p className="text-sm text-muted-foreground">Keep items in cart even after logging out. Disable for privacy.</p>
                        </div>
                        <Switch
                            checked={prefs.persist_cart}
                            onCheckedChange={(c) => updatePref('persist_cart', c)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Body & Try-On */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <CardTitle>Body & Try-On</CardTitle>
                    </div>
                    <CardDescription>Customize your virtual try-on experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="space-y-0.5">
                            <Label>Default Try-On Mode</Label>
                            <p className="text-sm text-muted-foreground">Which experience do you prefer?</p>
                        </div>
                        <Select
                            value={prefs.body_profile_mode}
                            onValueChange={(v) => updatePref('body_profile_mode', v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="avatar">3D Avatar (Privacy First)</SelectItem>
                                <SelectItem value="static_tryon">Photo Try-On (Realistic)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label>Auto-Apply Body Profile</Label>
                            <p className="text-sm text-muted-foreground">Automatically load my avatar when entering Try-On.</p>
                        </div>
                        <Switch
                            checked={prefs.auto_apply_body_profile}
                            onCheckedChange={(c) => updatePref('auto_apply_body_profile', c)}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label>Remember Last Try-On</Label>
                            <p className="text-sm text-muted-foreground">Auto-load the last garment you tried when returning.</p>
                        </div>
                        <Switch
                            checked={prefs.remember_last_tryon}
                            onCheckedChange={(c) => updatePref('remember_last_tryon', c)}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label>Show Fit Confidence Score</Label>
                            <p className="text-sm text-muted-foreground">Display AI-calculated fit percentage (e.g. &quot;98% Match&quot;).</p>
                        </div>
                        <Switch
                            checked={prefs.show_fit_confidence}
                            onCheckedChange={(c) => updatePref('show_fit_confidence', c)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Privacy */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <CardTitle>Privacy & Data</CardTitle>
                    </div>
                    <CardDescription>Control how your data is used and retained</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label>Retain Try-On Images</Label>
                            <p className="text-sm text-muted-foreground">Save generated try-on images for faster loading. Disable to auto-delete.</p>
                        </div>
                        <Switch
                            checked={prefs.retain_tryon_images}
                            onCheckedChange={(c) => updatePref('retain_tryon_images', c)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="space-y-0.5">
                            <Label>Recently Viewed History</Label>
                            <p className="text-sm text-muted-foreground">How long should we remember items you&apos;ve seen?</p>
                        </div>
                        <Select
                            value={prefs.recently_viewed_days}
                            onValueChange={(v) => updatePref('recently_viewed_days', v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Disabled (Don&apos;t Remember)</SelectItem>
                                <SelectItem value="7">7 Days</SelectItem>
                                <SelectItem value="30">30 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label>Show Data Transparency Hints</Label>
                            <p className="text-sm text-muted-foreground">Show tooltips explaining how we use your data.</p>
                        </div>
                        <Switch
                            checked={prefs.show_data_usage_hints}
                            onCheckedChange={(c) => updatePref('show_data_usage_hints', c)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Communication */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        <CardTitle>Notifications & Promos</CardTitle>
                    </div>
                    <CardDescription>Control what emails and notifications you receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="space-y-0.5">
                            <Label>Order Updates</Label>
                            <p className="text-sm text-muted-foreground">Which order emails do you want to receive?</p>
                        </div>
                        <Select
                            value={prefs.order_update_level}
                            onValueChange={(v) => updatePref('order_update_level', v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="important_only">Important Only (Shipped/Delivered)</SelectItem>
                                <SelectItem value="all">All Updates (Every Status Change)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <Label>Promotional Content</Label>
                        <p className="text-sm text-muted-foreground mb-3">Choose what promotional content you want to receive.</p>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="promo_offers"
                                checked={prefs.promo_offers}
                                onCheckedChange={(c) => updatePref('promo_offers', c)}
                            />
                            <Label htmlFor="promo_offers" className="font-normal cursor-pointer">
                                Exclusive Offers & Sales
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="promo_arrivals"
                                checked={prefs.promo_new_arrivals}
                                onCheckedChange={(c) => updatePref('promo_new_arrivals', c)}
                            />
                            <Label htmlFor="promo_arrivals" className="font-normal cursor-pointer">
                                New Arrivals Announcements
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="promo_tips"
                                checked={prefs.promo_style_tips}
                                onCheckedChange={(c) => updatePref('promo_style_tips', c)}
                            />
                            <Label htmlFor="promo_tips" className="font-normal cursor-pointer">
                                Style Tips & Inspiration
                            </Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* UI & Experience */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        <CardTitle>UI & Experience</CardTitle>
                    </div>
                    <CardDescription>Customize how the app looks and feels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="space-y-0.5">
                            <Label>Default View</Label>
                            <p className="text-sm text-muted-foreground">What do you want to see first when visiting?</p>
                        </div>
                        <Select
                            value={prefs.default_view}
                            onValueChange={(v) => updatePref('default_view', v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="shop">Shop Collection</SelectItem>
                                <SelectItem value="tryon">Virtual Try-On</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="space-y-0.5">
                            <Label>Image Quality</Label>
                            <p className="text-sm text-muted-foreground">Lower quality uses less data on slow connections.</p>
                        </div>
                        <Select
                            value={prefs.image_quality}
                            onValueChange={(v) => updatePref('image_quality', v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="auto">Auto (Recommended)</SelectItem>
                                <SelectItem value="low">Low (Save Data)</SelectItem>
                                <SelectItem value="high">High (Best Quality)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label>Reduce Motion</Label>
                            <p className="text-sm text-muted-foreground">Disable animations for accessibility or performance.</p>
                        </div>
                        <Switch
                            checked={prefs.reduce_motion}
                            onCheckedChange={(c) => updatePref('reduce_motion', c)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Save Button */}
            <div className="flex justify-end pt-4">
                <Button onClick={savePreferences} disabled={saving} size="lg">
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save All Preferences
                </Button>
            </div>
        </div>
    )
}
