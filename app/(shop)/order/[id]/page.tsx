'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Truck, CheckCircle2, MapPin, ArrowLeft, XCircle, Loader2, Phone } from 'lucide-react'
import { toast } from 'sonner'
import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { BuyAgainButton } from "@/components/order/buy-again-button"

interface OrderItem {
    id: string
    product_id: string
    size: string
    quantity: number
    price: number
    products: {
        name: string
        image: string | null
        price: number
        store_id?: string
    }
}

interface Order {
    id: string
    created_at: string
    status: string
    total_amount: number
    payment_method: string
    tracking_number?: string | null
    cancellation_reason?: string | null
    shipping_address: {
        full_name: string
        line1: string
        city: string
        state: string
        postal_code: string
        phone: string
    }
    order_items: OrderItem[]
}

const statusSteps = [
    { key: 'placed', label: 'Order Placed', icon: Package, description: 'We have received your order' },
    { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle2, description: 'Your order has been verified' },
    { key: 'shipped', label: 'Shipped', icon: Truck, description: 'Your order is on the way' },
    { key: 'delivered', label: 'Delivered', icon: MapPin, description: 'Package has been delivered' },
]

function getStatusStep(status: string) {
    if (status === 'cancelled') {
        const index = statusSteps.findIndex(s => s.key === 'placed')
        return index
    }
    const index = statusSteps.findIndex(s => s.key === status)
    return index === -1 ? 0 : index
}

function getEstimatedDelivery(createdAt: string) {
    const date = new Date(createdAt)
    const orderDate = new Date(createdAt)
    date.setDate(date.getDate() + 5) // 5-7 days delivery
    const endDate = new Date(orderDate)
    endDate.setDate(endDate.getDate() + 7)

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    return `${date.toLocaleDateString('en-IN', options)} - ${endDate.toLocaleDateString('en-IN', options)}`
}

