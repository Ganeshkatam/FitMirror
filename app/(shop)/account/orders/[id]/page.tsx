import { getOrder, cancelOrder } from '@/lib/actions/orders'
import { notFound, redirect } from 'next/navigation'
import { AccountLayout } from '@/components/account/account-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Package, Truck, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
    params: { id: string }
    searchParams: { tab?: string }
}

export default async function OrderDetailsPage({ params, searchParams }: PageProps) {
    const supabase = await createClient()
    const order = await getOrder(params.id)

    if (!order) {
        notFound()
    }

    const steps = [
        { key: 'placed', label: 'Placed', icon: Package, date: order.created_at },
        { key: 'shipped', label: 'Shipped', icon: Truck, date: order.shipped_at },
        { key: 'delivered', label: 'Delivered', icon: CheckCircle, date: order.delivered_at },
    ]

    const statusIndex = steps.findIndex(s => s.key === order.status)
    const currentStepIndex = statusIndex === -1 ? (order.status === 'processing' ? 0 : -1) : statusIndex
    const isCancelled = order.status === 'cancelled'

    async function handleCancel() {
        'use server'
        await cancelOrder(order.id)
    }

    const deliveryDate = order.delivered_at ? new Date(order.delivered_at) : null
    const isDelivered = !!deliveryDate
    const timeSinceDelivery = deliveryDate ? Math.abs(new Date().getTime() - deliveryDate.getTime()) : 0
    const daysSinceDelivery = Math.ceil(timeSinceDelivery / (1000 * 60 * 60 * 24))
    const isReturnWindowOpen = isDelivered && daysSinceDelivery <= 7

    // Fetch existing return if any
    const { data: returnRecord } = await supabase
        .from('returns')
        .select('*')
        .eq('order_id', params.id)
        .single()

    return (
        <AccountLayout title={`Order #${order.order_number || order.id.slice(0, 8)}`} description={`Placed on ${format(new Date(order.created_at), 'MMM dd, yyyy')}`}>
            <div className="mb-6 flex justify-between items-center">
                <Link href="/account/orders" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Back to Orders
                </Link>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/account/orders/${order.id}/invoice`} target="_blank">
                            Download Invoice
                        </Link>
                    </Button>
                    {isReturnWindowOpen && !isCancelled && !returnRecord && (
                        <Button variant="default" size="sm" asChild>
                            <Link href={`/account/orders/${order.id}/return`}>
                                Return / Exchange
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Default View */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Return Status Card */}
                {returnRecord && (
                    <Card className="border-blue-200 bg-blue-50/50 mb-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium flex justify-between items-center text-blue-700">
                                Return Status
                                <Badge className="bg-blue-600 hover:bg-blue-700">{returnRecord.status.replace('_', ' ')}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start gap-3">
                                <RefreshCw className="h-5 w-5 text-blue-600 mt-1" />
                                <div>
                                    <p className="font-medium text-blue-900">Return Requested</p>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Return #{returnRecord.return_number} is currently <strong>{returnRecord.status.replace('_', ' ')}</strong>.
                                        We will notify you via email and SMS when the status changes.
                                    </p>
                                    <div className="mt-4 flex gap-2">
                                        {/* Link to dedicated tracking if we implement it, for now inline is clear enough */}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Order Status Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium flex justify-between items-center">
                            Order Status
                            <Badge variant={isCancelled ? 'destructive' : 'outline'}>{order.status}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isCancelled ? (
                            <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-md">
                                <AlertTriangle className="h-5 w-5" />
                                <div>
                                    <p className="font-medium">Order Cancelled</p>
                                    <p className="text-sm text-red-500">This order was cancelled on {new Date().toLocaleDateString()}.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative pl-4 border-l-2 border-gray-100 space-y-8 my-4">
                                {steps.map((step, idx) => {
                                    const isCompleted = idx <= currentStepIndex
                                    const Icon = step.icon
                                    return (
                                        <div key={step.key} className="relative flex items-center gap-4">
                                            <div className={`absolute -left-[21px] p-1 rounded-full border-2 ${isCompleted ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className={isCompleted ? 'opacity-100' : 'opacity-40'}>
                                                <p className="font-medium text-sm">{step.label}</p>
                                                {step.date && <p className="text-xs text-muted-foreground">{format(new Date(step.date), 'MMM dd, hh:mm a')}</p>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
                {/* ... existing content ... */}
            </div>
        </AccountLayout>
    )
}
