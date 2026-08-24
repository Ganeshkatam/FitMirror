'use client'

import { useState, useCallback } from 'react'
import { createClient } from './lib/supabase/client'
import { Button } from './button'
import { Image as ImageIcon, Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { cn } from './lib/utils'

interface ImageUploadProps {
    value?: string | null
    onChange: (url: string | null) => void
    disabled?: boolean
    className?: string
    folder?: string // Storage bucket path folder
}

export function ImageUpload({
    value,
    onChange,
    disabled,
    className,
    folder = 'categories'
}: ImageUploadProps) {
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<string | null>(value || null)
    const supabase = createClient()

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0]
            if (!file) return

            setLoading(true)

            // 1. Upload file
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(7)}-${Date.now()}.${fileExt}`
            const filePath = `${folder}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('products') // Accessing 'products' bucket as per plan, though folder is customizable
                .upload(filePath, file)

            if (uploadError) {
                console.error(uploadError)
                throw new Error('Upload failed')
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath)

            // 3. Update State
            setPreview(publicUrl)
            onChange(publicUrl)
            toast.success("Image uploaded")

        } catch (error) {
            toast.error("Failed to upload image")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const onRemove = () => {
        setPreview(null)
        onChange(null)
    }

    return (
        <div className={cn("space-y-4 w-full flex flex-col items-center justify-center", className)}>
            {preview ? (
                <div className="relative aspect-square w-40 h-40 rounded-lg overflow-hidden border bg-muted group">
                    <Image
                        fill
                        src={preview}
                        alt="Upload preview"
                        className="object-cover"
                    />
                    <div className="absolute top-2 right-2">
                        <Button
                            type="button"
                            onClick={onRemove}
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 bg-muted/20 hover:bg-muted/40 transition-colors relative cursor-pointer">
                    {loading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                        <>
                            <div className="p-3 bg-muted rounded-full">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="text-sm text-center">
                                <span className="font-semibold text-primary">Click to upload</span>
                                <p className="text-xs text-muted-foreground">SVG, PNG, JPG</p>
                            </div>
                        </>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        onChange={onUpload}
                        disabled={disabled || loading}
                    />
                </div>
            )}
        </div>
    )
}
