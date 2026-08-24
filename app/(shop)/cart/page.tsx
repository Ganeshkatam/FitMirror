'use client'

import * as React from 'react'
import Link from 'next/link'
import NextImage from 'next/image'

import { useCart } from '@/lib/store/cart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Sparkles, Truck, Shield, Tag, ArrowLeft } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function CartPage() {
    const items = useCart((state) => state.items)
    const removeItem = useCart((state) => state.removeItem)
    const updateQuantity = useCart((state) => state.updateQuantity)
    const getTotal = useCart((state) => state.getTotal)
    const coupon = useCart((state) => state.coupon)

    const [mounted, setMounted] = React.useState(false)

    // Preferences State (must be before early returns)
    const [confirmPref, setConfirmPref] = React.useState(false)
    const [itemToRemove, setItemToRemove] = React.useState<{ productId: string, size: string } | null>(null)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    // Fetch user preferences for cart behavior
    React.useEffect(() => {
        const fetchPrefs = async () => {
            const { createClient } = await import('@/lib/supabase/client')
            const { getUserPreferences } = await import('@/lib/utils/user-preferences')
            const supabase = createClient()
            const prefs = await getUserPreferences(supabase)
            if (prefs?.confirm_cart_removal) {
                setConfirmPref(true)
            }
        }
        fetchPrefs()
    }, [])

    // Handler functions (can be defined before early returns)
    const handleRemoveClick = (productId: string, size: string) => {
        if (confirmPref) {
            setItemToRemove({ productId, size })
        } else {
            removeItem(productId, size)
        }
    }

    const confirmRemoval = () => {
        if (itemToRemove) {
            removeItem(itemToRemove.productId, itemToRemove.size)
            setItemToRemove(null)
        }
    }

    if (!mounted) {
        return (
            <div className="container px-4 md:px-6 py-12 max-w-6xl">
                <div className="animate-pulse space-y-6">
                    <div className="h-10 w-64 bg-muted rounded-lg" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="h-32 bg-muted rounded-xl" />
                            ))}
                        </div>
                        <div className="h-80 bg-muted rounded-xl" />
                    </div>
                </div>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="container px-3 md:px-6 py-12 md:py-24 text-center max-w-2xl">
                <div className="p-6 md:p-12 rounded-2xl md:rounded-3xl gradient-gold animate-fade-in">
                    <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-white/80 flex items-center justify-center shadow-lg">
                        <ShoppingBag className="h-8 w-8 md:h-12 md:w-12 text-amber-600" />
                    </div>
                    <h1 className="text-xl md:text-3xl font-serif font-bold mb-2 md:mb-3">Your Cart is Empty</h1>
                    <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-8 max-w-md mx-auto">
                        Discover our curated collection and find pieces that speak to you.
                    </p>
                    <Link href="/shop">
                        <Button size="lg" className="h-10 md:h-14 px-6 md:px-10 text-sm md:text-lg rounded-full btn-premium">
                            <Sparkles className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                            Start Shopping
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)

    return (
        <div className="container px-2 md:px-6 py-4 md:py-12 max-w-6xl">
            {/* ... (Existing Header and Grid) ... */}

            {/* Confirmation Dialog */}
            <Dialog open={!!itemToRemove} onOpenChange={(open) => !open && setItemToRemove(null)}>
                <DialogContent className="max-w-[90vw] md:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base md:text-lg">Remove Item?</DialogTitle>
                        <DialogDescription className="text-sm">
                            Are you sure you want to remove this item from your cart?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setItemToRemove(null)} className="h-9 text-sm">Cancel</Button>
                        <Button variant="destructive" onClick={confirmRemoval} className="h-9 text-sm">Remove</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex items-center justify-between mb-4 md:mb-8 animate-fade-in">
                <div className="flex items-center gap-2 md:gap-4">
                    <Link href="/shop">
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 md:h-10 md:w-10">
                            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-4xl font-serif font-bold tracking-tight">Cart</h1>
                        <p className="text-xs md:text-base text-muted-foreground">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
                    </div>
                </div>
                <Link href="/shop" className="hidden sm:block">
                    <Button variant="outline" className="rounded-full hover-lift text-xs md:text-sm h-8 md:h-10 px-3 md:px-4">
                        Continue Shopping
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                {/* Items */}
                <div className="lg:col-span-2 space-y-2 md:space-y-4">
                    {items.map((item, index) => (
                        <Card
                            key={`${item.productId}-${item.size}`}
                            className="overflow-hidden hover-lift animate-fade-in group"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="flex">
                                <CartItemImage item={item} />
                                <CardContent className="flex-1 p-2.5 md:p-6 flex flex-col justify-between">
                                    <div>
                                        <Link href={`/product/${item.productId}`}>
                                            <h3 className="font-semibold text-sm md:text-lg hover:text-amber-600 transition-colors line-clamp-2">{item.productName}</h3>
                                        </Link>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="text-[10px] md:text-sm px-1.5 md:px-2 py-0.5 bg-muted rounded-full">Size: {item.size}</span>
                                            {item.color && (
                                                <span className="text-[10px] md:text-sm px-1.5 md:px-2 py-0.5 bg-muted rounded-full flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full border border-gray-300" style={{ backgroundColor: item.color }} />
                                                    {item.color}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2 md:mt-4">
                                        <p className="text-base md:text-xl font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                        <div className="flex items-center gap-1.5 md:gap-3">
                                            <div className="flex items-center border rounded-full overflow-hidden">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 md:h-9 md:w-9 rounded-none hover:bg-muted"
                                                    onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                                                >
                                                    <Minus className="h-3 w-3 md:h-4 md:w-4" />
                                                </Button>
                                                <span className="w-6 md:w-10 text-center font-medium text-xs md:text-base">{item.quantity}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 md:h-9 md:w-9 rounded-none hover:bg-muted"
                                                    onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                                                >
                                                    <Plus className="h-3 w-3 md:h-4 md:w-4" />
                                                </Button>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 md:h-9 md:w-9 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full"
                                                onClick={() => handleRemoveClick(item.productId, item.size)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </div>
                        </Card>
                    ))}
                </div>


                {/* Summary */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-20 animate-fade-in overflow-hidden" style={{ animationDelay: '0.2s' }}>
                        <div className="h-1.5 md:h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
                        <CardHeader className="pb-2 md:pb-4 py-3 md:py-6">
                            <CardTitle className="text-base md:text-xl">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5 md:space-y-4 pt-0">
                            {/* Coupon Input */}
                            <CouponInput />

                            <div className="flex justify-between text-sm md:text-base">
                                <span className="text-muted-foreground">Subtotal ({itemCount})</span>
                                <span className="font-medium">₹{items.reduce((acc, i) => acc + (i.price * i.quantity), 0).toLocaleString('en-IN')}</span>
                            </div>

                            {/* Discount Display */}
                            {coupon && (
                                <div className="flex justify-between text-sm md:text-base text-green-600">
                                    <span className="flex items-center gap-1.5">
                                        <Tag className="h-3.5 w-3.5" /> Discount
                                    </span>
                                    <span className="font-medium">-₹{coupon.discountAmount.toLocaleString('en-IN')}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-sm md:text-base">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                    <Truck className="h-3.5 w-3.5 md:h-4 md:w-4" /> Shipping
                                </span>
                                <span className="text-green-600 font-medium flex items-center gap-1 text-xs md:text-base">
                                    <Tag className="h-2.5 w-2.5 md:h-3 md:w-3" /> FREE
                                </span>
                            </div>

                            <div className="border-t pt-2.5 md:pt-4">
                                <div className="flex justify-between text-base md:text-lg font-bold">
                                    <span>Total</span>
                                    <span>₹{getTotal().toLocaleString('en-IN')}</span>
                                </div>
                                <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">Inclusive of all taxes</p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2 md:gap-3 pt-0">
                            <Link href="/checkout" className="w-full">
                                <Button className="w-full h-10 md:h-12 rounded-lg md:rounded-xl text-sm md:text-lg btn-premium" size="lg">
                                    Checkout
                                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                                </Button>
                            </Link>

                            {/* Trust Badges */}
                            <div className="flex items-center justify-center gap-3 md:gap-4 pt-2 md:pt-4 border-t w-full">
                                <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                                    <Shield className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
                                    <span>Secure</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                                    <Truck className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
                                    <span>Fast Delivery</span>
                                </div>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div >
    )
}

import { getProductImage } from '@/lib/utils/image-fallback'
import { CouponInput } from '@/components/cart/coupon-input'

function CartItemImage({ item }: { item: any }) {
    const [error, setError] = React.useState(false)

    // Use centralized util
    const imageUrl = getProductImage(item.productName, item.productImage)

    if (!imageUrl || error) {
        return (
            <div className="w-full h-full min-h-[144px] md:min-h-[160px] flex items-center justify-center bg-gray-100 text-4xl">
                👗
            </div>
        )
    }

    return (
        <Link href={`/product/${item.productId}`} className="block w-28 h-36 md:w-32 md:h-40 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 shrink-0 overflow-hidden relative">
            <NextImage
                src={imageUrl}
                alt={item.productName}
                fill
                unoptimized
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setError(true)}
            />
        </Link>
    )
}
