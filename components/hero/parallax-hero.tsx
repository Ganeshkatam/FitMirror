'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Sparkles, Truck, Shield, Star, ArrowRight } from 'lucide-react'

interface ParallaxHeroProps {
    headline?: string
    subheadline?: string
}

export function ParallaxHero({
    headline = "Experience the Perfect Fit",
    subheadline = "Explore tailored styles, premium fabrics, and curated collections designed to look and feel effortless."
}: ParallaxHeroProps) {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    })

    // Parallax effects
    const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
    const textY = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

    return (
        <section
            ref={ref}
            className="relative w-full min-h-[70vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden"
        >
            {/* Animated Background */}
            <motion.div
                style={{ y: bgY }}
                className="absolute inset-0 z-0 bg-gradient-to-b from-amber-500/10 via-rose-500/5 to-background"
            >
                {/* Decorative Blobs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-rose-400/20 to-violet-400/20 rounded-full blur-3xl animate-pulse delay-1000" />

                {/* Subtle Grid */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />
            </motion.div>

            {/* Content */}
            <motion.div
                style={{ y: textY, opacity }}
                className="container relative px-4 md:px-6 z-10 text-slate-900"
            >
                <div className="flex flex-col items-center space-y-5 md:space-y-8 text-center max-w-5xl mx-auto">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-full border border-slate-200 shadow-lg"
                    >
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-semibold text-slate-800">Curated Modern Fashion</span>
                    </motion.div>

                    {/* Main Heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="space-y-4"
                    >
                        <h1 data-testid="hero-headline" className="text-3xl font-bold tracking-tight sm:text-5xl md:text-7xl lg:text-8xl font-serif leading-tight flex flex-col items-center gap-2 sm:gap-4">
                            {headline === "Experience the Perfect Fit" ? (
                                <>
                                    <span>Experience the</span>
                                    <span className="relative py-2">
                                        <span className="text-gradient-gold">Perfect Fit</span>
                                        <motion.span
                                            className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-400 to-violet-400 rounded-full"
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: 1 }}
                                            transition={{ delay: 0.8, duration: 0.6 }}
                                        />
                                    </span>
                                </>
                            ) : (
                                <span className="text-gradient-gold">{headline}</span>
                            )}
                        </h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mx-auto max-w-[700px] text-sm md:text-xl text-slate-600 leading-relaxed"
                        >
                            {subheadline}
                        </motion.p>
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4 pt-4"
                    >
                        <Link href="/shop">
                            <Button size="lg" className="h-12 px-8 text-base md:h-14 md:px-10 md:text-lg rounded-full btn-premium hover-lift group bg-slate-900 text-white hover:bg-slate-800">
                                Shop Collection
                                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                        <Link href="/about">
                            <Button variant="outline" size="lg" className="h-12 px-8 text-base md:h-14 md:px-10 md:text-lg rounded-full hover-lift border-2 border-slate-200 text-slate-700 hover:bg-slate-50">
                                Our Story
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Trust Badges */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="flex flex-wrap justify-center gap-4 md:gap-8 pt-4 md:pt-8"
                    >
                        {[
                            { icon: Star, label: "4.9/5 Rating", color: "text-amber-500", fill: true },
                            { icon: Shield, label: "Quality Guaranteed", color: "text-green-600" },
                            { icon: Truck, label: "Free Shipping", color: "text-blue-600" },
                        ].map(({ icon: Icon, label, color, fill }) => (
                            <div key={label} className="flex items-center gap-2 text-sm text-slate-600">
                                <Icon className={`h-5 w-5 ${color} ${fill ? 'fill-current' : ''}`} />
                                <span className="font-medium">{label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
                >
                    <motion.div className="w-1.5 h-2.5 bg-muted-foreground/50 rounded-full" />
                </motion.div>
            </motion.div>
        </section>
    )
}
