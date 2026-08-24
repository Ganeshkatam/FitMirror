'use client'

import React, { useEffect, useState } from 'react'
import { Copy, Ticket, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface Coupon {
    id: string
    code: string
    title: string | null
    discount_type: 'percentage' | 'fixed'
    discount_value: number
    min_order_value: number | null
    min_order_amount: number | null
    is_active: boolean
    created_at: string
    expires_at: string | null
}

export function CouponBanner() {
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)

    // Fetch coupons on mount and subscribe to real-time updates
    useEffect(() => {
        const supabase = createClient()

        async function fetchCoupons() {
            setLoading(true)
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (!error && data) {
                setCoupons(data)
            }
            setLoading(false)
        }

        fetchCoupons()

        // Subscribe to real-time changes
        const channel = supabase
            .channel('coupons-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'coupons',
                },
                () => {
                    // Refetch coupons on any change
                    fetchCoupons()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    // Auto-rotate coupons every 5 seconds if multiple
    useEffect(() => {
        if (coupons.length <= 1) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % coupons.length)
        }, 5000)

        return () => clearInterval(interval)
    }, [coupons.length])

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code)
        toast.success("Coupon code copied!", {
            description: `Code ${code} copied to clipboard`
        })
    }

    // Don't render if no coupons
    if (loading) {
        return (
            <section className="w-full py-4 md:py-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-y border-amber-100/50 dark:border-amber-900/50">
                <div className="container px-3 md:px-4">
                    <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/20 animate-pulse h-24 md:h-32" />
                </div>
            </section>
        )
    }

    if (coupons.length === 0) {
        return null
    }

    const currentCoupon = coupons[currentIndex]
    const discountText = currentCoupon.discount_type === 'percentage'
        ? `${currentCoupon.discount_value}% OFF`
        : `₹${currentCoupon.discount_value} OFF`

    return (
        <section className="w-full py-4 md:py-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-y border-amber-100/50 dark:border-amber-900/50">
            <div className="container px-3 md:px-4">
                <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white shadow-xl shadow-orange-500/25">
                    {/* Animated Background Elements */}
                    <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1),transparent_70%)] pointer-events-none" />

                    <div className="flex flex-col md:flex-row items-center justify-between p-4 md:p-8 gap-4 md:gap-6 relative z-10">
                        {/* Left: Offer Details */}
                        <div className="flex items-center gap-3 md:gap-4 text-center md:text-left">
                            <div className="hidden md:flex h-14 w-14 md:h-16 md:w-16 bg-white/20 rounded-full items-center justify-center backdrop-blur-sm shadow-inner">
                                <Zap className="h-7 w-7 md:h-8 md:w-8 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                                    <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-yellow-300 animate-pulse" />
                                    <span className="text-[10px] md:text-xs uppercase tracking-widest font-semibold text-orange-100">Limited Time Offer</span>
                                </div>
                                <h3 className="text-2xl md:text-4xl font-black italic tracking-tight drop-shadow-md">
                                    GET {discountText}
                                </h3>
                                <p className="text-orange-100 font-medium text-xs md:text-sm mt-1">
                                    {currentCoupon.title || 'On your order'}
                                    {currentCoupon.min_order_value && currentCoupon.min_order_value > 0 && (
                                        <> • Min. ₹{currentCoupon.min_order_value}</>
                                    )}
                                    {' • '} T&C Apply
                                </p>
                            </div>
                        </div>

                        {/* Right: Coupon Code */}
                        <div className="flex items-center gap-2 md:gap-3 bg-white/15 backdrop-blur-md p-2 md:p-3 pl-3 md:pl-5 rounded-lg md:rounded-xl border border-white/30 border-dashed shadow-inner">
                            <div className="text-left">
                                <span className="text-[9px] md:text-[10px] text-orange-200 uppercase tracking-widest font-bold block">Coupon Code</span>
                                <span className="font-mono font-bold text-lg md:text-2xl tracking-widest text-white drop-shadow-sm">{currentCoupon.code}</span>
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => copyCode(currentCoupon.code)}
                                className="h-9 md:h-11 px-3 md:px-4 hover:bg-white bg-white text-orange-600 font-bold border-0 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                            >
                                <Copy className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                                <span className="text-xs md:text-sm">COPY</span>
                            </Button>
                        </div>
                    </div>

                    {/* Multiple Coupons Indicator */}
                    {coupons.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {coupons.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex
                                        ? 'w-6 bg-white'
                                        : 'w-1.5 bg-white/40 hover:bg-white/60'
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
