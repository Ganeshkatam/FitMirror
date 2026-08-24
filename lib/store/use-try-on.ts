import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { logTryOnEvent } from '@/lib/actions/tryon-analytics'

export interface AvatarConfig {
    skinTone: string
    height: number // cm
    weight: number // kg
    hairStyle: string
    gender: 'female' | 'male'
}

export interface TryOnState {
    sessionId: string | null
    mode: '3d' | '2d'
    userPhoto: string | null
    avatarConfig: AvatarConfig
    isLoading: boolean
    selectedItems: {
        top: string | null
        bottom: string | null
        dress: string | null
        shoes: string | null
    }
    initSession: () => Promise<void>
    setMode: (mode: '3d' | '2d') => void
    setUserPhoto: (photo: string | null) => void
    setAvatarConfig: (config: Partial<AvatarConfig>) => Promise<void>
    setSelectedItem: (category: keyof TryOnState['selectedItems'], productId: string | null) => Promise<void>
}

export const useTryOnStore = create<TryOnState>((set, get) => ({
    sessionId: null,
    mode: '3d',
    userPhoto: null,
    avatarConfig: {
        skinTone: "#F5D0C5",
        height: 170,
        weight: 60,
        hairStyle: "default",
        gender: 'female'
    },
    isLoading: false, // Changed to false initially to avoid blocking UI if DB fails
    selectedItems: {
        top: null,
        bottom: null,
        dress: null,
        shoes: null
    },

    setMode: (mode) => set({ mode }),
    setUserPhoto: (photo) => set({ userPhoto: photo }),

    initSession: async () => {
        const supabase = createClient()
        try {
            const { data: { user } } = await supabase.auth.getUser()

            // 1. Try to recover session from localStorage first
            let currentSessionId = get().sessionId
            if (!currentSessionId && typeof window !== 'undefined') {
                currentSessionId = localStorage.getItem('tryon_session_id')
            }

            // 2. If we have a local session ID, verify it exists in DB
            if (currentSessionId) {
                const { data: existing } = await supabase
                    .from('tryon_sessions')
                    .select('*')
                    .eq('id', currentSessionId)
                    .maybeSingle()

                if (existing) {
                    set({
                        sessionId: existing.id,
                        avatarConfig: existing.avatar_config as any || get().avatarConfig,
                        selectedItems: existing.selected_items as any || get().selectedItems
                    })

                    // If user just logged in but session was guest, update user_id
                    if (user && !existing.user_id) {
                        await supabase
                            .from('tryon_sessions')
                            .update({ user_id: user.id })
                            .eq('id', existing.id)
                    }
                    return
                }
            }

            // 3. If no valid session found, look for existing user session (if logged in)
            if (user) {
                const { data: existingUserSession } = await supabase
                    .from('tryon_sessions')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (existingUserSession) {
                    set({
                        sessionId: existingUserSession.id,
                        avatarConfig: existingUserSession.avatar_config as any || get().avatarConfig,
                        selectedItems: existingUserSession.selected_items as any || get().selectedItems
                    })
                    // Update local storage
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('tryon_session_id', existingUserSession.id)
                    }
                    return
                }
            }

            // 4. Create new session (for Guest or new User)
            // Note: We attempt to create a session even for guests. 
            // If RLS prevents guest inserts, we'll fall back to local-only.
            const { data: newSession, error } = await supabase
                .from('tryon_sessions')
                .insert({
                    user_id: user?.id || null, // Null for guests
                    avatar_config: get().avatarConfig,
                    selected_items: get().selectedItems
                })
                .select()
                .single()

            if (error) {
                // Determine if error is authentication related (RLS)
                // If so, generate a local ID and continue without DB sync
                if (!user) {
                    console.warn('Guest session DB insert failed (likely RLS), running in local-only mode')
                    const localId = crypto.randomUUID()
                    set({ sessionId: localId })
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('tryon_session_id', localId)
                    }
                    return
                }
                throw error
            }

            if (newSession) {
                set({ sessionId: newSession.id })
                if (typeof window !== 'undefined') {
                    localStorage.setItem('tryon_session_id', newSession.id)
                }

                // Log session start for analytics
                await logTryOnEvent({
                    sessionId: newSession.id,
                    actionType: 'session_started'
                })
            }

        } catch (error) {
            console.error('Failed to init Try-On session:', error)
            // Don't toast error for guests to avoid confusion
        }
    },

    setAvatarConfig: async (config) => {
        // Optimistic Update
        const oldConfig = get().avatarConfig
        const newConfig = { ...oldConfig, ...config }
        set({ avatarConfig: newConfig })

        const { sessionId } = get()
        if (!sessionId) return

        const supabase = createClient()
        const { error } = await supabase
            .from('tryon_sessions')
            .update({ avatar_config: newConfig })
            .eq('id', sessionId)

        if (error) {
            console.error('DB Sync Error:', error)
            set({ avatarConfig: oldConfig }) // Revert
            toast.error('Failed to save avatar changes')
        }
    },

    setSelectedItem: async (category, productId) => {
        // Optimistic Update
        const oldItems = get().selectedItems
        const newItems = { ...oldItems, [category]: productId }
        set({ selectedItems: newItems })

        // Log analytics event
        const { sessionId } = get()
        if (sessionId && productId) {
            logTryOnEvent({
                sessionId,
                actionType: 'item_added',
                payload: { category, productId }
            })
        } else if (sessionId && !productId && oldItems[category]) {
            logTryOnEvent({
                sessionId,
                actionType: 'item_removed',
                payload: { category, previousProductId: oldItems[category] }
            })
        }

        if (!sessionId) return

        const supabase = createClient()
        const { error } = await supabase
            .from('tryon_sessions')
            .update({ selected_items: newItems })
            .eq('id', sessionId)

        if (error) {
            console.error('DB Sync Error:', error)
            set({ selectedItems: oldItems }) // Revert
            toast.error('Failed to save selection')
        }
    }
}))
