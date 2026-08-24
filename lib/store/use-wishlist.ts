import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface WishlistStore {
    items: string[] // Array of product IDs
    loading: boolean
    initialized: boolean
    fetchWishlist: () => Promise<void>
    toggleWishlist: (productId: string) => Promise<void>
    isInWishlist: (productId: string) => boolean
}

export const useWishlist = create<WishlistStore>((set, get) => ({
    items: [],
    loading: false,
    initialized: false,

    fetchWishlist: async () => {
        const { initialized } = get()
        if (initialized) return

        set({ loading: true })
        const supabase = createClient()

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                set({ items: [], loading: false, initialized: true })
                return
            }

            const { data } = await supabase
                .from('wishlists')
                .select('product_id')
                .eq('user_id', user.id)

            if (data) {
                set({ items: data.map(i => i.product_id), loading: false, initialized: true })
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error)
            set({ loading: false })
        }
    },

    toggleWishlist: async (productId: string) => {
        const { items } = get()
        const isAdded = items.includes(productId)
        const supabase = createClient()

        // Optimistic update
        const newItems = isAdded
            ? items.filter(id => id !== productId)
            : [...items, productId]

        set({ items: newItems })

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Please login to save items')
                set({ items }) // Revert
                return
            }

            if (isAdded) {
                await supabase
                    .from('wishlists')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', productId)
                toast.success('Removed from wishlist')
            } else {
                await supabase
                    .from('wishlists')
                    .insert({ user_id: user.id, product_id: productId })
                toast.success('Added to wishlist')
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error)
            set({ items }) // Revert on error
            toast.error('Something went wrong')
        }
    },

    isInWishlist: (productId: string) => {
        const { items } = get()
        return items.includes(productId)
    }
}))
