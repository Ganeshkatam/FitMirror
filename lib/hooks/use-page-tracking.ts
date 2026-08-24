'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook to track page views for analytics
 * Automatically tracks page views with device type and traffic source
 */
export function usePageTracking() {
    const pathname = usePathname()
    const lastPathRef = useRef<string | null>(null)
    const sessionIdRef = useRef<string | null>(null)

    useEffect(() => {
        // Generate or retrieve session ID
        if (!sessionIdRef.current) {
            sessionIdRef.current = sessionStorage.getItem('analytics_session') ||
                `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
            sessionStorage.setItem('analytics_session', sessionIdRef.current)
        }

        // Don't track if same path (avoid duplicates on re-renders)
        if (pathname === lastPathRef.current) return
        lastPathRef.current = pathname

        // Skip admin routes (don't pollute analytics with admin views)
        if (pathname.startsWith('/platform-admin') || pathname.startsWith('/chairman')) return

        trackPageView(pathname, sessionIdRef.current)
    }, [pathname])
}

async function trackPageView(pagePath: string, sessionId: string) {
    try {
        const supabase = createClient()

        // Get current user (if logged in)
        const { data: { user } } = await supabase.auth.getUser()

        // Detect device type
        const deviceType = getDeviceType()

        // Get traffic source from referrer
        const trafficSource = getTrafficSource()

        await supabase.from('page_views').insert({
            page_path: pagePath,
            user_id: user?.id || null,
            session_id: sessionId,
            device_type: deviceType,
            traffic_source: trafficSource,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent
        })
    } catch (error) {
        // Silent fail - analytics shouldn't break the app
        console.debug('Page view tracking failed:', error)
    }
}

function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const ua = navigator.userAgent.toLowerCase()

    if (/tablet|ipad|playbook|silk/i.test(ua)) {
        return 'tablet'
    }

    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
        return 'mobile'
    }

    return 'desktop'
}

function getTrafficSource(): string {
    const referrer = document.referrer

    if (!referrer) return 'direct'

    const referrerUrl = new URL(referrer)
    const hostname = referrerUrl.hostname.toLowerCase()

    // Social media
    if (hostname.includes('facebook') || hostname.includes('fb.')) return 'Facebook'
    if (hostname.includes('instagram')) return 'Instagram'
    if (hostname.includes('twitter') || hostname.includes('x.com')) return 'Twitter/X'
    if (hostname.includes('linkedin')) return 'LinkedIn'
    if (hostname.includes('pinterest')) return 'Pinterest'
    if (hostname.includes('tiktok')) return 'TikTok'
    if (hostname.includes('youtube')) return 'YouTube'

    // Search engines
    if (hostname.includes('google')) return 'Google'
    if (hostname.includes('bing')) return 'Bing'
    if (hostname.includes('duckduckgo')) return 'DuckDuckGo'
    if (hostname.includes('yahoo')) return 'Yahoo'

    // Check if same domain (internal navigation)
    if (hostname === window.location.hostname) return 'internal'

    return 'referral'
}

/**
 * Manual event tracking for specific actions
 */
export async function trackEvent(eventType: string, eventData: Record<string, any> = {}) {
    try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Could be extended to an events table for more detailed tracking
        console.debug('Event tracked:', eventType, eventData, user?.id)
    } catch (error) {
        console.debug('Event tracking failed:', error)
    }
}
