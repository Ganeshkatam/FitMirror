'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapPin, Truck, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DeliveryChecker() {
    const [pincode, setPincode] = React.useState('')
    const [deliveryInfo, setDeliveryInfo] = React.useState<{
        available: boolean
        date: string
        cod: boolean
    } | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState('')

    const checkDelivery = () => {
        if (pincode.length !== 6) {
            setError('Please enter a valid 6-digit pincode')
            return
        }

        setLoading(true)
        setError('')

        // Simulate API call
        setTimeout(() => {
            // Mock delivery calculation
            const deliveryDays = 3 + Math.floor(Math.random() * 4) // 3-6 days
            const deliveryDate = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000)

            setDeliveryInfo({
                available: true,
                date: deliveryDate.toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                }),
                cod: parseInt(pincode) % 2 === 0 // Mock: COD available for even pincodes
            })
            setLoading(false)
        }, 500)
    }

    return (
        <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>Check Delivery</span>
            </div>

            <div className="flex gap-2">
                <Input
                    type="text"
                    placeholder="Enter Pincode"
                    value={pincode}
                    onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setPincode(value)
                        setDeliveryInfo(null)
                        setError('')
                    }}
                    className="flex-1"
                    maxLength={6}
                />
                <Button
                    variant="outline"
                    onClick={checkDelivery}
                    disabled={loading || pincode.length !== 6}
                    className="text-primary font-medium"
                >
                    {loading ? 'Checking...' : 'Check'}
                </Button>
            </div>

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {deliveryInfo && (
                <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-start gap-3">
                        <Truck className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="text-sm">
                            <p className="text-green-700 font-medium">
                                Delivery by {deliveryInfo.date}
                            </p>
                            <p className="text-gray-500 text-xs">Free delivery on orders above ₹999</p>
                        </div>
                    </div>

                    {deliveryInfo.cod && (
                        <div className="flex items-center gap-3">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-600">Cash on Delivery available</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
