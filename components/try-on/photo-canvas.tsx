'use client'

import React, { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useTryOnStore } from '@/lib/store/use-try-on'
import { Button } from '@/components/ui/button'
import { Upload, X, RotateCw, ZoomIn, ZoomOut, Sparkles, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateVTON } from '@/lib/actions/ai'
import { toast } from 'sonner'

export function PhotoCanvas() {
    const { userPhoto, setUserPhoto, selectedItems } = useTryOnStore()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [garmentImage, setGarmentImage] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)

    // Transform State
    const [scale, setScale] = useState(1)
    const [rotation, setRotation] = useState(0)

    // Fetch garment image when selection changes
    useEffect(() => {
        const fetchGarmentImage = async () => {
            const activeItemId = selectedItems.top || selectedItems.bottom || selectedItems.dress
            if (!activeItemId) {
                setGarmentImage(null)
                return
            }

            const supabase = createClient()
            const { data } = await supabase
                .from('products')
                .select('image_url')
                .eq('id', activeItemId)
                .single()

            if (data?.image_url) {
                setGarmentImage(data.image_url)
            }
        }
        fetchGarmentImage()
    }, [selectedItems])

    // Handle file upload
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setUserPhoto(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    // Generate VTON
    const handleGenerate = async () => {
        if (!userPhoto || !garmentImage) return

        setIsGenerating(true)
        const activeCategory = selectedItems.dress ? 'one-pieces' : selectedItems.bottom ? 'bottoms' : 'tops'

        try {
            const result = await generateVTON(userPhoto, garmentImage, activeCategory)
            if (result.success && result.imageUrl) {
                setUserPhoto(result.imageUrl)
                setGarmentImage(null)
                toast.success("AI Fit Generated! ✨")
            } else {
                toast.error(result.error || "Generation failed")
            }
        } catch (e) {
            toast.error("Network error")
        } finally {
            setIsGenerating(false)
        }
    }

    // Upload UI when no photo
    if (!userPhoto) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
                <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center max-w-sm">
                    <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                        <CameraIcon className="h-10 w-10" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Upload Your Photo</h2>
                    <p className="text-muted-foreground mb-6 text-sm">
                        Take a photo or upload one to see how items look on you.
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()} className="w-full rounded-full h-12 text-base">
                        <Upload className="mr-2 h-4 w-4" /> Select Photo
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
            {/* Background: User Photo */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={userPhoto}
                    alt="User"
                    fill
                    className="object-contain"
                    priority
                />
            </div>

            {/* Overlay: Garment (Draggable Sticker) */}
            {garmentImage && (
                <motion.div
                    drag
                    dragMomentum={false}
                    className="absolute z-10 cursor-move touch-none"
                    style={{
                        scale,
                        rotate: rotation
                    }}
                    initial={{ scale: 0.5 }}
                >
                    <div className="relative group">
                        <Image
                            src={garmentImage}
                            alt="Garment"
                            width={500}
                            height={500}
                            className="w-64 md:w-80 pointer-events-none drop-shadow-2xl h-auto"
                        />
                        <div className="absolute -inset-4 border-2 border-white/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                </motion.div>
            )}

            {/* Floating Controls Toolbar */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-black/50 backdrop-blur-md p-2 rounded-full">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-8 w-8" onClick={() => setUserPhoto(null)}>
                    <X className="h-4 w-4" />
                </Button>
                <div className="w-[1px] bg-white/20 mx-1" />
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-8 w-8" onClick={() => setScale(s => Math.max(0.2, s - 0.1))}>
                    <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-8 w-8" onClick={() => setScale(s => Math.min(3, s + 0.1))}>
                    <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-8 w-8" onClick={() => setRotation(r => r + 90)}>
                    <RotateCw className="h-4 w-4" />
                </Button>
            </div>

            {/* GENERATE BUTTON */}
            {garmentImage && !isGenerating && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20">
                    <Button
                        onClick={handleGenerate}
                        className="rounded-full h-12 px-8 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-xl border border-white/20"
                    >
                        <Sparkles className="mr-2 h-4 w-4 fill-white" />
                        Generate AI Fit
                    </Button>
                </div>
            )}

            {/* LOADING OVERLAY */}
            {isGenerating && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                    <Loader2 className="h-10 w-10 animate-spin mb-4 text-violet-400" />
                    <p className="font-medium animate-pulse">Designing your look...</p>
                </div>
            )}

            {/* Hint */}
            {!garmentImage && !isGenerating && (
                <div className="absolute bottom-32 left-0 right-0 text-center pointer-events-none">
                    <span className="bg-black/60 text-white px-4 py-2 rounded-full text-xs backdrop-blur-md">
                        Select an item below to see it here
                    </span>
                </div>
            )}
        </div>
    )
}

function CameraIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
        </svg>
    )
}
