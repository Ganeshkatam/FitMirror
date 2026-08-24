'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCompareStore } from '@/lib/store/compare'
import { X, ArrowRight, Minimize2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export function CompareTray() {
    const { items, removeItem, clearComparison, isOpen, setIsOpen } = useCompareStore()
    const router = useRouter()
    const [isMinimized, setIsMinimized] = React.useState(false)

    // Hydration fix for zustand persist
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => {
        useCompareStore.persist.rehydrate()
        setMounted(true)
    }, [])

    if (!mounted || items.length === 0) return null

    const handleCompare = () => {
        router.push(`/compare?ids=${items.map(i => i.id).join(',')}`)
        // Optional: setIsOpen(false) to minimize distraction on next page
    }

    // Determine constraints or safe area?
    // Using simple drag with framer-motion

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    drag
                    dragMomentum={false}
                    className={cn(
                        "fixed z-50 shadow-2xl bg-white border border-gray-200 rounded-xl overflow-hidden",
                        isMinimized
                            ? "bottom-4 right-4 w-auto h-auto cursor-grab active:cursor-grabbing"
                            : "bottom-4 right-4 md:right-8 w-[calc(100vw-32px)] md:w-auto md:max-w-2xl cursor-default"
                    )}
                >
                    {/* Header Handle */}
                    <div className="bg-black text-white px-4 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing">
                        <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <span>⚖️ Compare ({items.length}/5)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized) }}
                                className="hover:bg-white/20 p-1 rounded transition-colors"
                            >
                                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); clearComparison() }}
                                className="hover:bg-white/20 p-1 rounded transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <div className="p-4" onPointerDown={(e) => e.stopPropagation()}>
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
                                {items.map((item) => (
                                    <div key={item.id} className="relative min-w-[80px] w-20 flex flex-col gap-1 snap-start group">
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                        <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border">
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="text-[10px] font-medium leading-tight line-clamp-2">
                                            {item.name}
                                        </div>
                                    </div>
                                ))}

                                {items.length < 2 && (
                                    <div className="min-w-[80px] w-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-center p-2 text-[10px] text-gray-400">
                                        Select more
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex justify-end">
                                <Button
                                    size="sm"
                                    onClick={handleCompare}
                                    disabled={items.length < 2}
                                    className="w-full md:w-auto text-xs font-bold uppercase h-9 bg-black text-white hover:bg-gray-800"
                                >
                                    Compare Now <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
