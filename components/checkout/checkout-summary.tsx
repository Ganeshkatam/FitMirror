'use client'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ShoppingBag, Tag, Coins } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface CheckoutSummaryProps {
    items: any[]
    subtotal: number
    discount: number
    loyaltyDiscount: number
    shipping: number
    tax: number
    total: number
    loading?: boolean
}

export function CheckoutSummary({
    items,
    subtotal,
    discount,
    loyaltyDiscount,
    shipping,
    tax,
    total,
    loading
}: CheckoutSummaryProps) {
    return (
        <Card className="border-border shadow-sm h-fit sticky top-24">
            <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Order Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid gap-6">
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((item) => (
                        <div key={`${item.productId}-${item.size}`} className="flex gap-4 group">
                            <div className="relative h-16 w-16 overflow-hidden rounded-lg border bg-muted shrink-0">
                                <Image
                                    src={item.productImage || '/placeholder.jpg'}
                                    alt={item.productName}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <div className="flex flex-1 flex-col justify-center gap-1">
                                <h4 className="font-medium text-sm line-clamp-1" title={item.productName}>
                                    {item.productName}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="capitalize bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide">
                                        {item.size}
                                    </span>
                                    <span>Qty: {item.quantity}</span>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center items-end">
                                <span className="font-semibold text-sm">
                                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                </span>
                                {item.quantity > 1 && (
                                    <span className="text-[10px] text-muted-foreground">
                                        ₹{item.price}/ea
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <Separator />

                <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal ({items.length} items)</span>
                        <span>₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>

                    {discount > 0 && (
                        <div className="flex justify-between text-green-600 bg-green-50/50 p-2 rounded-lg items-center">
                            <div className="flex items-center gap-1.5">
                                <Tag className="h-3.5 w-3.5" />
                                <span>Coupon Saving</span>
                            </div>
                            <span className="font-medium">-₹{discount.toLocaleString('en-IN')}</span>
                        </div>
                    )}

                    {loyaltyDiscount > 0 && (
                        <div className="flex justify-between text-purple-600 bg-purple-50/50 p-2 rounded-lg items-center">
                            <div className="flex items-center gap-1.5">
                                <Coins className="h-3.5 w-3.5" />
                                <span>Loyalty Points</span>
                            </div>
                            <span className="font-medium">-₹{loyaltyDiscount.toLocaleString('en-IN')}</span>
                        </div>
                    )}

                    <div className="flex justify-between text-muted-foreground">
                        <span>Shipping</span>
                        {shipping === 0 ? (
                            <span className="text-green-600 font-medium">Free</span>
                        ) : (
                            <span>₹{shipping.toLocaleString('en-IN')}</span>
                        )}
                    </div>

                    <div className="flex justify-between text-muted-foreground">
                        <span className="flex items-center gap-1">
                            Tax (GST)
                            <span className="text-[10px] bg-muted px-1 rounded">18%</span>
                        </span>
                        <span>₹{tax.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <Separator className="bg-border/60" />

                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-base font-semibold block">Total</span>
                        <span className="text-xs text-muted-foreground block mt-0.5 opacity-80">
                            Including of all taxes
                        </span>
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-primary">
                        ₹{total.toLocaleString('en-IN')}
                    </span>
                </div>
            </CardContent>

            <CardFooter className="bg-muted/30 px-6 py-4 flex flex-col gap-2">
                <div className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground opacity-70">
                    <span className="flex items-center gap-1">🔒 Secure Checkout</span>
                    <span>•</span>
                    <span>💯 Official Warranty</span>
                </div>
            </CardFooter>
        </Card>
    )
}
