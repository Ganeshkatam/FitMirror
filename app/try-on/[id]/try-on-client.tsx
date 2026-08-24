'use client'

import React from 'react'
import { TryOnExperience } from '@/components/try-on/try-on-experience'

export function TryOnClient({ product }: { product: any }) {
    const formattedProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url || (product.images && product.images[0]) || null,
        image: (product.images && product.images[0]) || product.image_url || null,
        category: product.category || 'tops'
    }

    return (
        <div className="min-h-screen bg-background">
            <TryOnExperience product={formattedProduct} />
        </div>
    )
}
