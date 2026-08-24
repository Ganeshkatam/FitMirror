'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { ShoppingBag, Sparkles } from 'lucide-react'

interface MobileBuyBarProps {
    price: number
    originalPrice?: number | null
    discount?: number
    onAddToCart: () => void
    onBuyNow: () => void
    isOutOfStock?: boolean
    hasTryOn?: boolean
    visible: boolean
}

export function MobileBuyBar({
    price,
    originalPrice,
    discount = 0,
    onAddToCart,
    onBuyNow,
    isOutOfStock = false,
    hasTryOn = false,
    visible,
}: MobileBuyBarProps) {
    if (!visible) return null

    return (
        <div className={cn(
            "fixed bottom-16 left-0 right-0 z-40 md:hidden",
            "bg-white/95 backdrop-blur-xl border-t border-gray-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]",
            "transform transition-transform duration-300 ease-out",
            visible ? "translate-y-0" : "translate-y-full"
        )}>
            <div className="flex items-center gap-3 px-4 py-2.5">
                {/* Price Section */}
                <div className="flex-shrink-0 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-gray-900">
                            ₹{price.toLocaleString('en-IN')}
                        </span>
                        {originalPrice && originalPrice > price && (
                            <span className="text-xs text-gray-400 line-through">
                                ₹{originalPrice.toLocaleString('en-IN')}
                            </span>
                        )}
                    </div>
                    {discount > 0 && (
                        <span className="text-[10px] font-bold text-green-600">
                            {discount}% OFF
                        </span>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex-1 flex gap-2">
                    {isOutOfStock ? (
                        <button
                            className="flex-1 py-2.5 rounded-lg bg-gray-200 text-gray-500 text-sm font-bold cursor-not-allowed"
                            disabled
                        >
                            Out of Stock
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onAddToCart}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#ff3f6c] text-white text-sm font-bold shadow-sm active:scale-[0.98] transition-transform"
                            >
                                <ShoppingBag className="h-4 w-4" />
                                ADD TO BAG
                            </button>
                            {hasTryOn && (
                                <button
                                    onClick={onBuyNow}
                                    className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-sm active:scale-[0.98] transition-transform"
                                >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    TRY
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
