'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCoupons() {
    const supabase = await createClient()
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data
}

export async function createCoupon(data: any) {
    const supabase = await createClient()
    // Ensure numeric fields are numbers
    const payload = {
        ...data,
        discount_value: Number(data.discount_value),
        min_order_amount: data.min_order_amount ? Number(data.min_order_amount) : null,
        max_discount_amount: data.max_discount_amount ? Number(data.max_discount_amount) : null,
        usage_limit: data.usage_limit ? Number(data.usage_limit) : null
    }

    const { error } = await supabase.from('coupons').insert(payload)
    if (error) throw error
    revalidatePath('/checkout')
    return { success: true }
}

// Helper to apply coupon (used in Checkout)
export async function applyCouponToOrder(code: string, orderTotal: number) {
    const res = await validateCoupon(code, orderTotal, [])

    if (!res.valid) {
        return { success: false, message: res.message, discountAmount: 0, finalTotal: orderTotal }
    }

    return {
        success: true,
        discountAmount: res.discountAmount || 0,
        finalTotal: orderTotal - (res.discountAmount || 0)
    }
}

export async function deleteCoupon(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('coupons').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/checkout')
    return { success: true }
}

export async function toggleCouponStatus(id: string, isActive: boolean) {
    const supabase = await createClient()
    const { error } = await supabase.from('coupons').update({ is_active: isActive }).eq('id', id)
    if (error) throw error
    revalidatePath('/checkout')
    return { success: true }
}

export type CouponValidationResult = {
    valid: boolean
    message?: string
    discountAmount?: number
    coupon?: any
}

export async function validateCoupon(code: string, cartTotal: number, cartItems: any[]): Promise<CouponValidationResult> {
    const supabase = await createClient()

    // 1. Fetch Coupon
    const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .ilike('code', code) // Case insensitive
        .single()

    if (error || !coupon) {
        return { valid: false, message: 'Invalid coupon code or not found' }
    }

    // 2. Check Validity (Active, Dates, Usage)
    if (!coupon.is_active) return { valid: false, message: 'Coupon is inactive' }

    const now = new Date()
    const validUntil = coupon.expires_at || coupon.valid_until
    if (coupon.starts_at && new Date(coupon.starts_at) > now) return { valid: false, message: 'Coupon not yet active' }
    if (validUntil && new Date(validUntil) < now) return { valid: false, message: 'Coupon expired' }
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) return { valid: false, message: 'Coupon usage limit reached' }

    // 3. Calculate Applicable Total (Store Filter)
    let applicableTotal = 0

    if (coupon.store_id) {
        // Only apply to items from this store
        const storeItems = cartItems.filter((i: any) =>
            (i.storeId === coupon.store_id) || (i.product?.store_id === coupon.store_id)
        )
        if (storeItems.length === 0 && cartItems.length > 0) {
            return { valid: false, message: 'This coupon is not valid for items in your cart' }
        }
        applicableTotal = storeItems.length > 0
            ? storeItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0)
            : cartTotal
    } else {
        // Platform coupon applies to everything
        applicableTotal = cartTotal
    }

    // 4. Check Min Order Amount
    const minOrder = coupon.min_order_amount ?? coupon.min_order_value
    if (minOrder && applicableTotal < minOrder) {
        return { valid: false, message: `Minimum order value of ₹${minOrder} required` }
    }

    // 5. Calculate Discount
    let discount = 0
    if (coupon.discount_type === 'percentage') {
        discount = (applicableTotal * coupon.discount_value) / 100
        if (coupon.max_discount_amount) {
            discount = Math.min(discount, coupon.max_discount_amount)
        }
    } else {
        discount = coupon.discount_value
    }

    // Ensure discount doesn't exceed total
    discount = Math.min(discount, applicableTotal)

    return {
        valid: true,
        discountAmount: Math.round(discount),
        coupon: coupon
    }
}
