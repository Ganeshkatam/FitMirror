'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface VisualSearchButtonProps {
    onResult: (term: string) => void
    className?: string
}

export function VisualSearchButton({ onResult, className }: VisualSearchButtonProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please select an image file")
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image too large. Max size is 10MB.")
            return
        }

        setIsAnalyzing(true)
        toast.loading("Analyzing your image...", { id: 'visual-search' })

        try {
            const formData = new FormData()
            formData.append('image', file)

            const res = await fetch('/api/engine/visual-search', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()

            if (!res.ok) {
                const errMsg = data.error || 'Visual search failed'
                console.error("Visual search error:", data)
                toast.error(errMsg, { id: 'visual-search' })
                return
            }

            if (data.analysis?.query) {
                toast.success(`Found: ${data.analysis.query}`, { id: 'visual-search' })
                onResult(data.analysis.query)
            } else {
                toast.error("Could not identify fashion items in this image. Try a clearer photo.", { id: 'visual-search' })
            }
        } catch (error) {
            console.error("Visual search failed:", error)
            toast.error("Network error. Please check your connection.", { id: 'visual-search' })
        } finally {
            setIsAnalyzing(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
            />
            <Button
                variant="ghost"
                size="icon"
                className={cn("text-muted-foreground hover:text-foreground hover:bg-transparent", className)}
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                title="Search by image"
            >
                {isAnalyzing ? (
                    <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                ) : (
                    <Camera className="h-5 w-5" />
                )}
            </Button>
        </>
    )
}
