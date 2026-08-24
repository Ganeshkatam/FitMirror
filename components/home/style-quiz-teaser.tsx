'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

const STYLES = [
    {
        id: 'minimalist',
        title: 'Minimalist',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012&auto=format&fit=crop',
        desc: 'Clean lines, neutral tones.'
    },
    {
        id: 'avant-garde',
        title: 'Avant-Garde',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop',
        desc: 'Bold shapes, artistic flair.'
    },
    {
        id: 'streetwear',
        title: 'Streetwear',
        image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1887&auto=format&fit=crop',
        desc: 'Urban comfort, hype culture.'
    }
]

export function StyleQuizTeaser() {
    return (
        <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        Find Your Vibe
                    </span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-6">
                        What's your style personality?
                    </h2>
                    <p className="text-lg text-slate-600">
                        Take our 30-second quiz to unlock a personalized store experience curated just for you.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                    {STYLES.map((style, i) => (
                        <motion.div
                            key={style.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -10 }}
                            className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer"
                        >
                            <Image
                                src={style.image}
                                alt={style.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                            <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                                <h3 className="text-2xl font-serif font-bold mb-2">{style.title}</h3>
                                <p className="text-white/70 mb-6 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                    {style.desc}
                                </p>
                                <Button variant="outline" className="w-full rounded-full border-white/30 text-white hover:bg-white hover:text-black">
                                    Select This Style
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <Button variant="link" className="text-slate-500 hover:text-slate-900">
                        Skip for now <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </div>
            </div>
        </section>
    )
}
