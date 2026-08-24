import { createClient } from '@/lib/supabase/server'
import { ProductCard, type Product } from '@/components/product/product-card'

interface SuggestedProductsProps {
    currentProductId: string
    category: string
}

export async function SuggestedProducts({ currentProductId, category }: SuggestedProductsProps) {
    const supabase = await createClient()

    // Fetch up to 12 products for the carousel
    const { data: suggestions } = await supabase
        .from('products')
        .select('*, product_inventory(*)')
        .eq('category', category)
        .eq('is_active', true)
        .neq('id', currentProductId) // Exclude current product
        .limit(12)

    if (!suggestions || suggestions.length === 0) return null

    return (
        <div className="space-y-6 animate-fade-in py-8 border-t">
            <h2 className="text-2xl font-serif font-bold">You Might Also Like</h2>
            {/* Horizontal Scroll Container */}
            <div className="flex overflow-x-auto pb-6 -mx-4 px-4 gap-4 md:gap-6 snap-x snap-mandatory scrollbar-hide">
                {(suggestions as unknown as Product[]).map((product) => (
                    <div key={product.id} className="min-w-[280px] max-w-[280px] snap-center">
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </div>
    )
}
