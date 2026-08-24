'use client'

import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function RemoveFromWishlistButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleRemove = async () => {
        setLoading(true)
        const supabase = createClient()
        const { error } = await supabase.from('wishlists').delete().eq('id', id)

        if (error) {
            toast.error("Failed to remove item")
        } else {
            toast.success("Item removed from wishlist")
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-red-50 hover:text-red-600"
            onClick={handleRemove}
            disabled={loading}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    )
}
