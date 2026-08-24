import { create } from 'zustand'
import { getCart, addToCart, removeFromCart, updateCartItemQuantity } from '@/lib/actions/cart'
import { CartItem } from '@/lib/commerce/cart'
import { calculateCartTotal, calculateItemCount } from '@/lib/commerce/cart'

// DB interfaces remain here or move to database package later
interface DbCartItem {
    product_id: string
    size: string
    quantity: number
    variant_id?: string | null
    product: {
        name: string
        image: string | null
        image_url: string | null
        price: number
        store_id: string
    }
    variant?: {
        color: string | null
        size: string | null
    } | null
}

interface DbCart {
    items: DbCartItem[]
}

// Client CartItem uses the Engine definition
// export interface CartItem { ... } // REMOVED (Imported)

interface CartState {
    items: CartItem[]
    loading: boolean
    syncCart: () => Promise<void>
    addItem: (item: Omit<CartItem, 'quantity'>) => Promise<void>
    removeItem: (productId: string, size: string) => Promise<void>
    updateQuantity: (productId: string, size: string, quantity: number) => Promise<void>
    clearCart: () => Promise<void>
    getTotal: () => number
    getItemCount: () => number
    coupon: { code: string; discountAmount: number } | null
    applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>
    removeCoupon: () => void
}

// Convert DB Cart to Engine CartItem
const mapDbCartToClient = (dbCart: DbCart | null): CartItem[] => {
    if (!dbCart || !dbCart.items) return []
    return dbCart.items.map((item: DbCartItem) => ({
        productId: item.product_id,
        productName: item.product.name,
        productImage: item.product.image || item.product.image_url || '',
        price: item.product.price,
        size: item.size,
        quantity: item.quantity,
        storeId: item.product.store_id,
        variantId: item.variant_id || undefined,
        color: item.variant?.color || undefined
    }))
}

export const useCart = create<CartState>((set, get) => ({
    items: [],
    loading: false,
    coupon: null,

    syncCart: async () => {
        set({ loading: true })
        try {
            const cart = await getCart()
            set({ items: mapDbCartToClient(cart) })
        } catch (error) {
            console.error('Failed to sync cart:', error)
        } finally {
            set({ loading: false })
        }
    },

    addItem: async (item: Omit<CartItem, 'quantity'>) => {
        // Optimistic update
        set((state) => {
            const existing = state.items.find(i =>
                i.productId === item.productId &&
                i.size === item.size &&
                (i.variantId === item.variantId)
            )
            if (existing) {
                return { items: state.items.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i) }
            }
            // @ts-ignore - quantity is required in CartItem but we add it here
            return { items: [...state.items, { ...item, quantity: 1 }] }
        })

        // Server action
        try {
            const updatedCart = await addToCart(item.productId, item.size, 1, item.variantId)
            set({ items: mapDbCartToClient(updatedCart) })
        } catch (error) {
            console.error('Failed to add item:', error)
            // Revert on failure (could simplify by just re-fetching)
            get().syncCart()
        }
    },

    removeItem: async (productId, size) => {
        set((state) => ({
            items: state.items.filter(i => !(i.productId === productId && i.size === size))
        }))

        try {
            const updatedCart = await removeFromCart(productId, size)
            set({ items: mapDbCartToClient(updatedCart) })
        } catch (error) {
            console.error('Failed to remove item:', error)
            get().syncCart()
        }
    },

    updateQuantity: async (productId, size, quantity) => {
        set((state) => ({
            items: state.items.map(i =>
                i.productId === productId && i.size === size ? { ...i, quantity } : i
            ).filter(i => i.quantity > 0)
        }))

        try {
            const updatedCart = await updateCartItemQuantity(productId, size, quantity)
            set({ items: mapDbCartToClient(updatedCart) })
        } catch (error) {
            console.error('Failed to update quantity:', error)
            get().syncCart()
        }
    },

    clearCart: async () => {
        set({ items: [], coupon: null })
    },

    getTotal: () => {
        // Delegate to Commerce Engine calculation
        const itemTotal = calculateCartTotal(get().items)
        const discount = get().coupon?.discountAmount || 0
        return Math.max(0, itemTotal - discount)
    },

    getItemCount: () => {
        // Delegate to Commerce Engine calculation
        return calculateItemCount(get().items)
    },

    applyCoupon: async (code: string) => {
        const { validateCoupon } = await import('@/lib/actions/coupons')
        const items = get().items
        const total = calculateCartTotal(items)

        try {
            const result = await validateCoupon(code, total, items)
            if (result.valid) {
                set({
                    coupon: {
                        code,
                        discountAmount: result.discountAmount || 0
                    }
                })
                return { success: true }
            } else {
                return { success: false, message: result.message }
            }
        } catch (error) {
            return { success: false, message: 'Failed to validate coupon' }
        }
    },

    removeCoupon: () => {
        set({ coupon: null })
    }
}))
