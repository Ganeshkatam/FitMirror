'use client'

import dynamic from 'next/dynamic'
import { NotificationSkeleton } from '@/components/skeletons/notification-skeleton'

const NotificationCenter = dynamic(
    () => import('@/components/notification-center').then((mod) => mod.NotificationCenter),
    {
        ssr: false,
        loading: () => <NotificationSkeleton />
    }
)

export function ClientNotificationCenter() {
    return <NotificationCenter />
}
