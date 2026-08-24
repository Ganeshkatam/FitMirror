'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Truck, CheckCircle, Clock, ChevronRight, MessageSquare } from 'lucide-react'
import { ReviewForm } from '@/components/reviews/review-form'

// Dummy Type for UI dev
export interface Order {
    id: string
    date: string
    status: 'processing' | 'shipped' | 'delivered' | 'cancelled'
    total: number
    items: {
        id: string
        name: string
        image: string
        price: number
        quantity: number
        size: string
        productId?: string
    }[]
    tracking_number?: string
    expected_delivery?: string
}

export function OrderCard({ order }: { order: Order }) {
    // Status Logic
    const steps = [
        { key: 'processing', label: 'Placed', icon: Package },
        { key: 'shipped', label: 'Shipped', icon: Truck },
        { key: 'delivered', label: 'Delivered', icon: CheckCircle },
    ]

    const currentStepIndex = steps.findIndex(s => s.key === order.status)
    const isCancelled = order.status === 'cancelled'

    return (
        <div className="bg-white border rounded-lg md:rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-300 group">
            {/* Header */}
            <div className="px-3 md:px-6 py-2.5 md:py-4 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <div className="flex flex-col gap-0.5 md:gap-1">
                    <div className="flex items-center gap-2 md:gap-3">
                        <span className="font-bold text-sm md:text-lg">#{order.id.slice(0, 8)}</span>
                        <Badge
                            variant="outline"
                            className={`uppercase text-[8px] md:text-[10px] tracking-widest font-bold px-1.5 md:px-2 py-0 md:py-0.5 ${order.status === 'delivered' ? 'border-green-500 text-green-600 bg-green-50' :
                                order.status === 'shipped' ? 'border-blue-500 text-blue-600 bg-blue-50' :
                                    order.status === 'processing' ? 'border-amber-500 text-amber-600 bg-amber-50' :
                                        'border-red-500 text-red-600 bg-red-50'
                                }`}
                        >
                            {order.status}
                        </Badge>
                    </div>
                    <span className="text-[10px] md:text-sm text-muted-foreground">{order.date}</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-3">
                    <Button variant="outline" size="sm" className="hidden md:flex h-8 text-xs">
                        View Invoice
                    </Button>
                    <Link href={`/account/orders/${order.id}`}>
                        <Button size="sm" className="bg-black hover:bg-gray-800 text-white shadow-none h-7 md:h-8 text-[10px] md:text-xs px-2 md:px-3">
                            Track Order
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className="p-3 md:p-6">
                <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
                    {/* Items List */}
                    <div className="flex-1 space-y-2 md:space-y-4">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex gap-2 md:gap-4 items-start">
                                <div className="relative h-14 w-11 md:h-20 md:w-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 border">
                                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-xs md:text-sm text-gray-900 line-clamp-1 md:line-clamp-2">{item.name}</h4>
                                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">Size: {item.size} • Qty: {item.quantity}</p>
                                    <p className="font-bold text-xs md:text-sm mt-0.5 md:mt-1">₹{item.price.toLocaleString('en-IN')}</p>

                                    {/* Action Buttons */}
                                    <div className="mt-2 flex gap-2">
                                        {item.productId && order.status === 'delivered' && (
                                            <ReviewForm
                                                productId={item.productId}
                                                productName={item.name}
                                                productImage={item.image}
                                                trigger={
                                                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 px-2">
                                                        <MessageSquare className="h-3 w-3" /> Write Review
                                                    </Button>
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Timeline & Info */}
                    <div className="lg:w-1/3 flex flex-col justify-between border-t lg:border-t-0 lg:border-l pt-3 md:pt-6 lg:pt-0 lg:pl-8">

                        {/* Status Timeline - Hidden on mobile */}
                        {!isCancelled && (
                            <div className="mb-3 md:mb-6 hidden md:block">
                                <h5 className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground mb-2 md:mb-4">Delivery Status</h5>
                                <div className="relative pl-2 space-y-4 md:space-y-6">
                                    {/* Vertical Line */}
                                    <div className="absolute left-[13px] md:left-[15px] top-2 bottom-2 w-0.5 bg-gray-100" />

                                    {steps.map((step, idx) => {
                                        const isCompleted = idx <= (currentStepIndex === -1 ? 0 : currentStepIndex)
                                        const isCurrent = idx === currentStepIndex
                                        const Icon = step.icon

                                        return (
                                            <div key={step.key} className="relative flex items-center gap-2 md:gap-4 z-10">
                                                <div
                                                    className={`h-5 w-5 md:h-7 md:w-7 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted ? 'bg-black border-black text-white' : 'bg-white border-gray-200 text-gray-300'
                                                        }`}
                                                >
                                                    <Icon className="h-2.5 w-2.5 md:h-3.5 md:w-3.5" />
                                                </div>
                                                <div>
                                                    <p className={`text-xs md:text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                                        {step.label}
                                                    </p>
                                                    {isCurrent && order.expected_delivery && (
                                                        <p className="text-[10px] md:text-xs text-amber-600 font-medium">
                                                            Exp: {order.expected_delivery}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-50 rounded-md md:rounded-lg p-2.5 md:p-4">
                            <div className="flex justify-between items-center mb-0.5 md:mb-1">
                                <span className="text-xs md:text-sm text-muted-foreground">Total</span>
                                <span className="font-bold text-sm md:text-lg">₹{order.total.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] md:text-xs text-muted-foreground">
                                <span>Payment</span>
                                <span className="font-medium text-gray-900">UPI</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
