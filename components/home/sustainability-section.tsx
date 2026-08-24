'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Leaf, RefreshCcw, Heart } from 'lucide-react'

export function ConsciousLuxurySection() {
    return (
        <section className="w-full py-20 md:py-32 bg-white relative overflow-hidden">
            <div className="w-full max-w-[1800px] mx-auto px-4 md:px-6">
                <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
                    {/* Visual Side */}
                    <div className="relative order-2 md:order-1">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="aspect-[4/5] relative rounded-[2rem] overflow-hidden shadow-2xl"
                        >
                            <Image
                                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1887&auto=format&fit=crop"
                                alt="Sustainable Fashion Material"
                                fill
                                className="object-cover"
                            />
                            {/* Overlay Badge */}
                            <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-xl border border-white/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Impact Report 2025</span>
                                    <Leaf className="h-4 w-4 text-emerald-500" />
                                </div>
                                <div className="flex items-end gap-3">
                                    <span className="text-4xl font-serif font-bold text-indigo-950">100%</span>
                                    <span className="text-sm text-indigo-900/60 pb-1 font-medium">Recycled Packaging</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Decorative elements */}
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
                    </div>

                    {/* Content Side */}
                    <div className="order-1 md:order-2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full mb-6">
                                <Leaf className="h-4 w-4 text-emerald-600" />
                                <span className="text-emerald-700 text-sm font-bold tracking-wide">Conscious Luxury</span>
                            </div>

                            <h2 className="text-4xl md:text-6xl font-serif font-bold text-indigo-950 leading-tight mb-6">
                                Fashion That Feels Good,<br />
                                <span className="text-indigo-400 italic">Inside & Out</span>
                            </h2>

                            <p className="text-lg text-indigo-950/70 leading-relaxed max-w-lg mb-8">
                                We believe in radical transparency. From our ethically sourced organic cotton to our fair-trade partnerships,
                                every stitch tells a story of responsibility and respect for our planet.
                            </p>

                            <div className="space-y-6 mb-10">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 bg-indigo-50 p-2 rounded-lg">
                                        <RefreshCcw className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-indigo-950">Circular Fashion Initiative</h4>
                                        <p className="text-indigo-900/60 text-sm mt-1">Send back your old FitMirror items for credit and recycling.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 bg-rose-50 p-2 rounded-lg">
                                        <Heart className="h-5 w-5 text-rose-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-indigo-950">Ethical Manufacturing</h4>
                                        <p className="text-indigo-900/60 text-sm mt-1">Fair wages and safe working conditions are non-negotiable.</p>
                                    </div>
                                </div>
                            </div>

                            <Link href="/sustainability">
                                <Button size="lg" className="rounded-full bg-indigo-950 text-white hover:bg-indigo-900 px-8 h-12">
                                    Explore Our Impact
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    )
}
