'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Plus, MapPin, Check, Loader2 } from 'lucide-react'
import { getAddresses } from '@/app/actions/addresses'
import { AddressForm } from '@/components/account/address-form'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CheckoutAddressProps {
    onSelect: (address: any) => void
    selectedId?: string
}

export function CheckoutAddress({ onSelect, selectedId }: CheckoutAddressProps) {
    const [addresses, setAddresses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [openNew, setOpenNew] = useState(false)

    const fetchAddresses = async () => {
        setLoading(true)
        try {
            const { data, error } = await getAddresses()
            if (error) {
                toast.error(error)
                return
            }

            setAddresses(data || [])

            // Auto-select default if none selected
            if (!selectedId && data && data.length > 0) {
                const defaultAddr = data.find((a: any) => a.is_default) || data[0]
                onSelect(defaultAddr)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to load addresses")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAddresses()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Shipping Address
                </CardTitle>
                <CardDescription>
                    Select where you want your order delivered.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
                        <p className="text-muted-foreground mb-4">No saved addresses found.</p>
                        <Button onClick={() => setOpenNew(true)} variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Address
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            {addresses.map((addr) => (
                                <div
                                    key={addr.id}
                                    className={cn(
                                        "relative cursor-pointer rounded-xl border p-4 transition-all hover:border-primary/50 hover:bg-primary/5",
                                        selectedId === addr.id
                                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                                            : "bg-card"
                                    )}
                                    onClick={() => onSelect(addr)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="font-semibold text-foreground flex items-center gap-2">
                                            {addr.full_name || addr.name}
                                            {addr.is_default && (
                                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        {selectedId === addr.id && (
                                            <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-sm">
                                                <Check className="h-3 w-3" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground leading-relaxed">
                                        <p>{addr.address_line1 || addr.line1}</p>
                                        {addr.address_line2 || addr.line2 && <p>{addr.address_line2 || addr.line2}</p>}
                                        <p>{addr.city}, {addr.state} {addr.postal_code || addr.zip}</p>
                                        <p className="mt-2 text-foreground/80 text-xs font-medium flex items-center gap-1">
                                            📞 {addr.phone}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => setOpenNew(true)}
                                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 transition-colors hover:bg-muted/50 text-muted-foreground hover:text-foreground h-full min-h-[160px]"
                            >
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <Plus className="h-5 w-5" />
                                </div>
                                <span className="font-medium text-sm">Add New Address</span>
                            </button>
                        </div>
                    </div>
                )}

                <AddressForm
                    open={openNew}
                    onOpenChange={setOpenNew}
                    onSuccess={() => {
                        fetchAddresses()
                        toast.success("Address added")
                    }}
                />
            </CardContent>
        </Card>
    )
}
