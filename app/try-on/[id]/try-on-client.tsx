'use client'

import React from 'react'
import { TryOnExperience } from '@/components/try-on/try-on-experience'

export function TryOnClient({ product }: { product: any }) {
    const formattedProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url || (product.images && (typeof product.images?.[0] === 'string' ? product.images[0] : (product.images?.[0] as any)?.src)) || null,
        image: (product.images && (typeof product.images?.[0] === 'string' ? product.images[0] : (product.images?.[0] as any)?.src)) || product.image_url || null,
        category: product.category || 'tops'
    }

    return (
        <div className="min-h-screen bg-background">
            <TryOnExperience product={formattedProduct} />
        </div>
    )
}
