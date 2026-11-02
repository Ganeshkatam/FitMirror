import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StorefrontService } from '@/lib/service/storefront'
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

    // Fetch user wishlist items for builder
    const { data: wishlist } = await supabase
        .from('wishlists')
        .select('product_id, created_at, products(*, product_media(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

    const wardrobe = wishlist?.map((i: any) => ({
        id: i.products?.id,
        name: i.products?.name,
        price: i.products?.price,
        category: i.products?.category,
        image_url: i.products?.product_media?.[0]?.url || i.products?.image_url,
        status: 'saved'
    })).filter((i: any) => i.id) || []

    const recommendations = await StorefrontService.getFeaturedProducts()

    return (
        <div className="min-h-screen bg-slate-50">
            <OutfitBuilderClient
                wardrobe={wardrobe}
                recommendations={recommendations}
            />
        </div>
    )
}
