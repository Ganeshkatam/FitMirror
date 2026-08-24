'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addAddress, updateAddress } from '@/app/actions/addresses'
import { Loader2, LocateFixed } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface AddressFormProps {
    address?: any
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess?: () => void
}

export function AddressForm({ address, open, onOpenChange, onSuccess }: AddressFormProps) {
    const [loading, setLoading] = useState(false)
    const [locating, setLocating] = useState(false)

    // Refs for direct manipulation to support "Use Location" without full re-render
    const line1Ref = useState<HTMLInputElement | null>(null)
    const cityRef = useState<HTMLInputElement | null>(null)
    const stateRef = useState<HTMLInputElement | null>(null)
    const postalCodeRef = useState<HTMLInputElement | null>(null)

    // Helper to set ref (since useState returns [val, setVal], and we need a callback ref or object)
    // Actually, simpler to just use ID selectors or valid React refs if we change structure.
    // Let's stick to IDs which are already present and unique in this dialog scope (mostly).
    // Better: use real refs.

    const refs = {
        line1: (node: HTMLInputElement) => { if (node) (window as any).line1Input = node },
        city: (node: HTMLInputElement) => { if (node) (window as any).cityInput = node },
        state: (node: HTMLInputElement) => { if (node) (window as any).stateInput = node },
        postalCode: (node: HTMLInputElement) => { if (node) (window as any).postalCodeInput = node },
    }

    async function handleUseLocation() {
        setLocating(true)
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser')
            setLocating(false)
            return
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
                    headers: { 'User-Agent': 'FitMirror-App' }
                })
                const data = await response.json()

                if (data && data.address) {
                    const addr = data.address
                    // Update inputs directly
                    const setVal = (id: string, val: string) => {
                        const el = document.getElementById(id) as HTMLInputElement
                        if (el && val) el.value = val
                    }

                    setVal('address_line1', `${addr.road || ''} ${addr.house_number || ''}`.trim())
                    setVal('city', addr.city || addr.town || addr.village || addr.suburb || '')
                    setVal('state', addr.state || '')
                    setVal('postal_code', addr.postcode || '')

                    toast.success('Location detected!')
                }
            } catch (error) {
                console.error('Geocoding error:', error)
                toast.error('Failed to fetch address details')
            } finally {
                setLocating(false)
            }
        }, (error) => {
            console.error('Geolocation error:', error)
            toast.error('Unable to retrieve your location')
            setLocating(false)
        })
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            const data = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                address_line1: formData.get('address_line1'),
                address_line2: formData.get('address_line2'),
                city: formData.get('city'),
                state: formData.get('state'),
                postal_code: formData.get('postal_code'),
                country: 'India',
            }

            let result
            if (address?.id) {
                result = await updateAddress(address.id, data)
            } else {
                result = await addAddress(data)
            }

            if (result.error) {
                toast.error('Error saving address', { description: result.error })
            } else {
                toast.success('Address saved successfully')
                onOpenChange?.(false)
                onSuccess?.()
            }
        } catch (e) {
            toast.error('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-8">
                        <div>
                            <DialogTitle>{address ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                            <DialogDescription>
                                Enter your delivery details below.
                            </DialogDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            onClick={handleUseLocation}
                            disabled={locating}
                        >
                            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                            {locating ? 'Detecting...' : 'Use My Location'}
                        </Button>
                    </div>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" defaultValue={address?.full_name} required placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" name="phone" defaultValue={address?.phone} required placeholder="+91 9876543210" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address_line1">Address Line 1</Label>
                        <Input id="address_line1" name="address_line1" defaultValue={address?.line1} required placeholder="House No, Building, Street" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address_line2">Address Line 2 <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                        <Input id="address_line2" name="address_line2" defaultValue={address?.line2} placeholder="Landmark, Area, Colony" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input id="city" name="city" defaultValue={address?.city} required placeholder="Mumbai" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="postal_code">Pincode</Label>
                            <Input id="postal_code" name="postal_code" defaultValue={address?.postal_code} required placeholder="400001" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" name="state" defaultValue={address?.state} required placeholder="Maharashtra" />
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {address ? 'Update Address' : 'Save Address'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
