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
    subheadline = "See how clothes look on your body before you buy. Upload one photo, try on our entire collection in seconds."
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
                className="absolute inset-0 -z-10"
            >
                {/* Gradient Base - Mixed White */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-gray-100" />

                {/* Animated Blobs - Silver/Pearlescent */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-gray-200/40 to-slate-200/40 rounded-full blur-3xl animate-blob" />
                <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-slate-100/30 to-gray-100/30 rounded-full blur-3xl animate-blob animation-delay-2000" />
                <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-br from-white/30 to-zinc-100/30 rounded-full blur-3xl animate-blob animation-delay-4000" />

                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
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
                        <span className="text-sm font-semibold text-slate-800">AI-Powered Virtual Try-On</span>
                    </motion.div>

                    {/* Main Heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="space-y-4"
                    >
                        <h1 data-testid="hero-headline" className="text-3xl font-bold tracking-tight sm:text-5xl md:text-7xl lg:text-8xl font-serif leading-tight flex flex-col items-center gap-2 sm:gap-4">
                            {/* Logic to split headline if needed, or just render it. 
                                The original had "Experience the \n Perfect Fit" with gradient. 
                                We'll check if it matches the default to keep the special styling, 
                                otherwise render the custom string. 
                            */}
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
                            dangerouslySetInnerHTML={{
                                __html: subheadline
                                    .replace("your body", "<strong class='text-slate-900 font-semibold'>your body</strong>")
                            }}
                        />
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
                            { icon: Shield, label: "Privacy Guaranteed", color: "text-green-600" },
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
