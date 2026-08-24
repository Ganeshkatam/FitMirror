import { getOrder } from '@/lib/actions/orders'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { PrintButton } from '@/components/ui/print-button'

interface PageProps {
    params: { id: string }
}

export default async function InvoicePage({ params }: PageProps) {
    const order = await getOrder(params.id)

    if (!order) {
        notFound()
    }

    const subtotal = order.total_amount - (order.shipping_cost || 0) + (order.discount_amount || 0) - (order.tax_amount || 0)

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 print:hidden">
                <PrintButton />
            </div>

            <div className="border p-8" id="invoice-content">
                {/* Brand & Invoice Info */}
                <div className="flex justify-between border-b pb-8 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">FitMirror</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            123 Fashion Street, Tech Park<br />
                            Bangalore, KA 560001<br />
                            GSTIN: 29AAAAA0000A1Z5
                        </p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-gray-900">TAX INVOICE</h2>
                        <div className="mt-4 text-sm">
                            <p><span className="font-semibold">Invoice #:</span> INV-{order.order_number}</p>
                            <p><span className="font-semibold">Date:</span> {format(new Date(order.created_at), 'dd MMM yyyy')}</p>
                            <p><span className="font-semibold">Order #:</span> {order.order_number}</p>
                        </div>
                    </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
                        <div className="text-sm text-gray-600">
                            <p className="font-medium text-gray-900">{order.shipping_address?.fullName}</p>
                            <p>{order.shipping_address?.addressLine1}</p>
                            <p>{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                            <p>{order.shipping_address?.pincode}</p>
                            <p>Ph: {order.shipping_address?.mobile}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Ship To:</h3>
                        <div className="text-sm text-gray-600">
                            <p className="font-medium text-gray-900">{order.shipping_address?.fullName}</p>
                            <p>{order.shipping_address?.addressLine1}</p>
                            <p>{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                            <p>{order.shipping_address?.pincode}</p>
                            <p>Ph: {order.shipping_address?.mobile}</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8 text-sm">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 font-semibold text-gray-900">Item</th>
                            <th className="text-center py-3 font-semibold text-gray-900">Qty</th>
                            <th className="text-right py-3 font-semibold text-gray-900">Price</th>
                            <th className="text-right py-3 font-semibold text-gray-900">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {order.items.map((item: any) => (
                            <tr key={item.id}>
                                <td className="py-4">
                                    <p className="font-medium text-gray-900">{item.product.name}</p>
                                    <p className="text-gray-500 text-xs">Size: {item.size}</p>
                                </td>
                                <td className="text-center py-4">{item.quantity}</td>
                                <td className="text-right py-4">₹{item.price.toLocaleString('en-IN')}</td>
                                <td className="text-right py-4">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-64 space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Shipping</span>
                            <span className="font-medium">₹{(order.shipping_cost || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tax (IGST/CGST) 18%</span>
                            <span className="font-medium">₹{(order.tax_amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t font-bold text-lg">
                            <span>Total</span>
                            <span>₹{order.total_amount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t mt-16 pt-8 text-center text-xs text-gray-500">
                    <p>Thank you for shopping with FitMirror!</p>
                    <p className="mt-1">For support, email support@fitmirror.in or call +91-9876543210</p>
                </div>
            </div>

            <style>{`
                @media print {
                    .print\\:hidden { display: none; }
                    body { background: white; }
                    .min-h-screen { min-h-0; }
                }
            `}</style>

            <script dangerouslySetInnerHTML={{
                __html: `
                    document.querySelector('button')?.addEventListener('click', () => window.print());
                `
            }} />
        </div>
    )
}
