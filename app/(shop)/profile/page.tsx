import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Settings, Heart, Gift, ShieldCheck, ChevronRight, Edit2, Sparkles, Camera, ShoppingBag, Calendar, Star, Clock, Package, Bell, Shirt, MessageSquare } from 'lucide-react'
import { AvatarUpload } from '@/components/account/avatar-upload'
import { OrderList } from '@/components/account/order-list'
import { StatsSection } from '@/components/account/stats-section'
import { BodyProfileCard } from '@/components/account/body-profile-card'
import { FashionDNA } from '@/components/profile/fashion-dna'
import { VirtualWardrobe } from '@/components/profile/virtual-wardrobe'
import { SignOutButton } from './sign-out-button'
import * as motion from 'framer-motion/client'
import { MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Fetch Profile
    let profile = null
    let orderStats: any[] = []
    let wishlistCount = 0
    let tryonResults: any[] = []
    let recentReviews: any[] = []
    let hasBodyProfile = false

    try {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
        profile = data
    } catch (e) { /* ignore */ }

    // ... (orders fetch) ...

    try {
        const { data } = await supabase
            .from('reviews')
            .select('*, products(id, name, image)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3)
        recentReviews = data || []
    } catch (e) { /* ignore */ }

    try {
        const { data } = await supabase.from('orders').select('total_amount').eq('user_id', user.id)
        orderStats = data || []
    } catch (e) { /* ignore */ }
    const orderCount = orderStats?.length || 0
    const totalSpent = orderStats?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0

    try {
        const { count } = await supabase
            .from('wishlists')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
        wishlistCount = count || 0
    } catch (e) { /* ignore */ }

    try {
        const { data } = await supabase
            .from('tryon_results')
            .select('*, products(id, name, image, price)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(4)
        tryonResults = data || []
    } catch (e) { /* ignore */ }

    try {
        const { data } = await supabase
            .from('reviews')
            .select('*, products(id, name, image)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3)
        recentReviews = data || []
    } catch (e) { /* ignore */ }

    try {
        const { data: settings } = await supabase.from('user_settings').select('preferred_top_size').eq('user_id', user.id).single()
        hasBodyProfile = !!profile?.avatar_url || !!settings?.preferred_top_size
    } catch (e) {
        hasBodyProfile = !!profile?.avatar_url
    }

    // Date formatting
    const timeOfDay = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'

    // Fetch Personalization Data
    let styleProfile = null
    let wardrobeItems: any[] = []

    try {
        const { PersonalizationService } = await import('@/lib/service/personalization')
        const [sp, wi] = await Promise.all([
            PersonalizationService.getStyleProfile(user.id),
            PersonalizationService.getWardrobeItems(user.id)
        ])
        styleProfile = sp
        wardrobeItems = wi
    } catch (e) { console.error(e) }

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* HER HERO: Immersive Header */}
            <div className="relative h-[300px] md:h-[350px] w-full overflow-hidden bg-gray-900">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-900" />
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 mix-blend-overlay" />
                <div className="absolute top-0 right-0 p-12 opacity-30">
                    <div className="w-64 h-64 bg-pink-500 rounded-full blur-[100px]" />
                </div>
                <div className="absolute bottom-0 left-0 p-12 opacity-30">
                    <div className="w-64 h-64 bg-blue-500 rounded-full blur-[100px]" />
                </div>

                {/* Content Container */}
                <div className="container relative z-10 h-full flex flex-col justify-center px-4 md:px-8 pb-12">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative p-1 bg-gray-900 rounded-full ring-4 ring-gray-900/50">
                                <AvatarUpload url={profile?.avatar_url} size={120} />
                            </div>
                            <Link href="/account/settings" className="absolute bottom-0 right-0 bg-white text-gray-900 p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                                <Edit2 className="h-4 w-4" />
                            </Link>
                        </div>

                        {/* User Info */}
                        <div className="text-center md:text-left mb-2 text-white">
                            <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-200 font-medium mb-1">
                                <Sparkles className="h-4 w-4" />
                                <span>{timeOfDay}</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-bold font-serif tracking-tight mb-2 flex items-center gap-3 justify-center md:justify-start">
                                {profile?.display_name || 'Fashionista'}
                                {profile?.role === 'admin' && <ShieldCheck className="h-6 w-6 text-indigo-400" />}
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center text-sm text-gray-300">
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                                    <User className="h-3 w-3" /> {user.email}
                                </span>
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                                    <Calendar className="h-3 w-3" /> Joined {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                </span>
                                {orderCount >= 5 && (
                                    <Badge variant="secondary" className="gap-1.5 bg-amber-500/20 text-amber-200 border-amber-500/30 hover:bg-amber-500/30">
                                        <Star className="h-3 w-3" /> VIP Member
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Quick CTA */}
                        <div className="hidden md:flex ml-auto gap-3 pb-2">
                            <Link href="/account/closet">
                                <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm">
                                    <Shirt className="mr-2 h-4 w-4" /> My Closet
                                </Button>
                            </Link>
                            <Link href="/shop">
                                <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0 shadow-lg shadow-pink-500/25">
                                    <ShoppingBag className="mr-2 h-4 w-4" /> Shop Now
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN DASHBOARD CONTENT */}
            <div className="container px-4 md:px-8 py-8 -mt-8 relative z-[1]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                >

                    {/* LEFT SIDEBAR NAVIGATION */}
                    <div className="hidden lg:block lg:col-span-3 space-y-6">
                        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl sticky top-24">
                            <CardContent className="p-4">
                                <nav className="space-y-1">
                                    <MenuItem href="/profile" icon={User} label="Overview" active />
                                    <MenuItem href="/account/orders" icon={Package} label="Orders" badge={orderCount} />
                                    <MenuItem href="/account/addresses" icon={MapPin} label="Addresses" />
                                    <MenuItem href="/account/wishlist" icon={Heart} label="Wishlist" badge={wishlistCount} color="rose" />
                                    <MenuItem href="/account/closet" icon={Shirt} label="My Closet" />
                                    <MenuItem href="/account/tryon-history" icon={Clock} label="Try-On History" />
                                    <MenuItem href="/account/notifications" icon={Bell} label="Notifications" />
                                    <div className="my-2 border-t border-gray-100" />
                                    <MenuItem href="/account/settings" icon={Settings} label="Settings" />
                                    <MenuItem href="/account/referrals" icon={Gift} label="Referrals" />
                                </nav>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <SignOutButton />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT CONTENT AREA */}
                    <div className="lg:col-span-9 space-y-8">

                        {/* 1. STATS SECTION */}
                        <StatsSection
                            orderCount={orderCount}
                            totalSpent={totalSpent}
                            wishlistCount={wishlistCount}
                            memberSince={new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                            points={0} // TODO: Fetch from database
                            styleScore={0} // TODO: Fetch from database
                        />

                        {/* 1.5 GAMIFICATION SECTION */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 h-[300px]">
                                <FashionDNA profile={styleProfile} />
                            </div>
                            <div className="md:col-span-2 h-[300px]">
                                <VirtualWardrobe items={wardrobeItems} />
                            </div>
                        </div>

                        {/* 2. BODY PROFILE & ACTIONS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <BodyProfileCard hasPhotos={hasBodyProfile} />
                            </div>
                            <div className="md:col-span-1 space-y-4">
                                <Card className="h-full border-0 shadow-md bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden relative group cursor-pointer">
                                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20" />
                                    <CardHeader className="relative z-10 flex flex-col items-center text-center pb-2">
                                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Camera className="h-8 w-8 text-pink-400" />
                                        </div>
                                        <CardTitle className="font-bold text-xl mb-1 text-white">Virtual Try-On</CardTitle>
                                        <CardDescription className="text-gray-400 text-sm">Upload a photo to see how clothes fit you instantly.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="relative z-10 pt-0 px-6 pb-6">
                                        <Link href="/try-on" className="w-full">
                                            <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white border-0">
                                                Open Studio ✨
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>


                            </div>
                        </div>

                        {/* 3. RECENT TRY-ONS (Horizontal Scroll) */}
                        {tryonResults.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-indigo-500" /> Recent Try-Ons
                                    </h2>
                                    <Link href="/account/tryon-history" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
                                        View All
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {tryonResults.map((tryon: any) => (
                                        <Link key={tryon.id} href={`/product/${tryon.products?.id}`} className="group relative aspect-[3/4] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all">
                                            <Image
                                                src={tryon.result_image_url || tryon.products?.image}
                                                alt="Try Effect"
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                <p className="text-white text-sm font-medium truncate">{tryon.products?.name}</p>
                                                <p className="text-white/70 text-xs">View Result</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* OUTFIT BUILDER BANNER */}
                        <div className="rounded-xl bg-gradient-to-r from-indigo-900 to-violet-900 p-4 sm:p-5 text-white shadow-lg relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20" />
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />

                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4 text-center md:text-left">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm shrink-0">
                                        <Shirt className="h-6 w-6 text-indigo-200" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-serif font-bold">Outfit Builder</h3>
                                        <p className="text-indigo-200 text-sm hidden sm:block">Mix & match items to create the perfect look.</p>
                                    </div>
                                </div>
                                <Link href="/outfit-builder" className="w-full md:w-auto">
                                    <Button size="sm" className="w-full md:w-auto bg-white text-indigo-900 hover:bg-indigo-50 border-0 font-medium whitespace-nowrap">
                                        Create Look 🎨
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* 3.5 RECENT REVIEWS */}
                        {recentReviews.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-indigo-500" /> Recent Reviews
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {recentReviews.map((review) => (
                                        <Card key={review.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                                            <CardContent className="p-4 flex gap-3">
                                                <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                                    {review.products?.image && (
                                                        <Image
                                                            src={review.products.image}
                                                            alt={review.products.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1 text-amber-500 mb-1">
                                                        <Star className="h-3 w-3 fill-current" />
                                                        <span className="text-sm font-bold">{review.rating}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 line-clamp-2">{review.comment}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 4. RECENT ORDERS TABLE */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                                    <Package className="h-5 w-5 text-indigo-500" /> Recent Orders
                                </h2>
                            </div>
                            <React.Suspense fallback={<div className="h-40 rounded-xl bg-gray-100 animate-pulse" />}>
                                <OrderList />
                            </React.Suspense>
                        </section>

                    </div>
                </motion.div>
            </div>
        </div>
    )
}

// --- Components ---

function MenuItem({ href, icon: Icon, label, active, badge, color = "blue" }: any) {
    const badgeColors: any = {
        blue: "bg-blue-100 text-blue-700",
        rose: "bg-rose-100 text-rose-700",
    }

    return (
        <Link
            href={href}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group ${active ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
        >
            <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span>{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {badge > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColors[color] || 'bg-gray-100 text-gray-600'}`}>
                        {badge}
                    </span>
                )}
                {!active && <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-all" />}
            </div>
        </Link>
    )
}


