'use client'

import React from 'react'
import { ProductCard } from '@/components/product/product-card'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

interface Product {
    id: string
    name: string
    price: number
    images?: string[] | null
    image_url?: string | null
    category?: string | null
    brand?: string | null
    is_active?: boolean
}

interface TabbedRecommendationsProps {
    products: Product[]
    completeTheLookProducts?: Product[]
    currentProductId: string
}

const TABS = [
    { id: 'similar', label: 'Similar' },
    { id: 'complete', label: 'Complete Look' },
    { id: 'ai', label: 'AI Picks' },
] as const

type TabId = typeof TABS[number]['id']

export function TabbedRecommendations({
    products,
    completeTheLookProducts = [],
    currentProductId,
}: TabbedRecommendationsProps) {
    const [activeTab, setActiveTab] = React.useState<TabId>('similar')

    // Filter out current product from all lists
    const filtered = products.filter(p => p.id !== currentProductId)
    const ctlFiltered = completeTheLookProducts.filter(p => p.id !== currentProductId)

    // AI picks = shuffle of products (simulated until real AI endpoint exists)
    const aiPicks = React.useMemo(() => {
        const shuffled = [...filtered]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled.slice(0, 8)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentProductId])

    const activeProducts = activeTab === 'similar'
        ? filtered.slice(0, 12)
        : activeTab === 'complete'
            ? ctlFiltered.length > 0 ? ctlFiltered : filtered.slice(0, 8)
            : aiPicks

    if (filtered.length === 0) return null

    return (
        <section className="space-y-4 py-6 md:py-8 border-t animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg md:text-2xl font-serif font-bold">Products you may like</h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all border",
                            activeTab === tab.id
                                ? "bg-[#ff3f6c] text-white border-[#ff3f6c] shadow-sm"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                {activeProducts.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={{
                            ...product,
                            images: product.images || (product.image_url ? [product.image_url] : undefined),
                        }}
                        showQuickAdd
                    />
                ))}
            </div>
        </section>
    )
}
