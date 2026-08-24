'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, Shirt } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ClosetUploader({ onUploadComplete }: { onUploadComplete?: () => void }) {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [category, setCategory] = useState('tops')
    const router = useRouter()
    const supabase = createClient()

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0]
            if (f.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB")
                return
            }
            setFile(f)
            setPreview(URL.createObjectURL(f))
        }
    }

    const clearFile = () => {
        setFile(null)
        setPreview(null)
    }

    const handleUpload = async () => {
        if (!file) return

        try {
            setUploading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not logged in")

            const ext = file.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${ext}`

            // 1. Upload to Storage
            const { data: storageData, error: storageError } = await supabase.storage
                .from('user-closet')
                .upload(fileName, file, { cacheControl: '3600', upsert: false })

            if (storageError) throw storageError

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('user-closet')
                .getPublicUrl(fileName)

            // 2. Create Database Record
            const { error: dbError } = await supabase
                .from('user_closet_items')
                .insert({
                    user_id: user.id,
                    image_url: publicUrl,
                    category: category,
                    processed: false // Will trigger background job later
                })

            if (dbError) throw dbError

            toast.success("Added to your closet!")
            clearFile()
            router.refresh()
            if (onUploadComplete) onUploadComplete()

        } catch (error) {
            console.error(error)
            toast.error("Failed to upload item")
        } finally {
            setUploading(false)
        }
    }

    return (
        <Card className="p-6 border-dashed border-2 text-center bg-gray-50/50 dark:bg-zinc-900/50 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
            {!preview ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold text-lg">Add to Closet</h3>
                        <p className="text-sm text-muted-foreground">Upload a photo of your clothes to mix & match</p>
                    </div>

                    <div className="flex gap-2">
                        <select
                            className="bg-background border rounded px-3 py-2 text-sm"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="tops">Top</option>
                            <option value="bottoms">Bottom</option>
                            <option value="dresses">Dress</option>
                            <option value="shoes">Shoes</option>
                        </select>
                        <Button variant="outline" className="relative">
                            Select Photo
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept="image/*"
                                onChange={handleFileSelect}
                            />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <div className="relative aspect-[3/4] w-48 rounded-lg overflow-hidden border shadow-sm">
                        <Image src={preview} alt="Preview" fill className="object-cover" />
                        <button
                            onClick={clearFile}
                            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize border px-2 py-1 rounded bg-background">
                            {category}
                        </span>
                        <Button onClick={handleUpload} disabled={uploading}>
                            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {uploading ? 'Processing...' : 'Save to Closet'}
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    )
}
