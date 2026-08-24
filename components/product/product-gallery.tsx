'use client'

import * as React from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import { EmblaOptionsType } from 'embla-carousel'
import { cn } from '@/lib/utils'
import { PlayCircle, ZoomIn, X, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, Maximize2, Image as ImageIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

export type MediaItem = {
    id: string
    url: string
    media_type: 'image' | 'video'
    storage_path?: string
}

interface ProductGalleryProps {
    media: MediaItem[]
    productName: string
}

export function ProductGallery({ media, productName }: ProductGalleryProps) {
    // Embla Setup
    const OPTIONS: EmblaOptionsType = { loop: true }
    const [emblaRef, emblaApi] = useEmblaCarousel(OPTIONS)
    const [thumbEmblaRef, thumbEmblaApi] = useEmblaCarousel({
        containScroll: 'keepSnaps',
        dragFree: true
    })

    // State
    const [selectedIndex, setSelectedIndex] = React.useState(0)
    const [lightboxOpen, setLightboxOpen] = React.useState(false)
    const [isZoomed, setIsZoomed] = React.useState(false)
    const [zoomPosition, setZoomPosition] = React.useState({ x: 50, y: 50 })

    // Video State
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [isMuted, setIsMuted] = React.useState(true)
    const videoRefs = React.useRef<(HTMLVideoElement | null)[]>([])

    // Sync Thumbnails & Main Carousel
    const onSelect = React.useCallback(() => {
        if (!emblaApi || !thumbEmblaApi) return
        setSelectedIndex(emblaApi.selectedScrollSnap())
        thumbEmblaApi.scrollTo(emblaApi.selectedScrollSnap())
    }, [emblaApi, thumbEmblaApi])

    React.useEffect(() => {
        if (!emblaApi) return
        onSelect()
        emblaApi.on('select', onSelect)
        emblaApi.on('reInit', onSelect)
    }, [emblaApi, onSelect])

    const scrollTo = (index: number) => {
        if (emblaApi) emblaApi.scrollTo(index)
    }

    // Zoom Logic
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isZoomed) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        setZoomPosition({ x, y })
    }

    // Auto-pause videos when sliding away
    React.useEffect(() => {
        videoRefs.current.forEach((video, index) => {
            if (video && index !== selectedIndex) {
                video.pause()
            }
        })
    }, [selectedIndex])

    if (!media || media.length === 0) {
        return (
            <div className="aspect-[3/4] bg-gray-100 rounded-2xl flex items-center justify-center">
                <ImageIcon className="h-10 w-10 text-gray-300" />
            </div>
        )
    }

    const selectedItem = media[selectedIndex]
    const imageCount = media.filter(m => m.media_type === 'image').length
    const videoCount = media.filter(m => m.media_type === 'video').length

    const gridMedia = media.slice(0, 5) // Show top 5 in grid, rest in modal? Or just show all?
    // Modern "ZARA/GUCCI" style: Stacked images on Desktop. Carousel on Mobile.

    return (
        <div className="w-full">
            {/* Mobile Carousel (Hidden on Desktop) */}
            <div className="md:hidden relative">
                <div className="overflow-hidden bg-gray-50 aspect-[3/4]" ref={emblaRef}>
                    <div className="flex touch-pan-y">
                        {media.map((item, index) => (
                            <div key={item.id || index} className="relative flex-[0_0_100%] min-w-0">
                                {item.media_type === 'video' ? (
                                    <div className="relative w-full h-full bg-black aspect-[3/4]">
                                        <video
                                            src={item.url}
                                            className="w-full h-full object-cover"
                                            controls
                                            playsInline
                                        />
                                    </div>
                                ) : (
                                    <div className="relative w-full aspect-[3/4]" onClick={() => setLightboxOpen(true)}>
                                        <Image
                                            src={item.url}
                                            alt={productName}
                                            fill
                                            className="object-cover"
                                            sizes="100vw"
                                            priority={index === 0}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                {/* Mobile Dots */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {media.map((_, index) => (
                        <div
                            key={index}
                            className={cn(
                                "h-1.5 transition-all rounded-full bg-white/80 shadow-sm",
                                selectedIndex === index ? "w-6 bg-white" : "w-1.5 opacity-50"
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Desktop Grid Layout (Hidden on Mobile) */}
            <div className="hidden md:grid grid-cols-2 gap-2">
                {media.map((item, index) => {
                    const isFullWidth = (index % 3 === 0) // Every 3rd image is full width? Or just first?
                    // Let's do a simple grid: 2 cols. If odd number, last one is full width?
                    // Actually, typical premium is just a vertical stack of huge images? Or 2-col grid.
                    // Let's do a uniform 2-col grid.

                    return (
                        <div
                            key={item.id || index}
                            className={cn(
                                "relative aspect-[3/4] bg-gray-50 cursor-zoom-in group overflow-hidden",
                                (media.length % 2 !== 0 && index === 0) ? "col-span-2 aspect-[16/9]" : "col-span-1"
                            )}
                            onClick={() => {
                                setSelectedIndex(index)
                                setLightboxOpen(true)
                            }}
                        >
                            {item.media_type === 'video' ? (
                                <video
                                    src={item.url}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : (
                                <Image
                                    src={item.url}
                                    alt={productName}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    priority={index < 2}
                                />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                        </div>
                    )
                })}
            </div>

            {/* Lightbox */}
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                <DialogContent className="max-w-[95vw] h-[95vh] p-0 bg-black/95 border-0">
                    <DialogTitle className="sr-only">Zoom</DialogTitle>
                    {/* ... Lightbox content ... */}
                    <div className="relative w-full h-full flex items-center justify-center">
                        <button
                            onClick={() => setLightboxOpen(false)}
                            className="absolute top-4 right-4 z-50 p-2 text-white hover:text-gray-300"
                        >
                            <X className="h-8 w-8" />
                        </button>

                        <div className="w-full h-full max-w-7xl max-h-[90vh] relative">
                            {media[selectedIndex]?.media_type === 'video' ? (
                                <video
                                    src={media[selectedIndex].url}
                                    className="w-full h-full object-contain"
                                    controls
                                    autoPlay
                                />
                            ) : (
                                <Image
                                    src={media[selectedIndex]?.url}
                                    alt="Zoom"
                                    fill
                                    className="object-contain"
                                    quality={100}
                                />
                            )}
                        </div>

                        <button
                            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                            onClick={(e) => { e.stopPropagation(); setSelectedIndex(prev => (prev - 1 + media.length) % media.length) }}
                        >
                            <ChevronLeft className="h-12 w-12" />
                        </button>
                        <button
                            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                            onClick={(e) => { e.stopPropagation(); setSelectedIndex(prev => (prev + 1) % media.length) }}
                        >
                            <ChevronRight className="h-12 w-12" />
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
