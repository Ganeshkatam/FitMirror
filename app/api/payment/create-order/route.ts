import { NextRequest, NextResponse } from 'next/server'
import { razorpay } from '@/lib/razorpay'
import { createClient } from '@/lib/supabase/server'

function generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `ORD-${timestamp}-${random}`
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { items, address, couponCode, shippingMethod } = body
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Invalid order data' }, { status: 400 })
        }

        // 1. Fetch Product Details for Store ID and Validation
        const productIds = items.map((i: any) => i.product_id)
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select(`
                id, store_id, price, name,
                product_inventory (
                    size,
                    stock
                )
            `)
            .in('id', productIds)

        if (prodError || !products) throw new Error("Failed to fetch product details")

        // Map product details
        const productMap = new Map(products.map(p => [p.id, p]))

        // Validation: Check Stock
        for (const item of items) {
            const product = productMap.get(item.product_id)
            if (!product) throw new Error(`Product not found: ${item.product_id}`)

            const inventory = product.product_inventory?.find((inv: any) => inv.size === item.size)

            // Strict Stock Check
            if (!inventory) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn(`Inventory record missing for ${product.name} size ${item.size}, skipping check for dev.`)
                } else {
                    throw new Error(`Size ${item.size} is unavailable for ${product.name}`)
                }
            } else if (inventory.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name} (${item.size}). Only ${inventory.stock} left.`)
            }
        }

        // 2. Calculate Totals (Trusted Calculation)
        let totalGoods = 0
        const storeGroups = new Map<string, any[]>()

        items.forEach((item: any) => {
            const product = productMap.get(item.product_id)
            if (!product) return

            const lineTotal = product.price * item.quantity
            totalGoods += lineTotal

            const storeId = product.store_id
            if (!storeGroups.has(storeId)) {
                storeGroups.set(storeId, [])
            }
            storeGroups.get(storeId)?.push({
                ...item,
                price: product.price,
                name: product.name,
                image: item.image, // Pass through image if available
                lineTotal
            })
        })

        // Coupon Logic
        let discountAmount = 0
        let appliedCouponCode = null

        if (couponCode) {
            const { data: coupon } = await supabase
                .from('coupons')
                .select('*')
                .ilike('code', couponCode)
                .single()

            if (coupon && coupon.is_active) {
                const now = new Date()
                const isActive = (!coupon.starts_at || new Date(coupon.starts_at) <= now) &&
                    (!coupon.expires_at || new Date(coupon.expires_at) >= now)

                if (isActive) {
                    let eligibleAmount = totalGoods
                    if (coupon.store_id) {
                        const storeItems = storeGroups.get(coupon.store_id) || []
                        eligibleAmount = storeItems.reduce((sum, i) => sum + i.lineTotal, 0)
                    }

                    if (eligibleAmount >= (coupon.min_order_amount || 0)) {
                        if (coupon.discount_type === 'percentage') {
                            discountAmount = (eligibleAmount * coupon.discount_value) / 100
                            if (coupon.max_discount_amount) {
                                discountAmount = Math.min(discountAmount, coupon.max_discount_amount)
                            }
                        } else {
                            discountAmount = coupon.discount_value
                        }
                        discountAmount = Math.min(discountAmount, eligibleAmount)
                        appliedCouponCode = coupon.code
                    }
                }
            }
        }

        // Shipping & Tax Calculation
        const shippingCostTotal = shippingMethod === 'express' ? 150 : 0
        const taxableAmount = Math.max(0, totalGoods - discountAmount)
        const taxTotal = Math.round(taxableAmount * 0.18) // 18% GST

        const finalTotal = totalGoods - discountAmount + shippingCostTotal + taxTotal

        // 3. Create Orders
        const createdOrderIds: string[] = []

        let shippingDistributed = 0
        let taxDistributed = 0
        let discountDistributed = 0

        const storeIds = Array.from(storeGroups.keys())
        const isCOD = body.paymentMethod === 'cod' // Check for COD

        for (let i = 0; i < storeIds.length; i++) {
            const storeId = storeIds[i]
            const storeItems = storeGroups.get(storeId)!
            const storeGoodsTotal = storeItems.reduce((sum, item) => sum + item.lineTotal, 0)

            // Proportional calculations (Simplified)
            const ratio = totalGoods > 0 ? storeGoodsTotal / totalGoods : 0

            let storeDiscount = Math.floor(discountAmount * ratio)
            let storeShipping = Math.floor(shippingCostTotal * ratio)
            let storeTax = Math.floor(taxTotal * ratio)

            // Adjust last item to handle rounding errors and ensure totals match exactly
            if (i === storeIds.length - 1) {
                storeDiscount = discountAmount - discountDistributed
                storeShipping = shippingCostTotal - shippingDistributed
                storeTax = taxTotal - taxDistributed
            } else {
                discountDistributed += storeDiscount
                shippingDistributed += storeShipping
                taxDistributed += storeTax
            }

            const storeFinalTotal = storeGoodsTotal - storeDiscount + storeShipping + storeTax
            const orderNumber = generateOrderNumber()

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    store_id: storeId,
                    total_amount: parseFloat(storeFinalTotal.toFixed(2)),
                    discount_amount: parseFloat(storeDiscount.toFixed(2)),
                    coupon_code: appliedCouponCode || '',
                    // COD orders are immediately "placed", online ones wait for payment
                    status: isCOD ? 'placed' : 'pending_payment',
                    shipping_address: address,
                    address_id: address.id,
                    cancellation_reason: '',
                    tracking_number: '',
                    payment_method: isCOD ? 'cod' : 'razorpay',
                    shipping_cost: parseFloat(storeShipping.toFixed(2)),
                    tax_amount: parseFloat(storeTax.toFixed(2)),
                    order_number: orderNumber,
                    items: storeItems // Storing JSONB snapshot
                })
                .select()
                .single()

            if (orderError) throw orderError
            createdOrderIds.push(order.id)

            // Insert Items
            const dbItems = storeItems.map(item => ({
                order_id: order.id,
                product_id: item.product_id,
                size: item.size,
                quantity: item.quantity,
                price: item.price
            }))

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(dbItems)

            if (itemsError) throw itemsError
        }

        console.log(`Created Orders: ${createdOrderIds.join(', ')} for Amount: ${finalTotal}`)

        // 4. Handle Payment Gateway
        if (isCOD) {
            // For COD, we just record the pending payment expectation
            const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                    user_id: user.id,
                    amount: finalTotal,
                    gateway: 'cod',
                    gateway_order_id: `COD-${Date.now()}`,
                    status: 'pending', // Pending collection
                    currency: 'INR',
                    related_orders: createdOrderIds
                })

            if (paymentError) throw paymentError

            return NextResponse.json({
                success: true,
                db_order_ids: createdOrderIds,
                is_cod: true
            })
        }

        // Razorpay Logic (Only if not COD)
        const options = {
            amount: Math.round(finalTotal * 100), // Amount in paise
            currency: 'INR',
            receipt: createdOrderIds[0],
            payment_capture: 1,
            notes: {
                user_id: user.id,
                order_ids: createdOrderIds.join(','),
                coupon: appliedCouponCode || ''
            }
        }

        const razorpayOrder = await razorpay.orders.create(options)

        // 5. Create Payment Record (CRITICAL FOR VERIFY STEP)
        const { error: paymentError } = await supabase
            .from('payments')
            .insert({
                user_id: user.id,
                amount: finalTotal,
                gateway: 'razorpay',
                gateway_order_id: razorpayOrder.id,
                status: 'pending',
                currency: 'INR',
                related_orders: createdOrderIds
            })

        if (paymentError) throw paymentError

        return NextResponse.json({
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            db_order_ids: createdOrderIds
        })

    } catch (error: any) {
        console.error('Payment Init Error:', error)
        return NextResponse.json({ error: error.message || 'Payment initialization failed' }, { status: 500 })
    }
}
