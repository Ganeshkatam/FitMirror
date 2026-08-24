'use client'

import { Button } from '@/components/ui/button'
import { Copy, Check, Ticket } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Coupon {
    id: string
    code: string
    discount_type: string
    discount_value: number
    min_order_amount?: number
}

export function CouponCarousel({ coupons }: { coupons: Coupon[] }) {
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const handleCopy = (code: string, id: string) => {
        navigator.clipboard.writeText(code)
        setCopiedId(id)
        toast.success("Coupon code copied!", { description: `Use code ${code} at checkout.` })
        setTimeout(() => setCopiedId(null), 2000)
    }

    if (!coupons.length) return null

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Ticket className="w-5 h-5 text-rose-600" />
                Active Coupons
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {coupons.map((coupon) => (
                    <div key={coupon.id} className="relative group min-w-[280px] snap-center">
                        {/* Cutout Pattern */}
                        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-stone-50 rounded-full border-r border-gray-200 z-10" />
                        <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-stone-50 rounded-full border-l border-gray-200 z-10" />

                        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3 shadow-sm group-hover:shadow-md transition-all h-full justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Ticket className="w-16 h-16 -rotate-12" />
                            </div>

                            <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {coupon.discount_type === 'percentage' ? 'Percent Off' : 'Flat Discount'}
                                </div>
                                <div className="text-2xl font-black text-gray-900 mt-1">
                                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                                </div>
                                {coupon.min_order_amount && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        On orders above ₹{coupon.min_order_amount}
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-dashed border-gray-200 flex items-center justify-between gap-2">
                                <code className={cn(
                                    "font-mono font-bold text-sm bg-gray-50 px-2 py-1 rounded border border-gray-200 text-rose-600",
                                    copiedId === coupon.id && "bg-green-50 text-green-700 border-green-200"
                                )}>
                                    {coupon.code}
                                </code>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                                    onClick={() => handleCopy(coupon.code, coupon.id)}
                                >
                                    {copiedId === coupon.id ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-gray-500" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
