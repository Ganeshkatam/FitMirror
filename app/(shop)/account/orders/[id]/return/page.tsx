import { getOrder } from '@/lib/actions/orders'
import { notFound, redirect } from 'next/navigation'
import { AccountLayout } from '@/components/account/account-layout'
import { ReturnRequestForm } from '@/components/account/return-request-form'
import { AlertTriangle } from 'lucide-react'

interface PageProps {
    params: { id: string }
}

export default async function ReturnRequestPage({ params }: PageProps) {
    const order = await getOrder(params.id)

    if (!order) {
        notFound()
    }

    // Server-side validation of return window
    const deliveryDate = order.delivered_at ? new Date(order.delivered_at) : null
    if (!deliveryDate) {
        return (
            <AccountLayout title="Return Request" description={`Order #${order.order_number}`}>
                <div className="p-8 text-center border rounded-lg bg-yellow-50">
                    <AlertTriangle className="h-10 w-10 text-yellow-600 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-yellow-800">Return Unavailable</h2>
                    <p className="text-yellow-700 mt-2">This order has not been marked as delivered yet.</p>
                </div>
            </AccountLayout>
        )
    }

    const timeSinceDelivery = Math.abs(new Date().getTime() - deliveryDate.getTime())
    const daysSinceDelivery = Math.ceil(timeSinceDelivery / (1000 * 60 * 60 * 24))

    if (daysSinceDelivery > 7) {
        return (
            <AccountLayout title="Return Request" description={`Order #${order.order_number}`}>
                <div className="p-8 text-center border rounded-lg bg-red-50">
                    <AlertTriangle className="h-10 w-10 text-red-600 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-red-800">Return Window Closed</h2>
                    <p className="text-red-700 mt-2">
                        The 7-day return window for this order expired on {new Date(deliveryDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}.
                    </p>
                </div>
            </AccountLayout>
        )
    }

    return (
        <AccountLayout title="Return Items" description={`Select items from Order #${order.order_number}`}>
            <ReturnRequestForm order={order} />
        </AccountLayout>
    )
}
