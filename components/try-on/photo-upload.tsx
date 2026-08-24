'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Camera, Upload, X, RotateCcw, Check, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PhotoUploadProps {
    onPhotoSelect: (file: File | null, previewUrl: string | null) => void
    existingPhotoUrl?: string | null
    className?: string
}

export function PhotoUpload({ onPhotoSelect, existingPhotoUrl, className }: PhotoUploadProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(existingPhotoUrl || null)
    const [isDragActive, setIsDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)

    const handleFile = useCallback((file: File | null) => {
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file')
                return
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('Image size should be less than 10MB')
                return
            }

            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
            onPhotoSelect(file, url)
        }
    }, [onPhotoSelect])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragActive(false)

        const file = e.dataTransfer.files[0]
        handleFile(file)
    }, [handleFile])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragActive(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragActive(false)
    }, [])

    const handleClear = () => {
        setPreviewUrl(null)
        onPhotoSelect(null, null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        if (cameraInputRef.current) cameraInputRef.current.value = ''
    }

    return (
        <div className={cn("w-full", className)}>
            <AnimatePresence mode="wait">
                {!previewUrl ? (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={cn(
                            "relative flex flex-col items-center justify-center w-full aspect-[3/4] rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden",
                            isDragActive
                                ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                                : "border-muted-foreground/30 hover:border-amber-400 hover:bg-muted/30"
                        )}
                    >
                        {/* Background illustration */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-5">
                            <svg viewBox="0 0 100 140" className="w-48 h-64">
                                <ellipse cx="50" cy="20" rx="15" ry="18" fill="currentColor" />
                                <rect x="35" y="38" width="30" height="50" rx="8" fill="currentColor" />
                                <rect x="30" y="88" width="15" height="45" rx="5" fill="currentColor" />
                                <rect x="55" y="88" width="15" height="45" rx="5" fill="currentColor" />
                            </svg>
                        </div>

                        <div className="relative z-10 flex flex-col items-center gap-4 p-6 text-center">
                            <div className="p-4 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 dark:from-amber-900/30 dark:to-rose-900/30">
                                <Camera className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg mb-1">Upload Your Photo</h3>
                                <p className="text-sm text-muted-foreground max-w-[200px]">
                                    Take or upload a full-body photo for the best results
                                </p>
                            </div>

                            <div className="flex gap-3">
                                {/* Camera option - mobile only */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => cameraInputRef.current?.click()}
                                >
                                    <Smartphone className="h-4 w-4" />
                                    Camera
                                </Button>

                                {/* File upload */}
                                <Button
                                    type="button"
                                    className="gap-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-4 w-4" />
                                    Upload
                                </Button>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                📸 Tips: Stand straight, good lighting, simple background
                            </p>
                        </div>

                        {/* Hidden inputs */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFile(e.target.files?.[0] || null)}
                        />
                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="user"
                            className="hidden"
                            onChange={(e) => handleFile(e.target.files?.[0] || null)}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-muted"
                    >
                        <Image
                            src={previewUrl}
                            alt="Your photo"
                            fill
                            className="object-cover"
                            unoptimized
                        />

                        {/* Overlay controls */}
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-white">
                                    <Check className="h-4 w-4 text-green-400" />
                                    <span className="text-sm font-medium">Photo ready</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2 text-white hover:bg-white/20"
                                    onClick={handleClear}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Change
                                </Button>
                            </div>
                        </div>

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
