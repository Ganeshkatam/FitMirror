'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function OrderSuccessContent() {
    const searchParams = useSearchParams()
    const orderIds = searchParams.get('orders')?.split(',') || []

    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4 bg-stone-50">
            <Card className="max-w-md w-full text-center shadow-xl">
                <CardContent className="pt-10 pb-10 space-y-6">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={40} />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900">Order Placed Successfully!</h1>
                        <p className="text-slate-500">
                            Thank you for your purchase. We have received your order(s).
                        </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border text-left space-y-2">
                        <p className="text-sm font-medium text-slate-700">Order IDs:</p>
                        <div className="flex flex-col gap-1">
                            {orderIds.map(id => (
                                <span key={id} className="text-xs font-mono bg-white border px-2 py-1 rounded">
                                    #{id.slice(0, 8)}...
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-3">
                        <Button asChild className="w-full">
                            <Link href="/account/orders">View My Orders</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/shop">Continue Shopping</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function OrderConfirmationPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OrderSuccessContent />
        </Suspense>
    )
}
