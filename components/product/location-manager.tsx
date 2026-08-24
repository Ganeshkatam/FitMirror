'use client'

import React from 'react'
import { MapPin, Truck, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface LocationManagerProps {
    onLocationChange: (pincode: string) => void
}

interface Address {
    id: string
    full_name: string
    address_line_1: string
    city: string
    state: string
    postal_code: string
    is_default: boolean
    type: string
}

export function LocationManager({ onLocationChange }: LocationManagerProps) {
    const supabase = createClient()
    const [pincode, setPincode] = React.useState('')
    const [savedAddresses, setSavedAddresses] = React.useState<Address[]>([])
    const [isOpen, setIsOpen] = React.useState(false)
    const [deliveryDate, setDeliveryDate] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [user, setUser] = React.useState<any>(null)

    // Check auth status
    React.useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        checkUser()
    }, [supabase])

    // Load saved addresses when dialog opens
    React.useEffect(() => {
        if (isOpen && user) {
            const fetchAddresses = async () => {
                setLoading(true)
                const { data } = await supabase
                    .from('addresses')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('is_default', { ascending: false })

                if (data) setSavedAddresses(data)
                setLoading(false)
            }
            fetchAddresses()
        }
    }, [isOpen, user, supabase])

    const checkDelivery = (code: string) => {
        if (code.length !== 6 || /\D/.test(code)) {
            toast.error("Invalid pincode")
            return
        }

        // Mock calculation
        // In real app, call API with seller_pincode vs dest_pincode
        const days = Math.floor(Math.random() * 4) + 2
        const date = new Date()
        date.setDate(date.getDate() + days)

        setDeliveryDate(date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }))
        onLocationChange(code)
    }

    const handleUseAddress = (addr: Address) => {
        setPincode(addr.postal_code)
        checkDelivery(addr.postal_code)
        setIsOpen(false)
    }

    return (
        <div className="border rounded-xl p-4 space-y-3 bg-gray-50/50">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm flex items-center gap-2 text-gray-900">
                    <Truck className="h-4 w-4" /> Delivery Options
                </h4>
                {deliveryDate && (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                        {deliveryDate}
                    </span>
                )}
            </div>

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        value={pincode}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                            setPincode(val)
                            if (val.length === 6) checkDelivery(val)
                            else setDeliveryDate(null)
                        }}
                        placeholder="Enter Pincode"
                        className="pl-9 bg-white border-gray-200"
                    />
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="px-3" disabled={!user}>
                            Saved
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Select Delivery Location</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {!user ? (
                                <div className="text-center py-4 text-gray-500">
                                    Please login to view saved addresses
                                </div>
                            ) : loading ? (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin h-6 w-6 border-2 border-black border-t-transparent rounded-full" />
                                </div>
                            ) : savedAddresses.length === 0 ? (
                                <div className="text-center py-6 text-gray-500 border-2 border-dashed rounded-xl">
                                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No saved addresses found</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    {savedAddresses.map(addr => (
                                        <button
                                            key={addr.id}
                                            onClick={() => handleUseAddress(addr)}
                                            className={cn(
                                                "w-full text-left p-3 rounded-lg border hover:border-black transition-all group relative",
                                                pincode === addr.postal_code ? "border-black bg-gray-50" : "border-gray-100"
                                            )}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="font-bold text-sm flex items-center gap-2">
                                                        {addr.type === 'home' ? '🏠 Home' : '🏢 Work'}
                                                        {addr.is_default && <span className="text-[10px] bg-gray-200 px-1.5 rounded">Default</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1 line-clamp-1">
                                                        {addr.address_line_1}, {addr.city}
                                                    </div>
                                                    <div className="text-xs font-mono font-medium mt-1">
                                                        {addr.postal_code}
                                                    </div>
                                                </div>
                                                {pincode === addr.postal_code && (
                                                    <Check className="h-4 w-4 text-green-600" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <Button className="w-full gap-2" variant="outline">
                                <Plus className="h-4 w-4" /> Add New Address
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {!deliveryDate && (
                <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Enter pincode to check delivery availability
                </div>
            )}
        </div>
    )
}