const CANCELLATION_REASONS = [
    "Changed my mind",
    "Ordered by mistake",
    "Found a better price",
    "Shipping cost too high",
    "Delivery time too long",
    "Other"
]

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params)
    const [order, setOrder] = React.useState<Order | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [cancelling, setCancelling] = React.useState(false)
    const [requesting, setRequesting] = React.useState(false)

    // Cancellation Dialog State
    const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false)
    const [cancelReason, setCancelReason] = React.useState<string>("")

    const router = useRouter()

    async function handleConfirmCancel() {
        if (!order || !cancelReason) return

        setCancelling(true)
        const supabase = createClient()
        const { error } = await supabase
            .from('orders')
            .update({
                status: 'cancelled',
                cancellation_reason: cancelReason
            })
            .eq('id', order.id)

        if (error) {
            toast.error('Failed to cancel order')
        } else {
            toast.success('Order cancelled successfully')
            setOrder({
                ...order,
                status: 'cancelled',
                cancellation_reason: cancelReason
            })
            setIsCancelDialogOpen(false)
        }
        setCancelling(false)
    }

    async function handleReturnRequest() {
        if (!order) return
        setRequesting(true)
        // In a real app, this would create a return request in the database
        await new Promise(resolve => setTimeout(resolve, 1000))
        toast.success("Return request submitted. We'll contact you shortly.")
        setRequesting(false)
    }

    React.useEffect(() => {
        const supabase = createClient()

        async function fetchOrder() {
            setLoading(true)
            const { data, error } = await supabase
                .from('orders')
                .select('*, addresses(*), order_items(*, products(name, image_url, price, store_id))')
                .eq('id', id)
                .single()

            if (error || !data) {
                toast.error('Order not found')
                setLoading(false)
                return
            }

            // Transform data to match interface
            const formattedOrder: Order = {
                id: data.id,
                created_at: data.created_at,
                status: data.status,
                total_amount: data.total_amount,
                payment_method: data.payment_method || 'cod',
                tracking_number: data.tracking_number,
                cancellation_reason: data.cancellation_reason,
                shipping_address: data.addresses || {
                    full_name: 'Guest',
                    line1: 'Unknown',
                    city: 'Unknown',
                    state: '',
                    postal_code: '',
                    phone: ''
                },
                order_items: data.order_items.map((item: { id: string; product_id: string; size: string; quantity: number; price: number; products: { name: string; image: string | null; price: number; store_id?: string } | null }) => ({
                    id: item.id,
                    product_id: item.product_id,
                    size: item.size,
                    quantity: item.quantity,
                    price: item.price,
                    products: {
                        name: item.products?.name || 'Unknown Product',
                        image: item.products?.image || null,
                        price: item.products?.price || 0,
                        store_id: item.products?.store_id
                    }
                }))
            }

            setOrder(formattedOrder)
            setLoading(false)
        }

        fetchOrder()

        // Realtime Subscription
        const channel = supabase
            .channel(`order-track-${id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${id}`
            }, () => {
                fetchOrder()
                toast.info('Order status updated')
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [id])

    if (loading) {
        return (
            <div className="container px-3 md:px-6 py-6 md:py-12 max-w-2xl">
                <div className="animate-pulse space-y-4 md:space-y-6">
                    <div className="h-6 md:h-8 w-40 md:w-48 bg-muted rounded" />
                    <div className="h-48 md:h-64 bg-muted rounded-lg md:rounded-xl" />
                    <div className="h-32 md:h-40 bg-muted rounded-lg md:rounded-xl" />
                </div>
            </div>
        )
    }

    if (!order) return <div>Order not found</div>

    const currentStep = getStatusStep(order.status)
    const isCancelled = order.status === 'cancelled'

    return (
        <div className="container px-3 md:px-6 py-4 md:py-12 max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-8">
                <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <div>
                    <h1 className="text-lg md:text-2xl font-serif font-bold">Track Order</h1>
                    <p className="text-xs md:text-sm text-muted-foreground font-mono">#{order.id.substring(0, 8)}</p>
                </div>
            </div>

            {/* Status Card */}
            <Card className="mb-4 md:mb-6 overflow-hidden">
                <CardHeader className={`px-3 md:px-6 py-3 md:py-4 ${isCancelled ? 'bg-red-50 dark:bg-red-950/20' : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] md:text-sm text-muted-foreground">Current Status</p>
                            <CardTitle className={`text-base md:text-xl capitalize ${isCancelled ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                                {order.status}
                            </CardTitle>
                        </div>
                        {!isCancelled && order.status !== 'delivered' && (
                            <div className="text-right">
                                <p className="text-[10px] md:text-xs text-muted-foreground">Est. Delivery</p>
                                <p className="font-semibold text-xs md:text-sm">{getEstimatedDelivery(order.created_at)}</p>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-3 md:p-6">
                    {/* Timeline - Compact on mobile */}
                    <div className="relative mb-4 md:mb-8">
                        {statusSteps.map((step, index) => {
                            const isCompleted = index <= currentStep
                            const isCancelledStep = isCancelled && index === currentStep

                            return (
                                <div key={step.key} className="flex gap-2 md:gap-4 pb-5 md:pb-8 last:pb-0">
                                    {/* Line and Icon */}
                                    <div className="flex flex-col items-center">
                                        <div className={`w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all ${isCompleted
                                            ? isCancelledStep ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-green-600 text-white'
                                            : 'bg-muted text-muted-foreground'
                                            } ${isCancelledStep ? 'ring-2 md:ring-4 ring-red-100 dark:ring-red-900' : ''} ${index === currentStep && !isCancelled ? 'ring-2 md:ring-4 ring-green-100 dark:ring-green-900' : ''}`}>

                                            {isCancelledStep ? <XCircle className="h-3.5 w-3.5 md:h-5 md:w-5" /> : <step.icon className="h-3.5 w-3.5 md:h-5 md:w-5" />}
                                        </div>
                                        {index < statusSteps.length - 1 && (
                                            <div className={`w-0.5 flex-1 mt-1.5 md:mt-2 ${index < currentStep ? (isCancelled ? 'bg-red-200 dark:bg-red-900/50' : 'bg-green-600') : 'bg-muted'
                                                }`} />
                                        )}
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 pt-0.5 md:pt-1">
                                        <p className={`font-semibold text-sm md:text-base ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {step.label}
                                        </p>
                                        <p className="text-xs md:text-sm text-muted-foreground hidden md:block">{step.description}</p>
                                        {index === currentStep && !isCancelled && (
                                            <Badge variant="outline" className="mt-1 md:mt-2 text-[10px] md:text-xs border-green-500 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400">
                                                Current
                                            </Badge>
                                        )}
                                        {isCancelledStep && (
                                            <Badge variant="outline" className="mt-1 md:mt-2 text-[10px] md:text-xs border-red-500 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400">
                                                Cancelled
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Tracking Number */}
                    {order.tracking_number && !isCancelled && (
                        <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-lg md:rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5 md:mb-1">Tracking</p>
                                    <code className="text-sm md:text-lg font-mono font-semibold text-blue-700 dark:text-blue-300">
                                        {order.tracking_number}
                                    </code>
                                </div>
                                <a
                                    href={`https://www.google.com/search?q=${order.tracking_number}+tracking`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs md:text-sm text-blue-600 hover:underline"
                                >
                                    Track →
                                </a>
                            </div>
                        </div>
                    )}

                    {isCancelled && (
                        <div className="flex flex-col items-center justify-center py-4 md:py-6 text-center animate-in fade-in-50 bg-red-50 dark:bg-red-950/20 rounded-lg md:rounded-xl border border-red-100 dark:border-red-900/20">
                            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                                <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
                                <h3 className="font-semibold text-sm md:text-base text-red-900 dark:text-red-200">Cancelled</h3>
                            </div>

                            {order.cancellation_reason && (
                                <p className="text-xs md:text-sm font-medium text-red-800 dark:text-red-300">
                                    &quot;{order.cancellation_reason}&quot;
                                </p>
                            )}

                            <p className="text-[10px] md:text-xs text-red-600/80 dark:text-red-400/80 mt-1.5 md:mt-2">
                                Contact support for help.
                            </p>
                            <Button variant="outline" size="sm" className="mt-3 md:mt-4 rounded-full h-8 text-xs border-red-200 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300" onClick={() => router.push('/shop')}>
                                Continue Shopping
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="mb-4 md:mb-6">
                <CardHeader className="px-3 md:px-6 py-3 md:py-4">
                    <CardTitle className="text-sm md:text-base">Items ({order.order_items.length})</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-3 md:pb-6 space-y-3 md:space-y-4">
                    {order.order_items.map((item) => (
                        <div key={item.id} className="flex gap-2 md:gap-4">
                            <div className="w-12 h-16 md:w-16 md:h-20 bg-muted rounded-md md:rounded-lg overflow-hidden flex-shrink-0 relative">
                                {item.products.image ? (
                                    <NextImage src={item.products.image} alt={item.products.name} fill unoptimized className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg md:text-2xl">👗</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-xs md:text-base line-clamp-1">{item.products.name}</p>
                                <p className="text-[10px] md:text-sm text-muted-foreground">Size: {item.size} × {item.quantity}</p>
                                <p className="font-semibold text-xs md:text-base mt-0.5 md:mt-1">₹{((item.price || item.products?.price) * item.quantity).toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Shipping Details */}
            <Card className="mb-4 md:mb-6">
                <CardHeader className="px-3 md:px-6 py-3 md:py-4">
                    <CardTitle className="text-sm md:text-base">Shipping</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-3 md:pb-6 text-xs md:text-sm space-y-0.5 md:space-y-1">
                    <p className="font-semibold">{order.shipping_address.full_name}</p>
                    <p className="text-muted-foreground">{order.shipping_address.line1}</p>
                    <p className="text-muted-foreground">{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                    <div className="flex items-center gap-1.5 md:gap-2 mt-1.5 md:mt-2 text-muted-foreground">
                        <Phone className="h-3 w-3 md:h-4 md:w-4" />
                        <span>{order.shipping_address.phone}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="mb-4 md:mb-8">
                <CardHeader className="px-3 md:px-6 py-3 md:py-4">
                    <CardTitle className="text-sm md:text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-3 md:pb-6 space-y-1.5 md:space-y-2">
                    <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{order.total_amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-green-600">Free</span>
                    </div>
                    <div className="border-t pt-1.5 md:pt-2 mt-1.5 md:mt-2 flex justify-between font-bold text-sm md:text-base">
                        <span>Total</span>
                        <span>₹{order.total_amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-1.5 md:pt-2 text-[10px] md:text-xs text-muted-foreground">
                        Payment: <span className="uppercase font-medium">{order.payment_method}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Order Actions */}
            <div className="flex flex-col gap-2 md:gap-3">
                {(order.status === 'placed' || order.status === 'confirmed') && (
                    <Button
                        variant="destructive"
                        className="w-full h-10 md:h-11 text-sm"
                        onClick={() => setIsCancelDialogOpen(true)}
                        disabled={cancelling}
                    >
                        {cancelling ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cancelling...
                            </>
                        ) : (
                            'Cancel Order'
                        )}
                    </Button>
                )}

                {order.status === 'delivered' && (
                    <div className="space-y-2 md:space-y-3">
                        <BuyAgainButton orderItems={order.order_items} className="w-full h-10 md:h-11 text-sm" />
                        <Button
                            variant="outline"
                            className="w-full h-10 md:h-11 text-sm"
                            onClick={handleReturnRequest}
                            disabled={requesting}
                        >
                            {requesting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Request Return'
                            )}
                        </Button>
                    </div>
                )}

                <Button variant="ghost" className="w-full h-10 md:h-11 text-sm" asChild>
                    <Link href="/profile">Back to Orders</Link>
                </Button>
            </div>

            {/* Cancellation Dialog */}
            <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Cancel Order</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this order? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Label htmlFor="reason" className="mb-2 block">Reason for cancellation</Label>
                        <Select onValueChange={setCancelReason} value={cancelReason}>
                            <SelectTrigger id="reason">
                                <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                                {CANCELLATION_REASONS.map((reason) => (
                                    <SelectItem key={reason} value={reason}>
                                        {reason}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCancelDialogOpen(false)}
                            disabled={cancelling}
                        >
                            Keep Order
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmCancel}
                            disabled={!cancelReason || cancelling}
                        >
                            {cancelling ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                'Confirm Cancellation'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
