'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

export function SignOutButton({ className }: { className?: string }) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = React.useState(false)

    async function handleSignOut() {
        setLoading(true)
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    return (
        <Button variant="outline" size="sm" onClick={handleSignOut} disabled={loading} className={cn(className)}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4 mr-1" />}
            Sign Out
        </Button>
    )
}
