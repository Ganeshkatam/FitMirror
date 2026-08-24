"use client"

import { useEffect, useState, createContext, useContext, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getUserPreferences, type UserPreferencesData } from '@/lib/utils/user-preferences'

const defaultPrefs: UserPreferencesData = {
    reduce_motion: false,
    image_quality: 'auto',
    default_view: undefined,
    persist_cart: true,
    confirm_cart_removal: false,
    auto_select_size: false,
    preferred_fit: null,
    hide_out_of_stock: false,
    auto_wishlist_oos: false,
    body_profile_mode: 'static_tryon',
    auto_apply_body_profile: false,
    remember_last_tryon: false,
    show_fit_confidence: true,
    retain_tryon_images: true,
    recently_viewed_days: 30,
    show_data_usage_hints: false,
    order_update_level: 'all',
    promo_offers: true,
    promo_new_arrivals: true,
    promo_style_tips: false
}

const PrefsContext = createContext<UserPreferencesData>(defaultPrefs)

export function useUserPreferences() {
    return useContext(PrefsContext)
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
    const [prefs, setPrefs] = useState<UserPreferencesData>(defaultPrefs)
    const [loaded, setLoaded] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const fetchPrefs = async () => {
            try {
                const supabase = createClient()
                const userPrefs = await getUserPreferences(supabase)

                if (userPrefs) {
                    setPrefs({ ...defaultPrefs, ...userPrefs })
                }
                setLoaded(true)
            } catch {
                // Silently fail - defaults will be used
                setLoaded(true)
            }
        }

        fetchPrefs()
    }, [])

    // default_view redirect: Only on homepage, only once per session
    useEffect(() => {
        if (!loaded) return
        if (pathname !== '/') return

        // Check if we've already redirected this session
        const hasRedirected = sessionStorage.getItem('default_view_redirected')
        if (hasRedirected) return

        if (prefs.default_view === 'tryon') {
            sessionStorage.setItem('default_view_redirected', 'true')
            router.push('/try-on')
        } else if (prefs.default_view === 'shop') {
            sessionStorage.setItem('default_view_redirected', 'true')
            router.push('/shop')
        }
    }, [loaded, prefs.default_view, pathname, router])

    // Apply reduce_motion class to document root
    useEffect(() => {
        if (prefs.reduce_motion) {
            document.documentElement.classList.add('reduce-motion')
        } else {
            document.documentElement.classList.remove('reduce-motion')
        }
    }, [prefs.reduce_motion])

    // Apply image_quality as data attribute for CSS/JS to use
    useEffect(() => {
        if (prefs.image_quality) {
            document.documentElement.dataset.imageQuality = prefs.image_quality
        }
    }, [prefs.image_quality])

    return (
        <PrefsContext.Provider value={prefs}>
            {children}
        </PrefsContext.Provider>
    )
}
