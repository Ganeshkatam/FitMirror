'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Sparkles, Shield, Heart, Zap, Users, Award, ArrowRight, CheckCircle2 } from 'lucide-react'

const stats = [
    { value: '50K+', label: 'Happy Customers', icon: Users },
    { value: '99%', label: 'Fit Accuracy', icon: Award },
    { value: '2M+', label: 'Try-Ons Daily', icon: Zap },
]

const features = [
    {
        icon: Zap,
        title: 'AI-Powered Try-On',
        description: 'Our cutting-edge AI shows you exactly how clothes will look on YOUR body. Upload one photo, try on thousands of outfits in seconds.',
        gradient: 'from-amber-500 to-orange-500',
        bgGlow: 'bg-amber-500/20',
    },
    {
        icon: Shield,
        title: 'Privacy First',
        description: 'Your photos are encrypted end-to-end, never shared with third parties, and you can delete them anytime with one click.',
        gradient: 'from-blue-500 to-cyan-500',
        bgGlow: 'bg-blue-500/20',
    },
    {
        icon: Heart,
        title: 'For Every Body',
        description: 'Sizes XS to 4XL. Our technology works beautifully on all body types because fashion should be truly inclusive.',
        gradient: 'from-pink-500 to-rose-500',
        bgGlow: 'bg-pink-500/20',
    },
]

const values = [
    'See clothes on your body before buying',
    '85% reduction in returns',
    'Free shipping on all orders',
    '30-day hassle-free returns',
]

export default function AboutPage() {
    return (
        <div className="min-h-screen overflow-hidden">
            {/* Hero Section - Immersive & Bold */}
            <section className="relative w-full py-16 md:py-32 overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950" />
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-amber-400/20 to-rose-400/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />

                <div className="container px-4 md:px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border shadow-lg mb-6 md:mb-8 animate-fade-in">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span className="text-xs md:text-sm font-medium">Revolutionizing Online Fashion</span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold tracking-tight mb-4 md:mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
                                See It On You
                            </span>
                            <br />
                            <span className="bg-gradient-to-r from-amber-600 via-rose-500 to-purple-600 bg-clip-text text-transparent">
                                Before You Buy
                            </span>
                        </h1>

                        <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            FitMirror uses AI-powered virtual try-on technology to eliminate the guesswork from online shopping.
                            No more returns. No more disappointment. Just confidence.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
                            <Link href="/shop">
                                <Button size="lg" className="w-full sm:w-auto h-12 md:h-14 px-8 md:px-10 rounded-full bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 dark:from-white dark:to-gray-200 dark:text-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-base">
                                    Try It Now
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="/shop">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 md:h-14 px-8 md:px-10 rounded-full border-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:-translate-y-1 text-base">
                                    Browse Collection
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative w-full py-12 md:py-16 bg-white dark:bg-gray-900 border-y">
                <div className="container px-4 md:px-6">
                    <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto">
                        {stats.map((stat, index) => (
                            <div
                                key={stat.label}
                                className="text-center animate-fade-in"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 dark:from-amber-900/30 dark:to-rose-900/30 mb-2 md:mb-3">
                                    <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-amber-600 dark:text-amber-400" />
                                </div>
                                <p className="text-2xl md:text-4xl font-bold font-serif bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                    {stat.value}
                                </p>
                                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section - Premium Cards */}
            <section className="w-full py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
                <div className="container px-4 md:px-6">
                    <div className="max-w-3xl mx-auto text-center mb-10 md:mb-16">
                        <h2 className="text-2xl md:text-4xl font-serif font-bold mb-3 md:mb-4">
                            Why FitMirror?
                        </h2>
                        <p className="text-sm md:text-lg text-muted-foreground">
                            We&apos;re not just another fashion website. We&apos;re changing how you shop forever.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
                        {features.map((feature, index) => (
                            <Card
                                key={feature.title}
                                className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white dark:bg-gray-900 animate-fade-in"
                                style={{ animationDelay: `${index * 0.15}s` }}
                            >
                                {/* Glow Effect */}
                                <div className={`absolute -top-20 -right-20 w-40 h-40 ${feature.bgGlow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                <div className="relative p-6 md:p-8">
                                    {/* Icon */}
                                    <div className={`inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg mb-4 md:mb-5`}>
                                        <feature.icon className="h-6 w-6 md:h-7 md:w-7" />
                                    </div>

                                    <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Story Section - Modern Timeline */}
            <section className="w-full py-16 md:py-24 bg-white dark:bg-gray-950">
                <div className="container px-4 md:px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
                            {/* Left - Story */}
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    OUR STORY
                                </div>
                                <h2 className="text-2xl md:text-4xl font-serif font-bold leading-tight">
                                    Born from a
                                    <span className="bg-gradient-to-r from-amber-600 to-rose-500 bg-clip-text text-transparent"> frustration</span>,
                                    built with
                                    <span className="bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent"> passion</span>
                                </h2>
                                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                    Every woman knows the struggle: you find a gorgeous dress online, order it with excitement,
                                    wait for days, only to discover it doesn&apos;t fit right or look the way you imagined.
                                    Returns are a hassle. Time is wasted. Confidence takes a hit.
                                </p>
                                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                    We built FitMirror to end that cycle forever. Using the latest in AI and computer vision,
                                    we show you exactly how clothes will look on YOUR body—before you buy.
                                </p>
                            </div>

                            {/* Right - Check List */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-rose-100 dark:from-amber-900/20 dark:to-rose-900/20 rounded-3xl blur-2xl" />
                                <div className="relative bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl border">
                                    <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6">The FitMirror Promise</h3>
                                    <div className="space-y-3 md:space-y-4">
                                        {values.map((value, index) => (
                                            <div
                                                key={value}
                                                className="flex items-center gap-3 animate-fade-in"
                                                style={{ animationDelay: `${index * 0.1}s` }}
                                            >
                                                <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                                                    <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-white" />
                                                </div>
                                                <span className="text-sm md:text-base font-medium">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section - Bold & Immersive */}
            <section className="relative w-full py-16 md:py-24 overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(251,191,36,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(244,63,94,0.15),transparent_50%)]" />

                {/* Floating Elements */}
                <div className="absolute top-10 left-10 w-20 h-20 border border-white/10 rounded-full animate-float" />
                <div className="absolute bottom-10 right-10 w-32 h-32 border border-white/10 rounded-full animate-float" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-amber-400/50 rounded-full blur-sm animate-pulse" />
                <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-rose-400/50 rounded-full blur-sm animate-pulse" style={{ animationDelay: '0.5s' }} />

                <div className="container px-4 md:px-6 relative z-10">
                    <div className="max-w-3xl mx-auto text-center text-white">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 md:mb-8">
                            <Sparkles className="h-4 w-4 text-amber-400" />
                            <span className="text-xs md:text-sm font-medium">Join 50,000+ Happy Customers</span>
                        </div>

                        <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4 md:mb-6">
                            Ready to Experience the
                            <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent"> Perfect Fit</span>?
                        </h2>
                        <p className="text-base md:text-lg text-white/70 mb-8 md:mb-10 max-w-xl mx-auto">
                            Stop guessing. Start knowing. Try on any outfit from our collection and shop with complete confidence.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                            <Link href="/shop">
                                <Button size="lg" className="w-full sm:w-auto h-12 md:h-14 px-8 md:px-10 rounded-full bg-white text-gray-900 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-base font-semibold">
                                    Start Shopping
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="/try-on">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 md:h-14 px-8 md:px-10 rounded-full border-2 border-white/30 text-white hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 text-base">
                                    Try Virtual Mirror
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
