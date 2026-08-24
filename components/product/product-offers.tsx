'use client'

import React from 'react'
import { TicketPercent, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface Coupon {
    id: string
    code: string
    discount_type: 'percentage' | 'fixed'
    discount_value: number
    min_order_amount: number
    description?: string
}

interface ProductOffersProps {
    coupons: Coupon[]
}

export function ProductOffers({ coupons }: ProductOffersProps) {
    const [copiedId, setCopiedId] = React.useState<string | null>(null)

    if (!coupons || coupons.length === 0) return null

    const handleCopy = (code: string, id: string) => {
        navigator.clipboard.writeText(code)
        setCopiedId(id)
        toast.success(`Coupon ${code} copied!`)
        setTimeout(() => setCopiedId(null), 2000)
    }

    return (
        <div className="space-y-3 py-4 border-t border-b">
            <h4 className="font-bold text-sm flex items-center gap-2">
                <TicketPercent className="h-4 w-4 text-[#ff3f6c]" />
                Best Offers
            </h4>
            <div className="space-y-2">
                {coupons.map((coupon) => (
                    <div
                        key={coupon.id}
                        className="flex items-center justify-between p-3 bg-white border border-dashed border-gray-300 rounded-lg hover:border-[#ff3f6c] hover:bg-pink-50/10 transition-colors"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">{coupon.code}</span>
                                <span className="text-xs text-gray-500">
                                    {coupon.discount_type === 'percentage'
                                        ? `Get ${coupon.discount_value}% Off`
                                        : `Save ₹${coupon.discount_value}`}
                                </span>
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                                {coupon.min_order_amount > 0
                                    ? `On orders above ₹${coupon.min_order_amount}`
                                    : 'No minimum order value'}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(coupon.code, coupon.id)}
                            className="h-8 px-2 text-xs font-bold text-[#ff3f6c] hover:text-[#ff3f6c] hover:bg-pink-50"
                        >
                            {copiedId === coupon.id ? (
                                <span className="flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Copied
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <Copy className="h-3 w-3" /> Copy
                                </span>
                            )}
                        </Button>
                    </div>
                ))}
            </div>
            {/* View All Offers Link - Placeholder for now */}
            <button className="text-xs font-bold text-[#ff3f6c] hover:underline">
                + View {coupons.length > 2 ? coupons.length - 2 : ''} more offers
            </button>
        </div>
    )
}
