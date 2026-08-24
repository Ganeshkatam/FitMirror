'use client'

import { useCart } from '@/lib/store/cart'
import { Button } from '@/components/ui/button'
import { ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { validateCoupon } from '@/lib/actions/coupons'
import { getUserLoyaltyInfo, redeemPoints } from '@/lib/actions/loyalty'
import Script from 'next/script'
import Link from 'next/link'

import { CheckoutAddress } from '@/components/checkout/checkout-address'
import { CheckoutSummary } from '@/components/checkout/checkout-summary'
import { ShippingOptions, ShippingMethod } from '@/components/checkout/shipping-options'

declare global {
    interface Window {
        Razorpay: any
    }
}

export default function CheckoutPage() {
    const { items, getTotal, syncCart, loading } = useCart()
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Checkout State
    const [selectedAddress, setSelectedAddress] = useState<any>(null)
    const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard')
    const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online')

    // Coupon State
    const [couponCode, setCouponCode] = useState('')
    const [discount, setDiscount] = useState(0)
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
    const [validatingCoupon, setValidatingCoupon] = useState(false)

    // Loyalty Points State
    const [loyaltyInfo, setLoyaltyInfo] = useState<{
        points: number
        max_discount: number
        can_redeem: boolean
    } | null>(null)
    const [loyaltyDiscount, setLoyaltyDiscount] = useState(0)
    const [redeemingPoints, setRedeemingPoints] = useState(false)

    // Costs
    const subtotal = getTotal()
    const expressCost = 150 // Could be dynamic based on weight/zone
    const shippingCost = shippingMethod === 'express' ? expressCost : 0
    // Tax Calculation (GST 18% on specific items or total - simplified here)
    // In production, this should come from the server calculation
    const taxRate = 0.18
    const tax = Math.round((subtotal - discount - loyaltyDiscount) * taxRate)
    const total = Math.max(0, subtotal - discount - loyaltyDiscount + shippingCost + tax)

    useEffect(() => {
        setMounted(true)
        syncCart()
        getUserLoyaltyInfo().then(info => {
            if (info) setLoyaltyInfo(info)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleApplyCoupon = async () => {
        if (!couponCode) return
        setValidatingCoupon(true)
        try {
            const res = await validateCoupon(couponCode, subtotal, items)
            if (res.valid) {
                setDiscount(res.discountAmount || 0)
                setAppliedCoupon(res.coupon.code)
                toast.success(`Coupon applied! Saved ₹${res.discountAmount}`)
            } else {
                setDiscount(0)
                setAppliedCoupon(null)
                toast.error(res.message || "Invalid Coupon")
            }
        } catch (e) {
            toast.error("Failed to validate coupon")
        } finally {
            setValidatingCoupon(false)
        }
    }

    const handleRedeemPoints = async () => {
        if (!loyaltyInfo || !loyaltyInfo.can_redeem) return
        setRedeemingPoints(true)
        try {
            const pointsToRedeem = Math.min(loyaltyInfo.points, Math.floor((subtotal - discount) * 10))
            const result = await redeemPoints(pointsToRedeem)
            if (result.success) {
                setLoyaltyDiscount(result.discount || 0)
                setLoyaltyInfo(prev => prev ? {
                    ...prev,
                    points: result.remaining_points || 0,
                    max_discount: Math.floor((result.remaining_points || 0) / 10),
                    can_redeem: (result.remaining_points || 0) >= 100
                } : null)
                toast.success(`Redeemed ${result.points_used} points for ₹${result.discount} discount!`)
            } else {
                toast.error(result.message || 'Failed to redeem')
            }
        } catch (e) {
            toast.error('Failed to redeem points')
        } finally {
            setRedeemingPoints(false)
        }
    }

    const handlePayment = async () => {
        if (!selectedAddress) {
            toast.error("Please select a delivery address")
            return
        }

        setIsSubmitting(true)
        try {
            // 1. Create Order via API
            const orderItems = items.map(item => ({
                product_id: item.productId,
                size: item.size,
                quantity: item.quantity,
                price: item.price
            }))

            const res = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: total,
                    items: orderItems,
                    address: selectedAddress,
                    shippingMethod,
                    paymentMethod,
                    shippingCost,
                    tax,
                    couponCode: appliedCoupon
                })
            })
            const orderData = await res.json()
            if (orderData.error) throw new Error(orderData.error)

            // 1b. Handle COD Success
            if (paymentMethod === 'cod' && orderData.success) {
                router.push(`/order-confirmation?orders=${orderData.db_order_ids.join(',')}&status=success`)
                return
            }

            // 2. Open Razorpay (Only for Online)
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "FitMirror Store",
                description: `Order #${orderData.db_order_ids[0].slice(0, 8)}`,
                order_id: orderData.id,
                handler: async function (response: any) {
                    // 3. Verify
                    const verifyRes = await fetch('/api/payment/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            db_order_ids: orderData.db_order_ids
                        })
                    })

                    const verifyData = await verifyRes.json()
                    if (verifyData.status === 'success') {
                        // Success - Redirect
                        router.push(`/order-confirmation?orders=${orderData.db_order_ids.join(',')}&status=success`)
                    } else {
                        toast.error("Payment verification failed")
                        setIsSubmitting(false)
                    }
                },
                prefill: {
                    name: selectedAddress.full_name,
                    contact: selectedAddress.phone,
                },
                theme: { color: "#000000" }
            }

            const rzp = new window.Razorpay(options)
            rzp.open()
            rzp.on('payment.failed', function (response: any) {
                toast.error(response.error.description)
                setIsSubmitting(false)
            })

        } catch (error: any) {
            toast.error(error.message || "Checkout failed")
            setIsSubmitting(false)
        }
    }

    if (!mounted) return null
    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <ShoppingBag size={48} className="text-muted-foreground/50" />
                <h1 className="text-xl font-semibold">Your cart is empty</h1>
                <p className="text-muted-foreground">Add items to your cart to proceed with checkout.</p>
                <Button asChild>
                    <Link href="/shop">Continue Shopping</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            <div className="container max-w-6xl py-8 px-4 md:px-6">
                <div className="mb-6 flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild className="-ml-3 text-muted-foreground hover:text-foreground">
                        <Link href="/cart">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Cart
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold ml-2">Secure Checkout</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN - STEPS */}
                    <div className="lg:col-span-8 space-y-6">
                        <CheckoutAddress
                            onSelect={setSelectedAddress}
                            selectedId={selectedAddress?.id}
                        />

                        <ShippingOptions
                            value={shippingMethod}
                            onChange={setShippingMethod}
                            expressCost={expressCost}
                        />

                        {/* Payment Method - Static for now as only Razorpay is supported */}
                        <div className="p-4 border rounded-xl bg-white shadow-sm">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <div className="bg-primary/10 p-1.5 rounded-full">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                </div>
                                Payment Method
                            </h3>
                            <div className="space-y-3">
                                {/* Online Payment Option */}
                                <div
                                    className={`relative flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-white hover:border-gray-300'}`}
                                    onClick={() => setPaymentMethod('online')}
                                >
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 bg-white">
                                        {paymentMethod === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                    </div>
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-10 h-6 bg-blue-900/90 rounded relative overflow-hidden flex items-center justify-center text-[8px] text-white font-bold tracking-widest shrink-0">
                                            VISA
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">Online Payment</p>
                                            <p className="text-xs text-muted-foreground">Credit/Debit Card, UPI, Netbanking</p>
                                        </div>
                                    </div>
                                </div>

                                {/* COD Option */}
                                <div
                                    className={`relative flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-white hover:border-gray-300'}`}
                                    onClick={() => setPaymentMethod('cod')}
                                >
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 bg-white">
                                        {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                    </div>
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-10 h-6 bg-green-600 rounded flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                                            ₹
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">Cash on Delivery</p>
                                            <p className="text-xs text-muted-foreground">Pay nicely when it arrives</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handlePayment} disabled={isSubmitting || !selectedAddress} className="w-full mt-4 h-11 text-base">
                                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (paymentMethod === 'cod' ? `Place Order • ₹${total}` : `Pay Now • ₹${total}`)}
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - SUMMARY */}
                    <div className="lg:col-span-4">
                        <CheckoutSummary
                            items={items}
                            subtotal={subtotal}
                            discount={discount}
                            loyaltyDiscount={loyaltyDiscount}
                            shipping={shippingCost}
                            tax={tax}
                            total={total}
                        />

                        {/* Coupon Input Mobile/Desktop unified in Summary or below */}
                        <div className="mt-4 p-4 bg-white border rounded-xl shadow-sm">
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="Enter discount code"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    disabled={!!appliedCoupon}
                                />
                                {appliedCoupon ? (
                                    <Button variant="outline" size="sm" onClick={() => {
                                        setAppliedCoupon(null)
                                        setDiscount(0)
                                        setCouponCode('')
                                        toast.info("Coupon removed")
                                    }}>Remove</Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={handleApplyCoupon}
                                        disabled={validatingCoupon || !couponCode}
                                    >
                                        {validatingCoupon ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                                    </Button>
                                )}
                            </div>

                            {loyaltyInfo && loyaltyInfo.points > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium flex items-center gap-1.5">
                                            <div className="w-4 h-4 rounded-full bg-yellow-100 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
                                            </div>
                                            FitMirror Points
                                        </span>
                                        <span className="text-xs text-muted-foreground">{loyaltyInfo.points} pts</span>
                                    </div>
                                    {loyaltyDiscount > 0 ? (
                                        <p className="text-xs text-green-600 font-medium">Applied -₹{loyaltyDiscount}</p>
                                    ) : loyaltyInfo.can_redeem ? (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full text-xs h-8 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 border"
                                            onClick={handleRedeemPoints}
                                            disabled={redeemingPoints}
                                        >
                                            {redeemingPoints ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : 'Redeem Points'}
                                        </Button>
                                    ) : (
                                        <p className="text-[10px] text-muted-foreground">Min 100 points required to redeem</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

