import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface LoyaltyState {
    points: number
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
    streak: number
    history: any[]
    isLoading: boolean
    fetchLoyalty: () => Promise<void>
    checkIn: () => Promise<void>
    redeemPoints: (amount: number) => Promise<void>
}

export const useLoyalty = create<LoyaltyState>((set, get) => ({
    points: 0,
    tier: 'Bronze',
    streak: 0,
    history: [],
    isLoading: false,

    fetchLoyalty: async () => {
        const supabase = createClient()
        set({ isLoading: true })

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Get Profile Data
            const { data: profile } = await supabase
                .from('profiles')
                .select('loyalty_points, tier, current_streak')
                .eq('id', user.id)
                .single()

            if (profile) {
                set({
                    points: profile.loyalty_points || 0,
                    tier: profile.tier || 'Bronze', // Get from DB
                    streak: profile.current_streak || 0 // Get from DB
                })
            }

            // 2. Get History
            const { data: history } = await supabase
                .from('loyalty_transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10)

            set({ history: history || [] })
        } catch (error) {
            console.error('Loyalty fetch error:', error)
        } finally {
            set({ isLoading: false })
        }
    },

    checkIn: async () => {
        const supabase = createClient()
        try {
            const { data, error } = await supabase.rpc('daily_checkin')

            if (error) throw error

            if (data.success) {
                toast.success(`Check-in successful! +${data.points} FitCoins`)
                get().fetchLoyalty() // Refresh
            } else {
                toast.info(data.message)
            }
        } catch (error) {
            toast.error('Check-in failed. Try again.')
        }
    },

    redeemPoints: async (amount: number) => {
        const supabase = createClient()
        try {
            const { data, error } = await supabase.rpc('redeem_loyalty_points', {
                p_user_id: (await supabase.auth.getUser()).data.user?.id,
                p_points: amount
            })

            if (error) throw error

            if (data.success) {
                toast.success(data.message)
                get().fetchLoyalty() // Refresh
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Redemption failed. Try again.')
            console.error(error)
        }
    }
}))
