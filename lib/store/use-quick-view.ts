import { create } from 'zustand'
import { Database } from '@/lib/database.types'

type Product = Database['public']['Tables']['products']['Row']

interface QuickViewStore {
    isOpen: boolean
    product: Product | null
    open: (product: Product) => void
    close: () => void
}

export const useQuickView = create<QuickViewStore>((set) => ({
    isOpen: false,
    product: null,
    open: (product) => set({ isOpen: true, product }),
    close: () => set({ isOpen: false, product: null }),
}))
