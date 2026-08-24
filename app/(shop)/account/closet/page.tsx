'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClosetUploader } from '@/components/closet/closet-uploader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shirt, Trash2, Camera } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { AccountLayout } from '@/components/account/account-layout'

export default function ClosetPage() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchCloset = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('user_closet_items')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            setItems(data || [])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCloset()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const deleteItem = async (id: string) => {
        const { error } = await supabase.from('user_closet_items').delete().eq('id', id)
        if (!error) {
            setItems(items.filter(i => i.id !== id))
            toast.success("Item removed")
        }
    }

    return (
        <AccountLayout title="My Digital Closet 🧥" description="Digitize your wardrobe and mix-and-match with our catalog.">
            <div className="flex gap-4">
                {/* Uploader Section - 30% */}
                <div className="w-1/3 min-w-[200px] shrink-0">
                    <div className="sticky top-24">
                        <ClosetUploader onUploadComplete={fetchCloset} />

                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                            <h4 className="font-semibold flex items-center gap-2 mb-2">
                                <Camera className="h-4 w-4" />
                                Pro Tips
                            </h4>
                            <ul className="list-disc list-inside space-y-1 opacity-90 text-xs">
                                <li>Use good lighting</li>
                                <li>Plain background</li>
                                <li>Avoid folding</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Grid Section - 70% */}
                <div className="flex-1 min-w-0">
                    {loading ? (
                        <div className="text-center py-20 text-muted-foreground">Loading...</div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed rounded-xl">
                            <Shirt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">Your closet is empty</h3>
                            <p className="text-muted-foreground text-sm">Upload your first item to get started!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {items.map((item) => (
                                <Card key={item.id} className="group relative aspect-[3/4] overflow-hidden border-0 shadow-sm bg-muted/30">
                                    <Image
                                        src={item.processed_image_url || item.image_url}
                                        alt="Closet Item"
                                        fill
                                        className="object-cover transition-transform group-hover:scale-105"
                                    />

                                    {/* Actions Overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                        <div className="flex gap-2">
                                            <Button size="sm" className="flex-1 bg-white text-black hover:bg-white/90 text-xs">
                                                Try On
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="destructive"
                                                className="h-8 w-8"
                                                onClick={() => deleteItem(item.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    {!item.processed && (
                                        <span className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
                                            Processing...
                                        </span>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AccountLayout>
    )
}
