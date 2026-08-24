import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PersonalizationService } from '@/lib/service/personalization'
import { OutfitBuilderClient } from '@/components/profile/outfit-builder-client'

export const metadata = {
    title: 'Outfit Builder | FitMirror',
    description: 'Mix and match items to create your perfect look.'
}

export default async function OutfitBuilderPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // specific items for builder: Tops, Bottoms, Shoes
    const wardrobe = await PersonalizationService.getWardrobeItems(user.id)

    // Also fetch some recommendations to "complete" the look
    const recommendations = await PersonalizationService.getRecommendations(user.id, { limit: 12 })

    return (
        <div className="min-h-screen bg-slate-50">
            <OutfitBuilderClient
                wardrobe={wardrobe}
                recommendations={recommendations}
            />
        </div>
    )
}
