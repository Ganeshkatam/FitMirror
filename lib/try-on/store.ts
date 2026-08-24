import { create } from 'zustand'
import { TryOnAsset, GarmentStack, MannequinState } from './types'

interface TryOnStore {
    // State
    stack: GarmentStack
    mannequin: MannequinState
    isLoading: boolean
    activeCategory: string

    // Actions
    equip: (asset: TryOnAsset) => void
    unequip: (layer: number) => void
    reset: () => void
    setCategory: (category: string) => void
    setLoading: (loading: boolean) => void
}

export const useTryOnEngine = create<TryOnStore>((set) => ({
    // Initial State
    stack: {},
    mannequin: {
        gender: 'female',
        skinColor: '#e5e5e5',
        rotation: 0,
        zoom: 1
    },
    isLoading: false,
    activeCategory: 'Tops',

    // Actions
    equip: (asset) => set((state) => ({
        stack: {
            ...state.stack,
            [asset.layer]: asset
        }
    })),

    unequip: (layer) => set((state) => {
        const newStack = { ...state.stack }
        delete newStack[layer]
        return { stack: newStack }
    }),

    reset: () => set({ stack: {} }),

    setCategory: (category) => set({ activeCategory: category }),

    setLoading: (loading) => set({ isLoading: loading })
}))
