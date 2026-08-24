'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Calendar, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const ARTICLES = [
    {
        id: 1,
        title: "The Art of Layering: Transitioning to Fall",
        excerpt: "Discover the essential pieces you need to master the layered look this season without compromising on style or comfort.",
        category: "Style Guide",
        author: "Emma Solis",
        date: "Oct 12, 2025",
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
        readTime: "5 min read"
    },
    {
        id: 2,
        title: "Sustainable Fabrics: A Deep Dive",
        excerpt: "Understanding the difference between Tencel, Organic Cotton, and Recycled Polyester—and why it matters for your wardrobe.",
        category: "Sustainability",
        author: "Sarah Chen",
        date: "Oct 08, 2025",
        image: "https://images.unsplash.com/photo-1551489186-cf8726f514f8?q=80&w=2070&auto=format&fit=crop",
        readTime: "8 min read"
    },
    {
        id: 3,
        title: "Office Chic: Redefining Workwear",
        excerpt: "From boardroom to bar, explore versatile tailoring that works as hard as you do. The new rules of corporate fashion.",
        category: "Trends",
        author: "Mia Zhang",
        date: "Oct 05, 2025",
        image: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=2070&auto=format&fit=crop",
        readTime: "6 min read"
    }
]

export function JournalSection() {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    })

    const y = useTransform(scrollYProgress, [0, 1], [100, -100])

    return (
        <section ref={ref} className="w-full py-20 md:py-32 bg-stone-50 overflow-hidden relative">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="w-full max-w-[1800px] mx-auto px-4 md:px-6 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                    <div>
                        <span className="text-indigo-500 font-bold uppercase tracking-widest text-xs mb-2 block">
                            The Edit
                        </span>
                        <h2 className="text-4xl md:text-6xl font-serif font-bold text-indigo-950">
                            Journal & Stories
                        </h2>
                    </div>
                    <Link href="/journal">
                        <Button variant="outline" className="rounded-full border-indigo-200 text-indigo-900 hover:bg-indigo-50 hover:text-indigo-950 group">
                            Read All Stories
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {ARTICLES.map((article, i) => (
                        <motion.div
                            key={article.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className="group cursor-pointer flex flex-col h-full"
                        >
                            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-6 bg-gray-100">
                                <Image
                                    src={article.image}
                                    alt={article.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-950 rounded-full">
                                    {article.category}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-indigo-400 font-medium mb-3">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {article.date}
                                </span>
                                <span className="flex items-center gap-1">
                                    <User className="h-3.5 w-3.5" />
                                    {article.author}
                                </span>
                            </div>

                            <h3 className="text-2xl font-serif font-bold text-indigo-950 mb-3 group-hover:text-indigo-600 transition-colors">
                                {article.title}
                            </h3>
                            <p className="text-indigo-900/60 line-clamp-2 mb-4 flex-grow">
                                {article.excerpt}
                            </p>

                            <div className="flex items-center text-sm font-bold text-indigo-500 group-hover:text-indigo-700 transition-colors mt-auto">
                                Read Article <ArrowRight className="ml-2 h-4 w-4" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
