import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'
import Link from 'next/link'
import { getAddresses } from '@/app/actions/addresses'
import { AddressList } from '@/components/account/address-list'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AddressesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: addresses, error } = await getAddresses()

    return (
        <div className="container max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">

                <div>
                    <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-indigo-600" />
                        Your Addresses
                    </h1>
                    <p className="text-muted-foreground">Manage your delivery locations</p>
                </div>
            </div>

            <AddressList addresses={addresses || []} />
        </div>
    )
}
