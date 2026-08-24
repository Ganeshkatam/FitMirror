import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from 'sonner'

export interface CompareItem {
    id: string
    name: string
    image: string
    price: number
    category: string
    brand?: string
}

interface CompareStore {
    items: CompareItem[]
    isOpen: boolean
    isMobileSelectionMode: boolean

    addItem: (item: CompareItem) => void
    removeItem: (id: string) => void
    toggleItem: (item: CompareItem) => void
    clearComparison: () => void
    setIsOpen: (isOpen: boolean) => void
    setMobileSelectionMode: (enabled: boolean) => void
}

export const useCompareStore = create<CompareStore>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            isMobileSelectionMode: false,

            addItem: (item) => {
                const { items } = get()
                if (items.some(i => i.id === item.id)) return

                // Category Constraint
                if (items.length > 0) {
                    const currentCategory = items[0].category
                    if (item.category !== currentCategory) {
                        toast.error(`Compare items must be from the same category (${currentCategory})`) // Requires toast import, but store is pure JS/TS usually. We might need to handle UI side or import toast.
                        // Since this is a hook/store, importing sonner toast works if it's client side.
                        return
                    }
                }

                if (items.length >= 5) {
                    // toast.error is handled in UI usually, but we can do it here if we import it.
                    return
                }
                set({ items: [...items, item], isOpen: true })
            },

            removeItem: (id) => {
                set(state => ({
                    items: state.items.filter(i => i.id !== id),
                    isOpen: state.items.length > 1
                }))
            },

            toggleItem: (item) => {
                const { items, addItem, removeItem } = get()
                if (items.some(i => i.id === item.id)) {
                    removeItem(item.id)
                } else {
                    addItem(item)
                }
            },

            clearComparison: () => set({ items: [], isOpen: false, isMobileSelectionMode: false }),
            setIsOpen: (isOpen) => set({ isOpen }),
            setMobileSelectionMode: (enabled) => set({ isMobileSelectionMode: enabled })
        }),
        {
            name: 'compare-storage',
            skipHydration: true
        }
    )
)
