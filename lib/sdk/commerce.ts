import { createClient } from '@/lib/supabase/client'

export interface CartItem {
    productId: string
    quantity: number
    variantId?: string
}

export class FitMirrorCommerce {
    private static instance: FitMirrorCommerce
    private supabase = createClient()

    private constructor() { }

    public static getInstance(): FitMirrorCommerce {
        if (!FitMirrorCommerce.instance) {
            FitMirrorCommerce.instance = new FitMirrorCommerce()
        }
        return FitMirrorCommerce.instance
    }

    public async addToCart(userId: string, item: CartItem): Promise<boolean> {
        try {
            // 1. Get or create the user's cart
            let { data: cart } = await this.supabase
                .from('carts')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle()

            if (!cart) {
                const { data: newCart, error: cartError } = await this.supabase
                    .from('carts')
                    .insert({ user_id: userId })
                    .select('id')
                    .single()

                if (cartError || !newCart) {
                    console.error("Commerce SDK Error (create cart):", cartError)
                    return false
                }
                cart = newCart
            }

            // 2. Upsert item into cart_items using cart_id
            const { error } = await this.supabase
                .from('cart_items')
                .upsert(
                    {
                        cart_id: cart.id,
                        product_id: item.productId,
                        quantity: item.quantity,
                        variant_id: item.variantId || null
                    },
                    { onConflict: 'cart_id,product_id' }
                )

            if (error) {
                console.error("Commerce SDK Error (add item):", error)
                return false
            }
            return true
        } catch (e) {
            console.error("Commerce SDK Error:", e)
            return false
        }
    }

    public async checkout(userId: string): Promise<string> {
        // Mock checkout flow
        // In real implementations, this calls Stripe/Razorpay
        return "https://checkout.stripe.com/mock-session-id"
    }

    public async getOrders(userId: string): Promise<any[]> {
        const { data } = await this.supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)

        return data || []
    }
}
