'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ProductImage } from '@/lib/service/media'
import { Trash2, Plus, Upload, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/ui/image-upload'
import { createReturnRequest } from '@/lib/actions/returns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface OrderItem {
    id: string
    quantity: number
    price: number
    size: string
    product: {
        id: string
        name: string
        images?: ProductImage[]
    }
}

interface Order {
    id: string
    order_number: string
    items: OrderItem[]
    shipping_address: any
}

const RETURN_REASONS = [
    "Size Too Small",
    "Size Too Large",
    "Quality Issues",
    "Defect/Damaged",
    "Wrong Item Sent",
    "Item Different from Description",
    "Parts Missing",
    "Arrived Late",
    "Other"
]

const FREE_RETURN_REASONS = [
    "Quality Issues",
    "Defect/Damaged",
    "Wrong Item Sent",
    "Item Different from Description",
    "Parts Missing",
    "Arrived Late"
]

const RETURN_CONDITIONS = [
    "Unopened",
    "Opened - Unused",
    "Opened - Tried On",
    "Damaged"
]

export function ReturnRequestForm({ order }: { order: Order }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
    const [itemData, setItemData] = useState<Record<string, {
        quantity: number,
        reason: string,
        condition: string,
        comment: string,
        images?: string[]
    }>>({})
    const [returnType, setReturnType] = useState<'return' | 'exchange'>('return')
    const [refundMethod, setRefundMethod] = useState<'wallet' | 'original'>('wallet')

    const toggleItem = (itemId: string) => {
        const newSelected = new Set(selectedItems)
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId)
            const newData = { ...itemData }
            delete newData[itemId]
            setItemData(newData)
        } else {
            newSelected.add(itemId)
            // Initialize default data
            setItemData(prev => ({
                ...prev,
                [itemId]: {
                    quantity: 1,
                    reason: '',
                    condition: RETURN_CONDITIONS[0],
                    comment: '',
                    images: []
                }
            }))
        }
        setSelectedItems(newSelected)
    }

    const updateItem = (itemId: string, field: string, value: any) => {
        setItemData(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [field]: value
            }
        }))
    }

    // Calculations
    const selectedItemsList = order.items.filter(item => selectedItems.has(item.id))
    const subtotal = selectedItemsList.reduce((acc, item) => {
        const qty = itemData[item.id]?.quantity || 1
        return acc + (item.price * qty)
    }, 0)

    // Calculate Return Fee
    // If ANY item has a non-free reason, fee applies? Or per item?
    // Usually per order if standard return.
    // Let's say flat fee 100rs if ANY item is "Customer Remorse" (Size/Other)
    // UNLESS all items are Defect/Wrong.
    const isFreeReturn = selectedItemsList.every(item =>
        FREE_RETURN_REASONS.includes(itemData[item.id]?.reason)
    )

    const returnFee = (selectedItems.size > 0 && !isFreeReturn) ? 100 : 0
    const refundAmount = Math.max(0, subtotal - returnFee)

    const handleSubmit = async () => {
        try {
            setLoading(true)

            // Validation
            if (selectedItems.size === 0) {
                toast.error("Please select at least one item to return")
                return
            }

            const itemsPayload = []
            for (const itemId of Array.from(selectedItems)) {
                const data = itemData[itemId]
                if (!data.reason) {
                    toast.error(`Please select a reason for all selected items`)
                    return
                }
                if (data.reason === 'Other' && !data.comment) {
                    toast.error(`Please add comments for 'Other' reason`)
                    return
                }
                if ((data.reason.includes('Defect') || data.reason.includes('Wrong')) && (!data.images || data.images.length === 0)) {
                    // Optional but recommended, maybe strict warning?
                    // User plan said: "Evidence: Photo upload required for specific reasons"
                    toast.error(`Please upload photos for damaged/wrong items`)
                    return
                }

                itemsPayload.push({
                    order_item_id: itemId,
                    quantity: data.quantity,
                    reason: data.reason,
                    condition: data.condition,
                    comment: data.comment || '',
                    images: data.images ? [...data.images] : []
                })
            }

            // Ensure payload is strictly plain JSON (removes any hidden prototypes or read-only props)
            const payload = JSON.parse(JSON.stringify({
                order_id: order.id,
                items: itemsPayload,
                type: returnType,
                refund_method: refundMethod,
                pickup_address: order.shipping_address || {}
            }))

            await createReturnRequest(payload)

            toast.success("Return request submitted successfully")
            // Redirect handled in server action
        } catch (error: any) {
            toast.error(error.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Select Items to Return</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {order.items.map(item => (
                        <div key={item.id} className={cn("flex flex-col gap-4 p-4 border rounded-lg transition-colors", selectedItems.has(item.id) ? "border-primary bg-primary/5" : "border-gray-200")}>
                            <div className="flex items-start gap-4">
                                <Checkbox
                                    checked={selectedItems.has(item.id)}
                                    onCheckedChange={() => toggleItem(item.id)}
                                    id={`item-${item.id}`}
                                />
                                <div className="relative h-16 w-12 bg-gray-100 rounded border flex-shrink-0">
                                    {item.product.images?.[0]?.src && (
                                        <Image src={item.product.images?.[0]?.src} alt={item.product.name} fill className="object-cover" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label htmlFor={`item-${item.id}`} className="font-medium cursor-pointer hover:underline">
                                        {item.product.name}
                                    </label>
                                    <p className="text-sm text-muted-foreground">Size: {item.size} • Price: ₹{item.price}</p>
                                </div>
                            </div>

                            {selectedItems.has(item.id) && (
                                <div className="pl-8 grid gap-4 grid-cols-1 md:grid-cols-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Quantity</Label>
                                                <Select
                                                    value={itemData[item.id]?.quantity.toString()}
                                                    onValueChange={(val) => updateItem(item.id, 'quantity', parseInt(val))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from({ length: item.quantity }, (_, i) => i + 1).map(num => (
                                                            <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Condition</Label>
                                                <Select
                                                    value={itemData[item.id]?.condition}
                                                    onValueChange={(val) => updateItem(item.id, 'condition', val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {RETURN_CONDITIONS.map(c => (
                                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Reason <span className="text-red-500">*</span></Label>
                                            <Select
                                                value={itemData[item.id]?.reason}
                                                onValueChange={(val) => updateItem(item.id, 'reason', val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select reason" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {RETURN_REASONS.map(r => (
                                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {itemData[item.id]?.reason === 'Other' && (
                                            <div className="space-y-2">
                                                <Label>Comments <span className="text-red-500">*</span></Label>
                                                <Textarea
                                                    placeholder="Please describe why you are returning this item..."
                                                    value={itemData[item.id]?.comment}
                                                    onChange={(e) => updateItem(item.id, 'comment', e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Photos (Optional)</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {itemData[item.id]?.images?.map((img, idx) => (
                                                <div key={idx} className="relative w-20 h-20 rounded border overflow-hidden group">
                                                    <Image src={img} alt="evidence" fill className="object-cover" />
                                                    <button
                                                        onClick={() => {
                                                            const newImages = itemData[item.id]?.images?.filter((_, i) => i !== idx) || []
                                                            updateItem(item.id, 'images', newImages)
                                                        }}
                                                        className="absolute top-0 right-0 bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="w-20 h-20">
                                                <ImageUpload
                                                    value={null}
                                                    onChange={(url) => {
                                                        if (url) {
                                                            const current = itemData[item.id]?.images || []
                                                            updateItem(item.id, 'images', [...current, url])
                                                        }
                                                    }}
                                                    folder="returns"
                                                    className="w-full h-full"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Upload up to 3 photos if item is damaged or wrong.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Refund Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Resolution</Label>
                            <div className="flex gap-4">
                                <Button
                                    variant={returnType === 'return' ? 'default' : 'outline'}
                                    onClick={() => setReturnType('return')}
                                    className="flex-1"
                                >
                                    Refund
                                </Button>
                                <Button
                                    variant={returnType === 'exchange' ? 'default' : 'outline'}
                                    onClick={() => setReturnType('exchange')}
                                    className="flex-1"
                                    disabled={true} // Disable exchange for now as per minimal viable
                                >
                                    Exchange (Coming Soon)
                                </Button>
                            </div>
                        </div>

                        {returnType === 'return' && (
                            <div className="space-y-2">
                                <Label>Refund Method</Label>
                                <Select
                                    value={refundMethod}
                                    onValueChange={(val: any) => setRefundMethod(val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="wallet">Store Wallet (Instant)</SelectItem>
                                        <SelectItem value="original">Original Payment Method (5-7 days)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="p-4 bg-gray-50 rounded-md space-y-2 mt-4">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>₹{subtotal}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Return Fee</span>
                                <span className={returnFee > 0 ? "text-red-500" : ""}>
                                    {returnFee > 0 ? `-₹${returnFee}` : 'Free'}
                                </span>
                            </div>
                            {returnFee > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Return fee applies for non-defect reasons.
                                </p>
                            )}
                            <div className="border-t pt-2 flex justify-between font-bold">
                                <span>Refund Amount</span>
                                <span>₹{refundAmount}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Pickup Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">
                            <p className="font-bold">{order.shipping_address?.fullName}</p>
                            <p>{order.shipping_address?.addressLine1}</p>
                            <p>{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                            <p>{order.shipping_address?.pincode}</p>
                            <p className="mt-2">Phone: {order.shipping_address?.mobile}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                            Pickup will be scheduled at this address. You will receive an SMS with the pickup slot.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" size="lg" onClick={handleSubmit} disabled={loading || selectedItems.size === 0}>
                            {loading ? "Submitting..." : "Submit Return Request"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
