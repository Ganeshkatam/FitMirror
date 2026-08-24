'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Star, Loader2, ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { submitReview } from '@/lib/actions/reviews'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface ReviewFormProps {
    productId: string
    productName: string
    productImage?: string
    trigger?: React.ReactNode
}

export function ReviewForm({ productId, productName, productImage, trigger }: ReviewFormProps) {
    const [open, setOpen] = useState(false)
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [fitRating, setFitRating] = useState('true_to_size')
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [images, setImages] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploading(true)
        const supabase = createClient()

        try {
            const newImages: string[] = []

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const fileExt = file.name.split('.').pop()
                const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('reviews')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('reviews')
                    .getPublicUrl(filePath)

                newImages.push(publicUrl)
            }

            setImages(prev => [...prev, ...newImages])
            toast.success("Images uploaded!")
        } catch (error: any) {
            console.error(error)
            toast.error("Failed to upload image")
        } finally {
            setIsUploading(false)
            // Reset input
            e.target.value = ''
        }
    }

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (rating === 0) {
            toast.error("Please select a rating")
            return
        }

        setIsSubmitting(true)
        try {
            await submitReview({
                productId,
                rating,
                title,
                content,
                images, // Pass the uploaded image URLs
                fitRating
            })
            toast.success("Review submitted successfully!")
            setOpen(false)

            // Reset form
            setRating(0)
            setTitle('')
            setContent('')
            setFitRating('true_to_size')
            setImages([])
        } catch (error: any) {
            toast.error(error.message || "Failed to submit review")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Write a Review</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Review {productName}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    {/* Star Rating */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none transition-transform hover:scale-110"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={`h-8 w-8 ${star <= (hoverRating || rating)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                            {rating === 1 && "Poor"}
                            {rating === 2 && "Fair"}
                            {rating === 3 && "Average"}
                            {rating === 4 && "Good"}
                            {rating === 5 && "Excellent"}
                        </p>
                    </div>

                    {/* Fit Rating */}
                    <div className="space-y-3">
                        <Label className="text-center block">How was the fit?</Label>
                        <div className="flex items-center justify-between gap-2 bg-secondary/20 p-1 rounded-lg">
                            {[
                                { value: 'runs_small', label: 'Runs Small' },
                                { value: 'true_to_size', label: 'True to Size' },
                                { value: 'runs_large', label: 'Runs Large' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setFitRating(option.value)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${fitRating === option.value
                                        ? 'bg-black text-white shadow-sm'
                                        : 'text-muted-foreground hover:bg-black/5 hover:text-black'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                placeholder="What's most important to know?"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Review</Label>
                            <Textarea
                                placeholder="What did you like or dislike?"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="min-h-[100px]"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Add Photos</Label>
                            <div className="flex flex-wrap gap-4">
                                {images.map((url, i) => (
                                    <div key={i} className="relative w-20 h-20 border rounded-lg overflow-hidden group">
                                        <Image
                                            src={url}
                                            alt="Review upload"
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}

                                <div className="relative w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer">
                                    {isUploading ? (
                                        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                                    ) : (
                                        <>
                                            <ImagePlus className="h-6 w-6 text-gray-400" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleImageUpload}
                                                disabled={isUploading}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Review'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
