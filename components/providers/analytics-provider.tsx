'use client'

import { usePageTracking } from '@/lib/hooks/use-page-tracking'

/**
 * Analytics provider component that tracks page views across the site
 * Place this in the root layout to enable automatic page view tracking
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    usePageTracking()
    return <>{children}</>
}
