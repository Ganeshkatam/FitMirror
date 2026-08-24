'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Plus, MapPin, Pencil, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { AddressForm } from './address-form'
import { deleteAddress } from '@/app/actions/addresses'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export function AddressList({ addresses }: { addresses: any[] }) {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editingAddress, setEditingAddress] = useState<any>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleDelete() {
        if (!deletingId) return
        setIsDeleting(true)
        const result = await deleteAddress(deletingId)
        setIsDeleting(false)
        setDeletingId(null)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Address deleted')
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Add New Address Card */}
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group h-full min-h-[200px]"
                >
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus className="h-6 w-6 text-indigo-600" />
                    </div>
                    <span className="font-semibold text-gray-900">Add New Address</span>
                </button>

                {/* Address Cards */}
                {addresses.map((address) => (
                    <Card key={address.id} className={cn(
                        "relative flex flex-col transition-all hover:shadow-md border-gray-200"
                    )}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                {address.full_name}
                            </CardTitle>
                            <CardDescription className="text-xs truncate">
                                {address.phone}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 text-sm text-gray-600 space-y-1">
                            <p>{address.line1}</p>
                            {address.line2 && <p>{address.line2}</p>}
                            <p>{address.city}, {address.state} - {address.postal_code}</p>
                            <p>{address.country}</p>
                        </CardContent>
                        <CardFooter className="pt-2 border-t flex gap-2 justify-end bg-gray-50/50">
                            <Button variant="ghost" size="sm" onClick={() => setEditingAddress(address)}>
                                <Pencil className="h-3 w-3 mr-1" /> Edit
                            </Button>

                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeletingId(address.id)}>
                                <Trash2 className="h-3 w-3 mr-1" /> Delete
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <AddressForm
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
            />

            {editingAddress && (
                <AddressForm
                    address={editingAddress}
                    open={!!editingAddress}
                    onOpenChange={(open) => !open && setEditingAddress(null)}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Address?
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this address? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete Address'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
