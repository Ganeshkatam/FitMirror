'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Download, Share2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResultViewerProps {
    originalImage: string
    resultImage: string
    productName?: string
    onRetry?: () => void
    onAddToCart?: () => void
    className?: string
}

export function ResultViewer({
    originalImage,
    resultImage,
    productName,
    onRetry,
    onAddToCart,
    className
}: ResultViewerProps) {
    const [sliderPosition, setSliderPosition] = useState(50)
    const [showComparison, setShowComparison] = useState(true)
    const [zoom, setZoom] = useState(1)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        setSliderPosition(Math.max(0, Math.min(100, x)))
    }, [])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging.current || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100
        setSliderPosition(Math.max(0, Math.min(100, x)))
    }, [])

    const handleDownload = async () => {
        try {
            const response = await fetch(resultImage)
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `fitmirror-tryon-${Date.now()}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Download failed:', error)
        }
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Check out how ${productName || 'this'} looks on me!`,
                    text: 'Virtual try-on from FitMirror',
                    url: window.location.href,
                })
            } catch (error) {
                // User cancelled or error
            }
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(window.location.href)
            alert('Link copied to clipboard!')
        }
    }

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            {/* Comparison Viewer */}
            <div
                ref={containerRef}
                className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-muted cursor-col-resize select-none"
                onMouseMove={handleMouseMove}
                onMouseUp={() => { isDragging.current = false }}
                onMouseLeave={() => { isDragging.current = false }}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => { isDragging.current = false }}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
            >
                {showComparison ? (
                    <>
                        {/* Original Image (Left side) */}
                        <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                        >
                            <Image
                                src={originalImage}
                                alt="Original photo"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                            <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                                Before
                            </div>
                        </div>

                        {/* Result Image (Right side) */}
                        <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                        >
                            <Image
                                src={resultImage}
                                alt="Try-on result"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full text-white text-xs font-medium">
                                After ✨
                            </div>
                        </div>

                        {/* Slider Handle */}
                        <div
                            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize z-10"
                            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                            onMouseDown={() => { isDragging.current = true }}
                            onTouchStart={() => { isDragging.current = true }}
                        >
                            {/* Handle grip */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-amber-400">
                                <div className="flex gap-0.5">
                                    <div className="w-0.5 h-4 bg-amber-400 rounded-full" />
                                    <div className="w-0.5 h-4 bg-amber-400 rounded-full" />
                                </div>
                            </div>
                        </div>

                        {/* Instructions */}
                        <motion.div
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ delay: 3 }}
                            className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm"
                        >
                            ← Drag to compare →
                        </motion.div>
                    </>
                ) : (
                    /* Full Result View */
                    <Image
                        src={resultImage}
                        alt="Try-on result"
                        fill
                        className="object-cover"
                        unoptimized
                    />
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-2">
                {/* View toggle */}
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                    <button
                        onClick={() => setShowComparison(true)}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                            showComparison ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Compare
                    </button>
                    <button
                        onClick={() => setShowComparison(false)}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                            !showComparison ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Full View
                    </button>
                </div>

                {/* Zoom controls */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                        disabled={zoom <= 0.5}
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground w-12 text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setZoom(z => Math.min(2, z + 0.25))}
                        disabled={zoom >= 2}
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="gap-2" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                    Save Image
                </Button>
                <Button variant="outline" className="gap-2" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                    Share
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="gap-2" onClick={onRetry}>
                    <RotateCcw className="h-4 w-4" />
                    Try Another Photo
                </Button>
                <Button
                    className="gap-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600"
                    onClick={onAddToCart}
                >
                    Add to Cart
                </Button>
            </div>
        </div>
    )
}
