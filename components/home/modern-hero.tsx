'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play } from 'lucide-react'
import Link from 'next/link'

interface ModernHeroProps {
    title?: string | React.ReactNode
    subtitle?: string
    backgroundImage?: string
    theme?: 'light' | 'dark'
}

export function ModernHero({
    title = <><span className="block">Virtual</span> <span className="italic font-light">Try-on</span></>,
    subtitle = "Experience the new era of Shopping. Try on your wished collection instantly with AI-powered precision. Get your instant look of the fashion.",
    backgroundImage = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
    theme = 'dark'
}: ModernHeroProps) {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    })

    const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

    return (
        <section ref={ref} className="relative h-[95vh] w-full overflow-hidden bg-black text-white">
            {/* Cinematic Background (Video/Image) */}
            <motion.div
                style={{ y, scale: 1.1 }}
                className="absolute inset-0 z-0"
            >
                <div className="absolute inset-0 bg-black/30 z-10" />
                {/* Fallback Image / Video Placeholder */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                />
                {!backgroundImage.includes('unsplash') && (
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
                    >
                        <source src="/hero-fashion.mp4" type="video/mp4" />
                    </video>
                )}
            </motion.div>

            {/* Content */}
            <motion.div
                style={{ opacity }}
                className="relative z-20 h-full flex flex-col justify-center items-center text-center px-4"
            >
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <span className="inline-block py-1 px-3 border border-white/30 rounded-full text-xs font-medium tracking-[0.2em] uppercase backdrop-blur-md mb-6">
                        AI Powered Virtual Try-on👕
                    </span>
                    <h1 className="text-6xl md:text-9xl font-serif font-medium tracking-tight mb-6 leading-[0.9]">
                        {title}
                    </h1>
                    <p className="max-w-md mx-auto text-lg text-white/80 font-light mb-10 leading-relaxed">
                        {subtitle}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                        <Link href="/shop">
                            <Button className="rounded-full h-14 px-10 bg-white text-black hover:bg-white/90 text-lg transition-transform hover:scale-105">
                                Shop Collection
                            </Button>
                        </Link>
                        <Link href="/try-on">
                            <Button variant="outline" className="rounded-full h-14 px-10 border-white/30 text-black hover:bg-white/10 text-lg backdrop-blur-sm">
                                <Play className="w-4 h-4 mr-2" /> Virtual Try-On
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </motion.div>

            {/* Bottom Bar / Social Proof */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-20 flex justify-between items-end bg-gradient-to-t from-black/80 to-transparent">
                <div className="hidden md:block">
                    <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Featured In</p>
                    <div className="flex gap-6 text-white/40 font-serif italic text-xl">
                        <span>Vogue</span>
                        <span>Elle</span>
                        <span>Hypebeast</span>
                    </div>
                </div>
                <div className="animate-bounce">
                    <ArrowRight className="w-6 h-6 rotate-90 text-white/50" />
                </div>
            </div>
        </section>
    )
}
