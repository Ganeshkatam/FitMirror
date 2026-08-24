"use client"

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2, User } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface AvatarUploadProps {
    url: string | null
    size?: number
    onUpload?: (url: string) => void
}

export function AvatarUpload({ url, size = 150, onUpload }: AvatarUploadProps) {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(url)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()
    const router = useRouter()

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.')
            }

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const filePath = `${Math.random()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // Update Profile
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ avatar_url: publicUrl })
                    .eq('id', user.id)

                if (updateError) throw updateError
            }

            setAvatarUrl(publicUrl)
            if (onUpload) onUpload(publicUrl)
            toast.success('Avatar updated!')
            router.refresh()
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error uploading avatar'
            toast.error(message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="relative group">
            <div
                className="relative rounded-full overflow-hidden border-4 border-white dark:border-gray-900 shadow-xl bg-muted flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                {avatarUrl ? (
                    <Image
                        src={avatarUrl}
                        alt="Avatar"
                        fill
                        className="object-cover"
                    />
                ) : (
                    <User className="h-1/2 w-1/2 text-muted-foreground" />
                )}

                {/* Overlay */}
                <div
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Camera className="h-8 w-8 text-white" />
                </div>
            </div>

            {/* Hidden Input */}
            <input
                type="file"
                id="single"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                ref={fileInputRef}
                className="hidden"
            />

            {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
        </div>
    )
}
