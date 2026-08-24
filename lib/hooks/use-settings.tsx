'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// ============================================
// Types
// ============================================
export interface PlatformSettings {
    [category: string]: {
        [key: string]: any
    }
}

interface SettingsContextType {
    settings: PlatformSettings
    loading: boolean
    getSetting: <T = any>(category: string, key: string, defaultValue?: T) => T
    updateSetting: (category: string, key: string, value: any) => Promise<boolean>
    toggleSetting: (category: string, key: string) => Promise<boolean>
    refreshSettings: () => Promise<void>
}

// ============================================
// Context
// ============================================
const SettingsContext = createContext<SettingsContextType | null>(null)

export function useSettings() {
    const context = useContext(SettingsContext)
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider')
    }
    return context
}

// ============================================
// Provider
// ============================================
export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<PlatformSettings>({})
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    // Load initial settings
    const loadSettings = useCallback(async () => {
        try {
            const { data: settingsData } = await supabase
                .from('platform_settings')
                .select('category, key, value')
                .eq('is_active', true)

            if (settingsData) {
                const grouped: PlatformSettings = {}
                settingsData.forEach(item => {
                    if (!grouped[item.category]) grouped[item.category] = {}
                    grouped[item.category][item.key] = item.value
                })
                setSettings(grouped)
            }
        } catch (error) {
            console.error('Failed to load settings:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    // Set up real-time subscription
    useEffect(() => {
        loadSettings()

        const channel = supabase
            .channel('platform-settings')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'platform_settings' },
                (payload) => {
                    if (payload.eventType === 'UPDATE' && payload.new) {
                        const { category, key, value } = payload.new as any
                        setSettings(prev => ({
                            ...prev,
                            [category]: {
                                ...prev[category],
                                [key]: value
                            }
                        }))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadSettings, supabase])

    // Get a specific setting value
    const getSetting = useCallback(<T = any>(category: string, key: string, defaultValue?: T): T => {
        return settings[category]?.[key] ?? defaultValue as T
    }, [settings])

    // Update a setting value
    const updateSetting = useCallback(async (category: string, key: string, value: any): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('platform_settings')
                .upsert({
                    category,
                    key,
                    value,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'category,key' })

            if (error) throw error

            setSettings(prev => ({
                ...prev,
                [category]: {
                    ...prev[category],
                    [key]: value
                }
            }))

            toast.success(`Setting updated`)
            return true
        } catch (error: any) {
            toast.error(`Failed to update: ${error.message}`)
            return false
        }
    }, [supabase])

    // Toggle boolean setting
    const toggleSetting = useCallback(async (category: string, key: string): Promise<boolean> => {
        const currentValue = settings[category]?.[key]
        const newValue = !currentValue

        try {
            const { error } = await supabase
                .from('platform_settings')
                .upsert({
                    category,
                    key,
                    value: newValue,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'category,key' })

            if (error) throw error

            setSettings(prev => ({
                ...prev,
                [category]: {
                    ...prev[category],
                    [key]: newValue
                }
            }))

            toast.success(`${key} ${newValue ? 'enabled' : 'disabled'}`)
            return newValue
        } catch (error: any) {
            toast.error(`Failed to toggle: ${error.message}`)
            return false
        }
    }, [settings, supabase])

    return (
        <SettingsContext.Provider value={{
            settings,
            loading,
            getSetting,
            updateSetting,
            toggleSetting,
            refreshSettings: loadSettings,
        }}>
            {children}
        </SettingsContext.Provider>
    )
}

// ============================================
// Feature Flag Hook
// ============================================
export function useFeatureFlag(flagName: string): boolean {
    const [enabled, setEnabled] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        async function checkFlag() {
            const { data } = await supabase
                .from('feature_flags')
                .select('is_enabled, rollout_percentage')
                .eq('name', flagName)
                .single()

            if (data) {
                const random = Math.random() * 100
                setEnabled(data.is_enabled && random <= data.rollout_percentage)
            }
        }
        checkFlag()

        const channel = supabase
            .channel(`flag-${flagName}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'feature_flags', filter: `name=eq.${flagName}` },
                (payload) => {
                    if (payload.new) {
                        const { is_enabled, rollout_percentage } = payload.new as any
                        const random = Math.random() * 100
                        setEnabled(is_enabled && random <= rollout_percentage)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [flagName, supabase])

    return enabled
}

// ============================================
// CMS Content Hook
// ============================================
export function useCMSContent<T = any>(slug: string): { content: T | null; loading: boolean } {
    const [content, setContent] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function loadContent() {
            const { data } = await supabase
                .from('cms_content')
                .select('content')
                .eq('slug', slug)
                .eq('is_published', true)
                .single()

            if (data) {
                setContent(data.content as T)
            }
            setLoading(false)
        }
        loadContent()

        const channel = supabase
            .channel(`cms-${slug}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'cms_content', filter: `slug=eq.${slug}` },
                (payload) => {
                    if (payload.new && (payload.new as any).is_published) {
                        setContent((payload.new as any).content as T)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [slug, supabase])

    return { content, loading }
}
