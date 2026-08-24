'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface RealtimeListenerProps {
    table: string
    filter?: string
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
    schema?: string
}

export function RealtimeListener({ table, filter, event = '*', schema = 'public' }: RealtimeListenerProps) {
    const router = useRouter()
    const [supabase] = useState(() => createClient())

    useEffect(() => {
        // console.log(`🔌 Subscribing to ${table} (${filter || 'no-filter'})`)

        const channel = supabase
            .channel(`realtime-${table}-${filter || 'all'}`)
            .on('postgres_changes', {
                event,
                schema,
                table,
                filter,
            }, (payload) => {
                // console.log(`⚡ Realtime update from ${table}:`, payload)
                router.refresh()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, router, table, filter, event, schema])

    return null
}
