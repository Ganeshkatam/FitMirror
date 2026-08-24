'use client'

import React from 'react'
import Link from 'next/link'

import { Sparkles, Camera, Shirt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/motion/scroll-reveal'

export function TryOnShowcase() {
    return (
        <section className="w-full py-16 md:py-32 relative overflow-hidden">
            {/* Background with mesh gradient */}
            <div className="absolute inset-0 bg-[#0f172a]">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-rose-500/10 to-amber-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
            </div>

            <div className="w-full max-w-[1800px] mx-auto px-4 md:px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* Text Content */}
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-6 backdrop-blur-sm">
                            <Sparkles className="h-4 w-4 text-indigo-300" />
                            <span className="text-indigo-200 text-sm font-medium">New AI Feature</span>
                        </div>

                        <h2 className="text-3xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">
                            Try Before You Buy <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
                                With Virtual Mirror
                            </span>
                        </h2>

                        <p className="text-lg text-indigo-100/70 mb-8 max-w-xl leading-relaxed">
                            Upload your photo and see exactly how our latest collection looks on you.
                            No more guessing sizes or styles. Experience the future of shopping today.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/virtual-try-on">
                                <Button size="lg" className="rounded-full h-14 px-8 text-lg bg-white text-indigo-950 hover:bg-indigo-50 shadow-lg shadow-indigo-500/20 w-full sm:w-auto">
                                    <Camera className="mr-2 h-5 w-5" />
                                    Try On Now
                                </Button>
                            </Link>
                            <Link href="/shop?features=try-on">
                                <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg border-indigo-500/30 text-indigo-100 hover:bg-indigo-500/10 hover:text-white w-full sm:w-auto">
                                    <Shirt className="mr-2 h-5 w-5" />
                                    View Try-On Items
                                </Button>
                            </Link>
                        </div>

                        {/* Stats / Trust */}
                        <div className="mt-12 flex gap-8 border-t border-white/10 pt-8">
                            <div>
                                <p className="text-3xl font-bold text-white">98%</p>
                                <p className="text-sm text-indigo-200/60 mt-1">Fit Accuracy</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">2.5M+</p>
                                <p className="text-sm text-indigo-200/60 mt-1">Virtual Try-Ons</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">0s</p>
                                <p className="text-sm text-indigo-200/60 mt-1">Wait Time</p>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Visual Demo (Mockup) */}
                    <div className="relative hidden lg:block h-[600px]">
                        {/* Phone Frame */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[580px] bg-black rounded-[40px] border-[8px] border-zinc-800 shadow-2xl overflow-hidden z-20 rotate-[-6deg] hover:rotate-0 transition-transform duration-500">
                            <div className="absolute top-0 w-full h-full bg-zinc-900">
                                {/* Screen Content */}
                                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-80" />
                                <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black/90 to-transparent">
                                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md flex-shrink-0" />
                                        ))}
                                    </div>
                                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Generating Look...</Button>
                                </div>
                            </div>
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute top-20 right-10 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl z-10 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Sparkles className="h-5 w-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Perfect Match!</p>
                                    <p className="text-xs text-indigo-200">Size M selected based on scan</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
