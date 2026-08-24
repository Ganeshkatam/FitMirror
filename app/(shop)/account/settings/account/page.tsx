import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AccountForm } from './account-form'

export default async function AccountSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    return (
        <div className="container max-w-2xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">

                <div>
                    <h1 className="text-2xl font-serif font-bold">Account Information</h1>
                    <p className="text-muted-foreground">Update your personal details</p>
                </div>
            </div>

            <AccountForm user={user} profile={profile} />
        </div>
    )
}
